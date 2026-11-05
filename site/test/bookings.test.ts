import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { completedSession, event, resetDb, setupEnv, signedRequest } from './helpers';

setupEnv();

const { getSql } = await import('@/lib/db');
const { reserveSeat, attachCheckoutSession } = await import('@/lib/bookings');
const { runScheduledEmails, sendBookingEmail } = await import('@/lib/mail');
const { checkoutParams } = await import('@/lib/stripe');
const webhook = await import('@/app/api/stripe/webhook/route');
const cron = await import('@/app/api/cron/emails/route');

const sql = getSql();

async function makeCohort(over: Record<string, unknown> = {}) {
  const [c] = await sql`
    insert into cohorts ${sql({
      slug: `c-${Math.random().toString(36).slice(2, 8)}`,
      title: 'Fieldwork: test day',
      starts_at: new Date(Date.now() + 20 * 86400_000),
      ends_at: new Date(Date.now() + 20 * 86400_000 + 7 * 3600_000),
      capacity: 2,
      price_cents: 75000,
      status: 'open',
      ...over,
    })} returning *`;
  return c as { id: string; slug: string };
}

/** Reserve a seat the way the checkout action does, returning the booking and a session id. */
async function reserveWithSession(slug: string) {
  const r = await reserveSeat(sql, slug);
  if (!r.ok) throw new Error(r.reason);
  const sessionId = `cs_test_${r.booking.id.slice(0, 8)}`;
  await attachCheckoutSession(sql, r.booking.id, sessionId);
  return { booking: r.booking, cohort: r.cohort, sessionId };
}

beforeAll(async () => {
  await resetDb();
});
beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.RESEND_API_KEY;
});
afterAll(async () => {
  await sql.end();
});

describe('seat holds', () => {
  it('gives the last seats to exactly as many buyers as there are seats, under a race', async () => {
    const c = await makeCohort({ capacity: 2 });
    const results = await Promise.all(Array.from({ length: 6 }, () => reserveSeat(sql, c.slug)));
    expect(results.filter((r) => r.ok)).toHaveLength(2);
    expect(results.filter((r) => !r.ok && r.reason === 'sold_out')).toHaveLength(4);
  });

  it('frees a seat when a hold lapses', async () => {
    const c = await makeCohort({ capacity: 1 });
    const first = await reserveSeat(sql, c.slug);
    expect(first.ok).toBe(true);
    expect((await reserveSeat(sql, c.slug)).ok).toBe(false);
    await sql`update bookings set hold_expires_at = now() - interval '1 minute' where cohort_id = ${c.id}`;
    expect((await reserveSeat(sql, c.slug)).ok).toBe(true);
  });

  it('refuses closed, draft and past cohorts', async () => {
    const closed = await makeCohort({ status: 'closed' });
    const past = await makeCohort({ starts_at: new Date(Date.now() - 3600_000), ends_at: new Date(Date.now() - 60_000) });
    expect(await reserveSeat(sql, closed.slug)).toEqual({ ok: false, reason: 'closed' });
    expect(await reserveSeat(sql, past.slug)).toEqual({ ok: false, reason: 'closed' });
    expect(await reserveSeat(sql, 'nope')).toEqual({ ok: false, reason: 'not_found' });
  });

  it('builds a Checkout session with three custom fields and a lifetime Stripe accepts', async () => {
    const c = await makeCohort();
    const { booking, cohort } = await reserveWithSession(c.slug);
    const now = new Date();
    const p = checkoutParams(cohort, booking, now);
    expect(p.custom_fields?.map((f) => f.key)).toEqual(['company', 'abn', 'dietary']);
    expect(p.custom_fields?.every((f) => f.label.custom!.length <= 50)).toBe(true);
    expect(p.expires_at! - Math.floor(now.getTime() / 1000)).toBeGreaterThanOrEqual(30 * 60);
    expect(p.metadata).toEqual({ booking_id: booking.id, cohort_id: cohort.id });
    expect(p.success_url).toBe('https://fieldwork.test/book/success?session_id={CHECKOUT_SESSION_ID}');
    // The hold must outlast the session.
    expect(booking.hold_expires_at!.getTime()).toBeGreaterThan(p.expires_at! * 1000);
  });
});

