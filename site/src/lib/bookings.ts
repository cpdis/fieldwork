import type Stripe from 'stripe';
import type { Sql } from './db';
import type { Booking, Cohort } from './types';
import { isValidAbn, normaliseAbn } from './abn';

/** Stripe's minimum Checkout lifetime is 30 minutes. We add a minute of slack. */
export const CHECKOUT_LIFETIME_MS = 31 * 60 * 1000;
/** The seat hold outlives the Checkout session so a payment made in its last second still has a seat. */
export const HOLD_LIFETIME_MS = CHECKOUT_LIFETIME_MS + 4 * 60 * 1000;
/** Bank debits (BECS) can take days to clear; hold the seat while they do. */
export const ASYNC_PAYMENT_HOLD_MS = 10 * 24 * 60 * 60 * 1000;

export type ReserveResult =
  | { ok: true; cohort: Cohort; booking: Booking }
  | { ok: false; reason: 'not_found' | 'closed' | 'sold_out' };

/**
 * Holds one seat for a Checkout session. The cohort row is locked for the
 * duration of the count and insert, so two buyers racing for the last seat
 * cannot both get it.
 */
export async function reserveSeat(sql: Sql, slug: string, now = new Date()): Promise<ReserveResult> {
  return sql.begin(async (tx) => {
    const [cohort] = await tx<Cohort[]>`select * from cohorts where slug = ${slug} for update`;
    if (!cohort) return { ok: false, reason: 'not_found' } as const;
    if (cohort.status !== 'open' || cohort.starts_at <= now) return { ok: false, reason: 'closed' } as const;

    const [{ n }] = await tx<{ n: number }[]>`
      select count(*)::int as n from bookings
      where cohort_id = ${cohort.id}
        and (status in ('paid','comp') or (status = 'pending' and hold_expires_at > ${now}))
    `;
    if (n >= cohort.capacity) return { ok: false, reason: 'sold_out' } as const;

    const [booking] = await tx<Booking[]>`
      insert into bookings (cohort_id, status, source, hold_expires_at, currency)
      values (${cohort.id}, 'pending', 'stripe', ${new Date(now.getTime() + HOLD_LIFETIME_MS)}, ${cohort.currency})
      returning *
    `;
    return { ok: true, cohort, booking } as const;
  });
}

export async function attachCheckoutSession(sql: Sql, bookingId: string, sessionId: string) {
  await sql`update bookings set stripe_checkout_session_id = ${sessionId} where id = ${bookingId}`;
}

/** Called when creating the Checkout session fails, so the hold doesn't block a seat for half an hour. */
export async function releaseHold(sql: Sql, bookingId: string) {
  await sql`update bookings set status = 'expired', hold_expires_at = now() where id = ${bookingId} and status = 'pending'`;
}

export interface ApplyResult {
  /** Bookings that just became paid, for the confirmation email. */
  confirmed: string[];
  note?: string;
}

type CustomField = Stripe.Checkout.Session.CustomField;

function customValue(fields: CustomField[] | undefined, key: string): string | null {
  const f = fields?.find((x) => x.key === key);
  if (!f) return null;
  const v = f.type === 'text' ? f.text?.value : f.type === 'numeric' ? f.numeric?.value : f.dropdown?.value;
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
}

function idOf(x: string | { id: string } | null | undefined): string | null {
  if (!x) return null;
  return typeof x === 'string' ? x : x.id;
}

/** Finds the booking for a session, creating one if the session came from outside the site but names a cohort. */
async function bookingForSession(tx: Sql, session: Stripe.Checkout.Session): Promise<Booking | null> {
  const [bySession] = await tx<Booking[]>`
    select * from bookings where stripe_checkout_session_id = ${session.id} for update
  `;
  if (bySession) return bySession;

  const bookingId = session.metadata?.booking_id ?? session.client_reference_id;
  if (bookingId && /^[0-9a-f-]{36}$/i.test(bookingId)) {
    const [byId] = await tx<Booking[]>`select * from bookings where id = ${bookingId} for update`;
    if (byId) return byId;
  }

  const cohortId = session.metadata?.cohort_id;
  if (cohortId && /^[0-9a-f-]{36}$/i.test(cohortId)) {
    const [created] = await tx<Booking[]>`
      insert into bookings (cohort_id, status, source, stripe_checkout_session_id, currency)
      select id, 'pending', 'stripe', ${session.id}, currency from cohorts where id = ${cohortId}
      returning *
    `;
    return created ?? null;
  }
  return null;
}

