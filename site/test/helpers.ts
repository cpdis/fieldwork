import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import Stripe from 'stripe';

export const WEBHOOK_SECRET = 'whsec_test_secret';

export function setupEnv() {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.CRON_SECRET = 'cron-secret';
  process.env.SITE_URL = 'https://fieldwork.test';
  delete process.env.RESEND_API_KEY;
}

export async function resetDb() {
  const sql = postgres(process.env.TEST_DATABASE_URL!, { max: 1, onnotice: () => {} });
  await sql.unsafe(`drop schema public cascade; create schema public;`);
  await sql.unsafe(readFileSync(new URL('../supabase/migrations/0001_cohort_admin.sql', import.meta.url), 'utf8'));
  await sql.end();
}

export function signedRequest(event: object, secret = WEBHOOK_SECRET): Request {
  const payload = JSON.stringify(event);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request('https://fieldwork.test/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': header, 'content-type': 'application/json' },
    body: payload,
  });
}

let n = 0;
export function event(type: string, object: object) {
  n += 1;
  return { id: `evt_test_${Date.now()}_${n}`, object: 'event', type, api_version: '2025-01-01', created: 0, data: { object } };
}

export function completedSession(over: Record<string, unknown> = {}) {
  return {
    id: `cs_test_${Math.random().toString(36).slice(2)}`,
    object: 'checkout.session',
    payment_status: 'paid',
    status: 'complete',
    amount_total: 75000,
    currency: 'aud',
    payment_intent: `pi_test_${Math.random().toString(36).slice(2)}`,
    customer_details: { name: 'Sam Rivera', email: 'Sam@Example.com', phone: null },
    custom_fields: [
      { key: 'company', type: 'text', text: { value: 'Harbour Survey Co' } },
      { key: 'abn', type: 'numeric', numeric: { value: '51824753556' } },
      { key: 'dietary', type: 'text', text: { value: 'Vegetarian' } },
    ],
    metadata: {},
    client_reference_id: null,
    ...over,
  };
}