describe('Stripe webhook', () => {
  it('rejects a bad signature', async () => {
    const res = await webhook.POST(signedRequest(event('checkout.session.completed', completedSession()), 'whsec_wrong'));
    expect(res.status).toBe(400);
  });

  it('marks the booking paid, stores the custom fields, and confirms once even when redelivered', async () => {
    const c = await makeCohort();
    const { booking, sessionId } = await reserveWithSession(c.slug);
    const evt = event('checkout.session.completed', completedSession({ id: sessionId, metadata: { booking_id: booking.id, cohort_id: c.id } }));

    const res = await webhook.POST(signedRequest(evt));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ duplicate: false, confirmed: 1 });

    const [b] = await sql`select * from bookings where id = ${booking.id}`;
    expect(b).toMatchObject({
      status: 'paid',
      name: 'Sam Rivera',
      email: 'sam@example.com',
      company: 'Harbour Survey Co',
      abn: '51824753556',
      abn_valid: true,
      dietary: 'Vegetarian',
      amount_total_cents: 75000,
      hold_expires_at: null,
    });

    const again = await webhook.POST(signedRequest(evt));
    expect(await again.json()).toMatchObject({ duplicate: true });

    const log = await sql`select kind, status from email_log where booking_id = ${booking.id}`;
    expect(log).toEqual([{ kind: 'confirmation', status: 'logged' }]);
  });

  it('flags an ABN that fails the checksum without rejecting the payment', async () => {
    const c = await makeCohort();
    const { sessionId } = await reserveWithSession(c.slug);
    const session = completedSession({ id: sessionId });
    (session.custom_fields as { key: string; numeric?: { value: string } }[])[1].numeric = { value: '51824753557' };
    await webhook.POST(signedRequest(event('checkout.session.completed', session)));
    const [b] = await sql`select status, abn_valid from bookings where stripe_checkout_session_id = ${sessionId}`;
    expect(b).toEqual({ status: 'paid', abn_valid: false });
  });

  it('creates a booking for a session that only names the cohort (e.g. a Payment Link)', async () => {
    const c = await makeCohort();
    const session = completedSession({ metadata: { cohort_id: c.id } });
    await webhook.POST(signedRequest(event('checkout.session.completed', session)));
    const [b] = await sql`select status, cohort_id from bookings where stripe_checkout_session_id = ${session.id}`;
    expect(b).toEqual({ status: 'paid', cohort_id: c.id });
  });

  it('holds the seat while a bank debit clears, then confirms', async () => {
    const c = await makeCohort();
    const { booking, sessionId } = await reserveWithSession(c.slug);
    await webhook.POST(signedRequest(event('checkout.session.completed', completedSession({ id: sessionId, payment_status: 'unpaid' }))));
    let [b] = await sql`select status, hold_expires_at, email from bookings where id = ${booking.id}`;
    expect(b.status).toBe('pending');
    expect(b.hold_expires_at.getTime()).toBeGreaterThan(Date.now() + 9 * 86400_000);
    expect(b.email).toBe('sam@example.com');

    await webhook.POST(signedRequest(event('checkout.session.async_payment_succeeded', completedSession({ id: sessionId }))));
    [b] = await sql`select status from bookings where id = ${booking.id}`;
    expect(b.status).toBe('paid');
  });

  it('releases the seat when the session expires', async () => {
    const c = await makeCohort({ capacity: 1 });
    const { booking, sessionId } = await reserveWithSession(c.slug);
    await webhook.POST(signedRequest(event('checkout.session.expired', { id: sessionId, object: 'checkout.session' })));
    const [b] = await sql`select status from bookings where id = ${booking.id}`;
    expect(b.status).toBe('expired');
    expect((await reserveSeat(sql, c.slug)).ok).toBe(true);
  });

  it('marks a full refund as refunded and notes a partial one', async () => {
    const c = await makeCohort();
    const { sessionId } = await reserveWithSession(c.slug);
    const session = completedSession({ id: sessionId });
    await webhook.POST(signedRequest(event('checkout.session.completed', session)));

    const charge = { id: 'ch_1', object: 'charge', payment_intent: session.payment_intent, amount: 75000 };
    await webhook.POST(signedRequest(event('charge.refunded', { ...charge, amount_refunded: 25000 })));
    let [b] = await sql`select status, admin_notes from bookings where stripe_checkout_session_id = ${sessionId}`;
    expect(b.status).toBe('paid');
    expect(b.admin_notes).toMatch(/Partial refund 25000/);

    await webhook.POST(signedRequest(event('charge.refunded', { ...charge, amount_refunded: 75000 })));
    [b] = await sql`select status from bookings where stripe_checkout_session_id = ${sessionId}`;
    expect(b.status).toBe('refunded');
  });
});

