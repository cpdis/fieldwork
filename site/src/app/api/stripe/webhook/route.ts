import type Stripe from 'stripe';
import { processStripeEvent } from '@/lib/bookings';
import { getSql } from '@/lib/db';
import { sendBookingEmail } from '@/lib/mail';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Subscribe this endpoint to: checkout.session.completed,
 * checkout.session.async_payment_succeeded, checkout.session.async_payment_failed,
 * checkout.session.expired and charge.refunded.
 */
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response('missing signature', { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response('bad signature', { status: 400 });
  }

  const sql = getSql();
  let result;
  try {
    result = await processStripeEvent(sql, event);
  } catch (err) {
    console.error(`[stripe] ${event.type} ${event.id} failed`, err);
    return new Response('processing failed', { status: 500 });
  }

  // After commit. A failed email is logged and can be resent from the admin;
  // it must not make Stripe redeliver an event that was already applied.
  for (const bookingId of result.confirmed) {
    await sendBookingEmail(sql, bookingId, 'confirmation');
  }
  return Response.json({ received: true, duplicate: result.duplicate, confirmed: result.confirmed.length });
}
