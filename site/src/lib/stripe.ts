import Stripe from 'stripe';
import { CHECKOUT_LIFETIME_MS } from './bookings';
import { required, siteUrl } from './config';
import { formatShortDate } from './time';
import type { Booking, Cohort } from './types';

let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!client) {
    const key = required('STRIPE_SECRET_KEY');
    if (process.env.NODE_ENV === 'production' && key.startsWith('sk_live_') && process.env.STRIPE_ALLOW_LIVE !== '1') {
      throw new Error('Live Stripe key refused: set STRIPE_ALLOW_LIVE=1 once the Australian account is ready.');
    }
    client = new Stripe(key, { appInfo: { name: 'fieldwork-site' } });
  }
  return client;
}

/**
 * Parameters for one seat at one cohort, for our own checkout page
 * (`ui_mode: 'elements'`): the page collects the buyer's details itself and
 * Stripe's Payment Element takes the card or bank details. Name, email,
 * company, ABN and dietary needs are already on the booking by the time the
 * session is created; they go to Stripe as metadata so they show on the payment.
 */
export function checkoutParams(cohort: Cohort, booking: Booking, now = new Date()): Stripe.Checkout.SessionCreateParams {
  const base = siteUrl();
  const meta = {
    booking_id: booking.id,
    cohort_id: cohort.id,
    ...(booking.company ? { company: booking.company } : {}),
    ...(booking.abn ? { abn: booking.abn } : {}),
  };
  return {
    ui_mode: 'elements',
    mode: 'payment',
    client_reference_id: booking.id,
    metadata: meta,
    ...(booking.email ? { customer_email: booking.email } : {}),
    payment_intent_data: {
      description: `Fieldwork: ${cohort.title}, ${formatShortDate(cohort.starts_at)}`,
      metadata: meta,
      ...(booking.email ? { receipt_email: booking.email } : {}),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: cohort.currency,
          unit_amount: cohort.price_cents,
          product_data: {
            name: `${cohort.title}`,
            description: `${formatShortDate(cohort.starts_at)}${cohort.venue_name ? `, ${cohort.venue_name}` : ''}. One seat.`,
          },
        },
      },
    ],
    customer_creation: 'always',
    expires_at: Math.floor((now.getTime() + CHECKOUT_LIFETIME_MS) / 1000),
    return_url: `${base}/book/success?session_id={CHECKOUT_SESSION_ID}`,
  };
}
