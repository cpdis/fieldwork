import { isValidAbn } from '@/lib/abn';
import { attachCheckoutSession, releaseHold, reserveSeat } from '@/lib/bookings';
import { getSql } from '@/lib/db';
import { checkoutParams, getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MESSAGES = {
  sold_out: 'Someone took the last seat a moment ago. Nothing was charged.',
  closed: 'Bookings for this day have closed.',
  not_found: 'That date is no longer listed.',
  stripe: "Payment didn't open. Nothing was charged. Please try again in a minute.",
  invalid: 'Please give your name and a valid email.',
  abn: "That ABN doesn't check out. Please check the 11 digits, or leave it blank.",
} as const;

const field = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Step one of our own checkout page: takes the buyer's details, holds a seat,
 * and opens a Checkout session for Stripe's Payment Element. The browser gets
 * only the session's client secret.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: MESSAGES.invalid }, { status: 400 });
  }
  const slug = field(body.slug, 120);
  const name = field(body.name, 120);
  const email = field(body.email, 200).toLowerCase();
  if (!slug || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: MESSAGES.invalid }, { status: 400 });
  }
  const abn = field(body.abn, 20);
  if (abn && !isValidAbn(abn)) {
    return Response.json({ error: MESSAGES.abn, reason: 'abn' }, { status: 400 });
  }
  const buyer = {
    name,
    email,
    company: field(body.company, 120) || null,
    abn: abn || null,
    dietary: field(body.dietary, 255) || null,
  };

  const sql = getSql();
  const result = await reserveSeat(sql, slug, new Date(), buyer);
  if (!result.ok) return Response.json({ error: MESSAGES[result.reason], reason: result.reason }, { status: 409 });

  try {
    const session = await getStripe().checkout.sessions.create(checkoutParams(result.cohort, result.booking), {
      idempotencyKey: `checkout:${result.booking.id}`,
    });
    if (!session.client_secret) throw new Error('session has no client_secret');
    await attachCheckoutSession(sql, result.booking.id, session.id);
    return Response.json({ clientSecret: session.client_secret, expiresAt: session.expires_at * 1000 });
  } catch (err) {
    console.error('[checkout] create failed', err);
    await releaseHold(sql, result.booking.id);
    return Response.json({ error: MESSAGES.stripe }, { status: 502 });
  }
}
