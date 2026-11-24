import type { Sql } from './db';
import { renderBookingEmail, renderSeatOffer, type Rendered } from './email-templates';
import type { Booking, Cohort, EmailKind, WaitlistEntry } from './types';

export interface Delivery {
  mode: 'sent' | 'logged';
  providerId: string | null;
}

/**
 * Sends through Resend's HTTP API. With no RESEND_API_KEY (local dev, previews)
 * the email is printed and logged instead of sent.
 */
export async function deliver(to: string, msg: Rendered, idempotencyKey: string): Promise<Delivery> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:logged] to=${to} subject=${JSON.stringify(msg.subject)}`);
    return { mode: 'logged', providerId: null };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Fieldwork <onboarding@resend.dev>',
      to: [to],
      reply_to: process.env.EMAIL_REPLY_TO || undefined,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { id?: string };
  return { mode: 'sent', providerId: body.id ?? null };
}

export type SendOutcome = 'sent' | 'logged' | 'already_sent' | 'skipped' | 'failed';

/** A stuck "sending" row older than this is assumed dead and may be retried. */
const STALE_SENDING = '15 minutes';

/**
 * Sends one booking email at most once per (booking, kind). The email_log row
 * is claimed before sending, so overlapping cron runs or a webhook retry can't
 * double-send. `force` resends even if it already went (the admin's "resend").
 */
export async function sendBookingEmail(
  sql: Sql,
  bookingId: string,
  kind: Exclude<EmailKind, 'seat_offer'>,
  opts: { force?: boolean } = {},
): Promise<SendOutcome> {
  const [booking] = await sql<Booking[]>`select * from bookings where id = ${bookingId}`;
  if (!booking?.email || !['paid', 'comp'].includes(booking.status)) return 'skipped';
  const [cohort] = await sql<Cohort[]>`select * from cohorts where id = ${booking.cohort_id}`;
  if (!cohort || cohort.status === 'cancelled') return 'skipped';

  const claimed = await sql<{ id: string }[]>`
    insert into email_log (booking_id, kind, to_email, status)
    values (${booking.id}, ${kind}, ${booking.email}, 'sending')
    on conflict (booking_id, kind) where booking_id is not null do update
      set status = 'sending', error = null, to_email = excluded.to_email, created_at = now()
      where ${opts.force ? sql`true` : sql`email_log.status = 'failed' or (email_log.status = 'sending' and email_log.created_at < now() - ${STALE_SENDING}::interval)`}
    returning id
  `;
  if (!claimed.length) return 'already_sent';
  const logId = claimed[0].id;

  try {
    const msg = renderBookingEmail(kind, cohort, booking);
    const key = opts.force ? `${booking.id}:${kind}:${Date.now()}` : `${booking.id}:${kind}`;
    const d = await deliver(booking.email, msg, key);
    await sql`
      update email_log set status = ${d.mode}, provider_id = ${d.providerId}, sent_at = now() where id = ${logId}
    `;
    return d.mode;
  } catch (err) {
    await sql`update email_log set status = 'failed', error = ${String(err).slice(0, 500)} where id = ${logId}`;
    console.error(`[email:failed] booking=${booking.id} kind=${kind}`, err);
    return 'failed';
  }
}

export async function sendSeatOffer(sql: Sql, waitlistId: string): Promise<SendOutcome> {
  const [entry] = await sql<WaitlistEntry[]>`select * from waitlist where id = ${waitlistId} and removed_at is null`;
  if (!entry) return 'skipped';
  const [cohort] = await sql<Cohort[]>`select * from cohorts where id = ${entry.cohort_id}`;
  if (!cohort) return 'skipped';
  const [{ id: logId }] = await sql<{ id: string }[]>`
    insert into email_log (waitlist_id, kind, to_email, status)
    values (${entry.id}, 'seat_offer', ${entry.email}, 'sending') returning id
  `;
  try {
    const d = await deliver(entry.email, renderSeatOffer(cohort, entry), `offer:${logId}`);
    await sql`update email_log set status = ${d.mode}, provider_id = ${d.providerId}, sent_at = now() where id = ${logId}`;
    await sql`update waitlist set offered_at = now() where id = ${entry.id}`;
    return d.mode;
  } catch (err) {
    await sql`update email_log set status = 'failed', error = ${String(err).slice(0, 500)} where id = ${logId}`;
    return 'failed';
  }
}

/**
 * Finds every booking due a pre-course or follow-up email and sends it. Safe to
 * run as often as you like: each email is claimed once.
 *
 * Pre-course: from `pre_course_days` before the start until the start.
 * Follow-up: from `follow_up_days` after the end, for 14 days (so a stalled cron
 * doesn't send a "thanks for coming" a month late).
 */
export async function runScheduledEmails(sql: Sql, now = new Date()) {
  const due = await sql<{ booking_id: string; kind: 'pre_course' | 'follow_up' }[]>`
    select b.id as booking_id, k.kind
    from bookings b
    join cohorts c on c.id = b.cohort_id
    cross join (values ('pre_course'), ('follow_up')) as k(kind)
    where b.status in ('paid','comp')
      and b.email is not null
      and c.status <> 'cancelled'
      and (
        (k.kind = 'pre_course'
          and ${now} >= c.starts_at - make_interval(days => c.pre_course_days)
          and ${now} < c.starts_at)
        or
        (k.kind = 'follow_up'
          and ${now} >= c.ends_at + make_interval(days => c.follow_up_days)
          and ${now} < c.ends_at + make_interval(days => c.follow_up_days + 14))
      )
      and not exists (
        select 1 from email_log e
        where e.booking_id = b.id and e.kind = k.kind and e.status in ('sent','logged')
      )
    order by c.starts_at, b.paid_at
  `;
  const results: { booking_id: string; kind: string; outcome: SendOutcome }[] = [];
  for (const row of due) {
    results.push({ ...row, outcome: await sendBookingEmail(sql, row.booking_id, row.kind) });
  }
  return results;
}
