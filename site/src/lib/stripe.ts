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
 * Parameters for one seat at one cohort. The three custom fields are Stripe's
 * maximum. Company and ABN are for business buyers who want a tax invoice;
 * dietary needs go to the caterer.
 */
export function checkoutParams(cohort: Cohort, booking: Booking, now = new Date()): Stripe.Checkout.SessionCreateParams {
  const base = siteUrl();
  return {
    mode: 'payment',
    client_reference_id: booking.id,
    metadata: { booking_id: booking.id, cohort_id: cohort.id },
    payment_intent_data: {
      description: `Fieldwork: ${cohort.title}, ${formatShortDate(cohort.starts_at)}`,
      metadata: { booking_id: booking.id, cohort_id: cohort.id },
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
    custom_fields: [
      {
        key: 'company',
        label: { type: 'custom', custom: 'Company name (for your invoice)' },
        type: 'text',
        optional: true,
        text: { maximum_length: 120 },
      },
      {
        key: 'abn',
        label: { type: 'custom', custom: 'ABN (11 digits, optional)' },
        type: 'numeric',
        optional: true,
        numeric: { minimum_length: 11, maximum_length: 11 },
      },
      {
        key: 'dietary',
        label: { type: 'custom', custom: 'Dietary needs for lunch' },
        type: 'text',
        optional: true,
        text: { maximum_length: 255 },
      },
    ],
    customer_creation: 'always',
    allow_promotion_codes: true,
    expires_at: Math.floor((now.getTime() + CHECKOUT_LIFETIME_MS) / 1000),
    success_url: `${base}/book/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/book/${cohort.slug}?cancelled=1`,
  };
}
