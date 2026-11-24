'use server';

import { redirect } from 'next/navigation';
import { attachCheckoutSession, releaseHold, reserveSeat } from '@/lib/bookings';
import { getSql } from '@/lib/db';
import { checkoutParams, getStripe } from '@/lib/stripe';

export async function startCheckout(formData: FormData) {
  const slug = String(formData.get('slug') ?? '');
  const sql = getSql();
  const result = await reserveSeat(sql, slug);
  if (!result.ok) redirect(`/book/${encodeURIComponent(slug)}?error=${result.reason}`);

  let url: string | null = null;
  try {
    const session = await getStripe().checkout.sessions.create(checkoutParams(result.cohort, result.booking), {
      idempotencyKey: `checkout:${result.booking.id}`,
    });
    await attachCheckoutSession(sql, result.booking.id, session.id);
    url = session.url;
  } catch (err) {
    console.error('[checkout] create failed', err);
    await releaseHold(sql, result.booking.id);
  }
  if (!url) redirect(`/book/${encodeURIComponent(slug)}?error=stripe`);
  redirect(url);
}

export interface WaitlistState {
  ok: boolean;
  message: string;
}

export async function joinWaitlist(_prev: WaitlistState | null, formData: FormData): Promise<WaitlistState> {
  const slug = String(formData.get('slug') ?? '');
  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200);
  const company = String(formData.get('company') ?? '').trim().slice(0, 120) || null;
  const note = String(formData.get('note') ?? '').trim().slice(0, 500) || null;
  // Honeypot: real people never see this field.
  if (formData.get('website')) return { ok: true, message: "You're on the list." };
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Please give your name and a valid email.' };
  }
  const sql = getSql();
  const rows = await sql`
    insert into waitlist (cohort_id, name, email, company, note)
    select id, ${name}, ${email}, ${company}, ${note} from cohorts where slug = ${slug} and status <> 'draft'
    on conflict (cohort_id, lower(email)) do update set removed_at = null, name = excluded.name
    returning id
  `;
  if (!rows.length) return { ok: false, message: 'That date is no longer listed.' };
  return { ok: true, message: "You're on the list. If a seat opens up I'll email you straight away." };
}
