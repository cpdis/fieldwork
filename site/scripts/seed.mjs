// A test cohort for local dev and Stripe test mode. Safe to rerun.
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const sql = postgres(url, { max: 1, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });

await sql`
  insert into cohorts (slug, title, starts_at, ends_at, venue_name, venue_address, capacity, price_cents, status, joining_notes)
  values ('pilot-dec-2026', 'Fieldwork: pilot day', '2026-12-10T09:00:00+08:00', '2026-12-10T16:00:00+08:00',
          'Subi Space', '12/217 Hay St, Subiaco WA 6008', 12, 75000, 'open',
          'Free street parking on Hay St. Lunch is provided.')
  on conflict (slug) do nothing
`;
console.log('seeded pilot-dec-2026');
await sql.end();
