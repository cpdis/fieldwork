import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetDb, setupEnv } from './helpers';

setupEnv();
delete process.env.ANTHROPIC_API_KEY;

const { getSql } = await import('@/lib/db');
const route = await import('@/app/api/feedback/route');
const { buildSummaryPrompt, hasAnswers, listFeedback, readFeedback, summarizeFeedback } = await import('@/lib/feedback');
const sql = getSql();
const read = (o: Record<string, string>) => readFeedback((k) => o[k]);

function post(body: Record<string, string>) {
  return new Request('https://fieldwork.test/api/feedback', { method: 'POST', body: new URLSearchParams(body) });
}

let pilot = '';
let later = '';
beforeAll(async () => {
  await resetDb();
  const rows = await sql<{ id: string; slug: string }[]>`
    insert into cohorts (slug, title, starts_at, ends_at, capacity, price_cents, status)
    values ('pilot', 'Fieldwork: pilot day', now() - interval '2 days', now() - interval '2 days' + interval '7 hours', 10, 0, 'draft'),
           ('march', 'Fieldwork: March', now() + interval '90 days', now() + interval '90 days 7 hours', 10, 75000, 'open')
    returning id, slug
  `;
  pilot = rows.find((r) => r.slug === 'pilot')!.id;
  later = rows.find((r) => r.slug === 'march')!.id;
});
afterAll(async () => {
  await sql.end();
});

describe('feedback form', () => {
  it('keeps known answers and drops values the form never offers', () => {
    expect(read({ app: 'Claude', useful: '5', recommend: 'Maybe', keep: ' The quote prompt ' })).toMatchObject({
      app: 'Claude',
      useful: 5,
      recommend: 'Maybe',
      keep: 'The quote prompt',
    });
    expect(read({ app: 'Gemini', useful: '9', recommend: 'Sure' })).toMatchObject({ app: null, useful: null, recommend: null });
    expect(hasAnswers(read({ name: 'Sam' }))).toBe(false);
  });

  it('stores an answer on the day the link names', async () => {
    const res = await route.POST(post({ day: 'march', useful: '4', change: 'More lab time' }));
    expect(res.headers.get('location')).toBe('https://fieldwork.test/feedback?day=march&sent=1');
    expect(await listFeedback(sql, later)).toHaveLength(1);
  });

  it('with no day in the link, stores it on the most recent day that has started', async () => {
    await route.POST(post({ app: 'Both', keep: 'Projects', name: 'Jo' }));
    const rows = await listFeedback(sql, pilot);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ app: 'Both', keep: 'Projects', name: 'Jo' });
  });

  it('refuses an empty form and keeps nothing from the honeypot', async () => {
    const empty = await route.POST(post({ name: 'Nobody' }));
    expect(empty.headers.get('location')).toContain('error=empty');
    await route.POST(post({ useful: '1', website: 'http://spam' }));
    expect(await sql`select 1 from feedback where useful = 1`).toHaveLength(0);
  });

  it('builds the summary prompt from answers only, never names or emails', async () => {
    const rows = await listFeedback(sql, pilot);
    const prompt = buildSummaryPrompt('Fieldwork: pilot day', rows);
    expect(prompt).toContain('Will use this week: Projects');
    expect(prompt).toContain('<schedule>');
    expect(prompt).not.toContain('Jo');
  });

  it('says plainly when the API key is missing', async () => {
    await expect(summarizeFeedback(sql, pilot, 'pilot')).rejects.toThrow('ANTHROPIC_API_KEY is not set');
  });
});
