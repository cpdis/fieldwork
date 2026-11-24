'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { normaliseAbn, isValidAbn } from '@/lib/abn';
import { checkPassword, endSession, requireAdmin, startSession } from '@/lib/auth';
import { insertCohort, updateCohort, type CohortInput } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { sendBookingEmail, sendSeatOffer } from '@/lib/mail';
import { parsePerthLocal } from '@/lib/time';
import type { CohortStatus, EmailKind } from '@/lib/types';

export interface FormState {
  error?: string;
}

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const opt = (f: FormData, k: string) => str(f, k) || null;

export async function login(_prev: FormState | null, formData: FormData): Promise<FormState> {
  // A fixed delay blunts password guessing without needing a store for rate limits.
  await new Promise((r) => setTimeout(r, 400));
  if (!checkPassword(str(formData, 'password'))) return { error: 'Wrong password.' };
  await startSession();
  redirect('/admin');
}

export async function logout() {
  await endSession();
  redirect('/admin/login');
}

function readCohort(f: FormData): CohortInput {
  const slug = str(f, 'slug').toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error('The URL name can use lowercase letters, numbers and single hyphens.');
  const starts_at = parsePerthLocal(str(f, 'starts_at'));
  const ends_at = parsePerthLocal(str(f, 'ends_at'));
  if (ends_at <= starts_at) throw new Error('The end must be after the start.');
  const capacity = Number(str(f, 'capacity'));
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Capacity must be a whole number above zero.');
  const dollars = Number(str(f, 'price'));
  if (!Number.isFinite(dollars) || dollars < 0) throw new Error('Price must be a number of dollars.');
  const status = str(f, 'status') as CohortStatus;
  if (!['draft', 'open', 'closed', 'cancelled'].includes(status)) throw new Error('Unknown status.');
  return {
    slug,
    title: str(f, 'title') || 'Fieldwork',
    starts_at,
    ends_at,
    venue_name: opt(f, 'venue_name'),
    venue_address: opt(f, 'venue_address'),
    joining_notes: opt(f, 'joining_notes'),
    capacity,
    price_cents: Math.round(dollars * 100),
    status,
    pre_course_days: Number(str(f, 'pre_course_days') || 5),
    follow_up_days: Number(str(f, 'follow_up_days') || 1),
  };
}

export async function saveCohort(id: string | null, _prev: FormState | null, formData: FormData): Promise<FormState> {
  await requireAdmin();
  let savedId: string;
  try {
    const input = readCohort(formData);
    const sql = getSql();
    savedId = id ? (await updateCohort(sql, id, input)).id : (await insertCohort(sql, input)).id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: /cohorts_slug_key/.test(msg) ? 'Another cohort already uses that URL name.' : msg };
  }
  revalidatePath('/admin');
  redirect(`/admin/cohorts/${savedId}`);
}

export async function addManualBooking(cohortId: string, _prev: FormState | null, f: FormData): Promise<FormState> {
  await requireAdmin();
  const email = str(f, 'email').toLowerCase();
  const name = str(f, 'name');
  if (!name) return { error: 'A name is needed.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'That email looks wrong.' };
  const abn = normaliseAbn(opt(f, 'abn'));
  const paidCents = str(f, 'amount') ? Math.round(Number(str(f, 'amount')) * 100) : null;
  const sql = getSql();
  const [b] = await sql<{ id: string }[]>`
    insert into bookings (cohort_id, status, source, name, email, company, abn, abn_valid, dietary, admin_notes, amount_total_cents, currency, paid_at)
    select ${cohortId}, 'comp', 'manual', ${name}, ${email || null}, ${opt(f, 'company')}, ${abn}, ${abn ? isValidAbn(abn) : null},
           ${opt(f, 'dietary')}, ${opt(f, 'admin_notes')}, ${paidCents}, currency, now()
    from cohorts where id = ${cohortId}
    returning id
  `;
  if (b && email && f.get('send_confirmation') === 'on') await sendBookingEmail(sql, b.id, 'confirmation');
  revalidatePath(`/admin/cohorts/${cohortId}`);
  return {};
}

export async function updateBooking(bookingId: string, cohortId: string, f: FormData) {
  await requireAdmin();
  const abn = normaliseAbn(opt(f, 'abn'));
  const sql = getSql();
  await sql`
    update bookings set
      name = ${opt(f, 'name')}, email = ${opt(f, 'email')?.toLowerCase() ?? null}, company = ${opt(f, 'company')},
      abn = ${abn}, abn_valid = ${abn ? isValidAbn(abn) : null}, dietary = ${opt(f, 'dietary')}, admin_notes = ${opt(f, 'admin_notes')}
    where id = ${bookingId}
  `;
  revalidatePath(`/admin/cohorts/${cohortId}`);
}

/** Frees the seat. A Stripe refund is separate: issue it in the Stripe dashboard and the webhook marks the booking refunded. */
export async function cancelBooking(bookingId: string, cohortId: string) {
  await requireAdmin();
  await getSql()`
    update bookings set status = 'cancelled', cancelled_at = now()
    where id = ${bookingId} and status in ('paid','comp','pending')
  `;
  revalidatePath(`/admin/cohorts/${cohortId}`);
}

export async function reinstateBooking(bookingId: string, cohortId: string) {
  await requireAdmin();
  await getSql()`
    update bookings set status = case when source = 'manual' or paid_at is null then 'comp' else 'paid' end, cancelled_at = null
    where id = ${bookingId} and status = 'cancelled'
  `;
  revalidatePath(`/admin/cohorts/${cohortId}`);
}

export async function sendEmailNow(bookingId: string, cohortId: string, kind: Exclude<EmailKind, 'seat_offer'>) {
  await requireAdmin();
  await sendBookingEmail(getSql(), bookingId, kind, { force: true });
  revalidatePath(`/admin/cohorts/${cohortId}`);
}

/** Sends the pre-course email to everyone booked who hasn't had it yet. */
export async function sendPreCourseToAll(cohortId: string) {
  await requireAdmin();
  const sql = getSql();
  const rows = await sql<{ id: string }[]>`
    select id from bookings where cohort_id = ${cohortId} and status in ('paid','comp') and email is not null
  `;
  for (const r of rows) await sendBookingEmail(sql, r.id, 'pre_course');
  revalidatePath(`/admin/cohorts/${cohortId}`);
}

export async function offerSeat(waitlistId: string, cohortId: string) {
  await requireAdmin();
  await sendSeatOffer(getSql(), waitlistId);
  revalidatePath(`/admin/cohorts/${cohortId}`);
}

export async function removeFromWaitlist(waitlistId: string, cohortId: string) {
  await requireAdmin();
  await getSql()`update waitlist set removed_at = now() where id = ${waitlistId}`;
  revalidatePath(`/admin/cohorts/${cohortId}`);
}
