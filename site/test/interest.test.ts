import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetDb, setupEnv } from './helpers';

setupEnv();

const { getSql } = await import('@/lib/db');
const route = await import('@/app/api/interest/route');
const { listGeneralInterest } = await import('@/lib/interest');
const sql = getSql();

function post(body: Record<string, string>, json = true) {
  return new Request('https://fieldwork.test/api/interest', {
    method: 'POST',
    headers: json ? { accept: 'application/json', 'content-type': 'application/json' } : { 'content-type': 'application/x-www-form-urlencoded' },
    body: json ? JSON.stringify(body) : new URLSearchParams(body).toString(),
  });
}

beforeAll(async () => {
  await resetDb();
  await sql`
    insert into cohorts (slug, title, starts_at, ends_at, capacity, price_cents, status)
    values ('pilot', 'Fieldwork: pilot day', now() + interval '8 days', now() + interval '8 days 7 hours', 8, 0, 'closed'),
           ('hidden', 'Draft', now() + interval '30 days', now() + interval '30 days 7 hours', 8, 100000, 'draft')
  `;
});
afterAll(async () => {
  await sql.end();
});

describe('home page form', () => {
  it('puts a request for a listed day on that cohort’s waitlist', async () => {
    const res = await route.POST(post({ day: 'pilot', name: 'Sam Reid', email: 'Sam@Example.com', uses: 'claude', note: 'Survey business' }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    const [row] = await sql`select w.* from waitlist w join cohorts c on c.id = w.cohort_id where c.slug = 'pilot'`;
    expect(row).toMatchObject({ email: 'sam@example.com', uses: 'claude', note: 'Survey business', source: 'site' });
  });

  it('keeps one general-list row per email and updates it on a second ask', async () => {
    await route.POST(post({ day: 'next', name: 'Jo Tan', email: 'jo@example.com', uses: 'chatgpt' }));
    await route.POST(post({ day: 'next', name: 'Jo Tan', email: 'JO@example.com', company: 'Tan Electrical' }));
    const rows = await listGeneralInterest(sql);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ company: 'Tan Electrical', uses: 'chatgpt' });
  });

  it('refuses a draft cohort, a bad email, and drops an unknown app value', async () => {
    expect((await route.POST(post({ day: 'hidden', name: 'A', email: 'a@example.com' }))).status).toBe(404);
    expect((await route.POST(post({ day: 'next', name: 'A', email: 'nope' }))).status).toBe(400);
    await route.POST(post({ day: 'next', name: 'B', email: 'b@example.com', uses: 'gemini' }));
    const [b] = await sql`select uses from waitlist where email = 'b@example.com'`;
    expect(b.uses).toBeNull();
  });

  it('accepts a honeypot submission silently without storing it', async () => {
    const res = await route.POST(post({ day: 'next', name: 'Bot', email: 'bot@example.com', website: 'http://spam' }));
    expect((await res.json()).ok).toBe(true);
    expect(await sql`select 1 from waitlist where email = 'bot@example.com'`).toHaveLength(0);
  });

  it('redirects a plain form post back to the form', async () => {
    const res = await route.POST(post({ day: 'next', name: 'C', email: 'c@example.com' }, false));
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://fieldwork.test/?sent=1#book');
  });
});