function detailsFrom(session: Stripe.Checkout.Session) {
  const abn = normaliseAbn(customValue(session.custom_fields, 'abn'));
  return {
    name: session.customer_details?.name ?? null,
    email: session.customer_details?.email?.toLowerCase() ?? null,
    phone: session.customer_details?.phone ?? null,
    company: customValue(session.custom_fields, 'company'),
    abn,
    abn_valid: abn ? isValidAbn(abn) : null,
    dietary: customValue(session.custom_fields, 'dietary'),
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: idOf(session.payment_intent),
    amount_total_cents: session.amount_total ?? null,
    currency: session.currency ?? null,
  };
}

async function markPaid(tx: Sql, booking: Booking, session: Stripe.Checkout.Session, now: Date) {
  const d = detailsFrom(session);
  await tx`
    update bookings set ${tx(d)}, status = 'paid', paid_at = ${now}, hold_expires_at = null
    where id = ${booking.id}
  `;
}

/**
 * Applies one verified Stripe event inside the caller's transaction. Returns
 * which bookings need a confirmation email once the transaction commits.
 */
export async function applyStripeEvent(tx: Sql, event: Stripe.Event, now = new Date()): Promise<ApplyResult> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const booking = await bookingForSession(tx, session);
      if (!booking) return { confirmed: [], note: 'no booking or cohort for session' };
      if (booking.status === 'paid' || booking.status === 'comp') return { confirmed: [], note: 'already paid' };

      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        await markPaid(tx, booking, session, now);
        return { confirmed: [booking.id] };
      }
      // Delayed method such as BECS direct debit: record who it is and keep holding the seat.
      const d = detailsFrom(session);
      await tx`
        update bookings set ${tx(d)}, status = 'pending',
          hold_expires_at = ${new Date(now.getTime() + ASYNC_PAYMENT_HOLD_MS)}
        where id = ${booking.id}
      `;
      return { confirmed: [], note: 'awaiting async payment' };
    }

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object;
      const booking = await bookingForSession(tx, session);
      if (!booking || booking.status === 'paid') return { confirmed: [] };
      await markPaid(tx, booking, session, now);
      return { confirmed: [booking.id] };
    }

    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      const session = event.data.object;
      await tx`
        update bookings set status = 'expired', hold_expires_at = null
        where stripe_checkout_session_id = ${session.id} and status = 'pending'
      `;
      return { confirmed: [] };
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      const pi = idOf(charge.payment_intent);
      if (!pi) return { confirmed: [] };
      if (charge.amount_refunded < charge.amount) {
        await tx`
          update bookings set admin_notes = concat_ws(E'\n', admin_notes, ${`Partial refund ${charge.amount_refunded} cents on ${now.toISOString().slice(0, 10)}`}::text)
          where stripe_payment_intent_id = ${pi}
        `;
        return { confirmed: [], note: 'partial refund noted' };
      }
      await tx`
        update bookings set status = 'refunded', cancelled_at = coalesce(cancelled_at, ${now})
        where stripe_payment_intent_id = ${pi} and status in ('paid','cancelled')
      `;
      return { confirmed: [] };
    }

    default:
      return { confirmed: [], note: `ignored ${event.type}` };
  }
}

/**
 * Records the event id and applies it in one transaction. A redelivered event
 * is a no-op. If applying throws, the event id is rolled back too, so Stripe's
 * retry gets another go.
 */
export async function processStripeEvent(sql: Sql, event: Stripe.Event, now = new Date()) {
  return sql.begin(async (tx) => {
    const inserted = await tx`
      insert into stripe_events (id, type) values (${event.id}, ${event.type})
      on conflict (id) do nothing returning id
    `;
    if (!inserted.length) return { duplicate: true, confirmed: [] as string[] };
    const result = await applyStripeEvent(tx, event, now);
    return { duplicate: false, ...result };
  });
}