describe('scheduled emails', () => {
  it('sends the pre-course email inside its window, once', async () => {
    const start = new Date(Date.now() + 3 * 86400_000);
    const c = await makeCohort({ starts_at: start, ends_at: new Date(start.getTime() + 7 * 3600_000), pre_course_days: 5 });
    const [b] = await sql`
      insert into bookings (cohort_id, status, source, name, email) values (${c.id}, 'comp', 'manual', 'Alex Tan', 'alex@example.com') returning id`;

    const first = await runScheduledEmails(sql);
    expect(first.filter((r) => r.booking_id === b.id)).toEqual([{ booking_id: b.id, kind: 'pre_course', outcome: 'logged' }]);
    const second = await runScheduledEmails(sql);
    expect(second.filter((r) => r.booking_id === b.id)).toEqual([]);
  });

  it('sends the follow-up after the end and not to cancelled bookings', async () => {
    const end = new Date(Date.now() - 2 * 86400_000);
    const c = await makeCohort({ starts_at: new Date(end.getTime() - 7 * 3600_000), ends_at: end, status: 'closed' });
    const [kept] = await sql`
      insert into bookings (cohort_id, status, source, name, email) values (${c.id}, 'paid', 'manual', 'Kim', 'kim@example.com') returning id`;
    const [gone] = await sql`
      insert into bookings (cohort_id, status, source, name, email) values (${c.id}, 'cancelled', 'manual', 'Lee', 'lee@example.com') returning id`;
    const out = await runScheduledEmails(sql);
    expect(out.find((r) => r.booking_id === kept.id)?.kind).toBe('follow_up');
    expect(out.find((r) => r.booking_id === gone.id)).toBeUndefined();
  });

  it('records a provider failure and retries it on the next run', async () => {
    const start = new Date(Date.now() + 86400_000);
    const c = await makeCohort({ starts_at: start, ends_at: new Date(start.getTime() + 3600_000) });
    const [b] = await sql`
      insert into bookings (cohort_id, status, source, name, email) values (${c.id}, 'paid', 'manual', 'Jo', 'jo@example.com') returning id`;

    process.env.RESEND_API_KEY = 're_test';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
      .mockResolvedValueOnce(Response.json({ id: 'email_123' }));

    expect(await sendBookingEmail(sql, b.id, 'pre_course')).toBe('failed');
    let [row] = await sql`select status, error from email_log where booking_id = ${b.id}`;
    expect(row.status).toBe('failed');
    expect(row.error).toMatch(/Resend 500/);

    expect(await sendBookingEmail(sql, b.id, 'pre_course')).toBe('sent');
    [row] = await sql`select status, provider_id from email_log where booking_id = ${b.id}`;
    expect(row).toEqual({ status: 'sent', provider_id: 'email_123' });
    expect(await sendBookingEmail(sql, b.id, 'pre_course')).toBe('already_sent');

    const [, init] = fetchMock.mock.calls[1];
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.to).toEqual(['jo@example.com']);
    expect(body.subject).toMatch(/what to bring/);
    expect((init as RequestInit).headers).toMatchObject({ 'Idempotency-Key': `${b.id}:pre_course` });
  });

  it('protects the cron endpoint with the shared secret', async () => {
    const denied = await cron.GET(new Request('https://fieldwork.test/api/cron/emails'));
    expect(denied.status).toBe(401);
    const ok = await cron.GET(new Request('https://fieldwork.test/api/cron/emails', { headers: { authorization: 'Bearer cron-secret' } }));
    expect(ok.status).toBe(200);
  });
});
