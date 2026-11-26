// The pilot day as a listed cohort: "closed" shows it on the home page with
// "Ask for a seat" (a waitlist) rather than Checkout. Safe to rerun.
// Add guests from the admin with "Add someone by hand", and set the venue when it's booked.
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const sql = postgres(url, { max: 1, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require' });

await sql`
  insert into cohorts (slug, title, starts_at, ends_at, venue_name, venue_address, capacity, price_cents, status, joining_notes)
  values ('pilot-2026-12-02', 'Fieldwork: pilot day', '2026-12-02T09:00:00+08:00', '2026-12-02T16:00:00+08:00',
          null, null, 10, 0, 'closed', 'Lunch is provided. Venue details to follow.')
  on conflict (slug) do nothing
`;
console.log('seeded pilot-2026-12-02');
await sql.end();
