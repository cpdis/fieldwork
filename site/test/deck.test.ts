import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resetDb, setupEnv } from './helpers';

setupEnv();
process.env.ADMIN_SESSION_SECRET = 'test-session-secret';

const { getSql } = await import('@/lib/db');
const deck = await import('@/lib/deck');
const { listTodos } = await import('@/lib/todos');
const { makeSessionToken, SESSION_COOKIE } = await import('@/lib/auth');
const { proxy } = await import('@/proxy');
const sql = getSql();

beforeAll(async () => {
  await resetDb();
});
afterAll(async () => {
  await sql.end();
});

const t0 = Date.now() - 3_600_000;
const view = (seq: number, page: number, from: number | null, dwell: number) => ({ seq, page, from, at: t0 + seq * 1000, dwell });

describe('share links', () => {
  it('makes readable tokens with a random tail', () => {
    const a = deck.makeToken('Alex Smith');
    expect(a).toMatch(/^alex-smith-[A-Za-z0-9]{10}$/);
    expect(deck.makeToken('Alex Smith')).not.toBe(a);
    expect(deck.makeToken('  !!  ')).toMatch(/^[A-Za-z0-9]{10}$/);
  });

  it('opens a live link, counts it, and refuses revoked or expired ones', async () => {
    const live = await deck.createLink(sql, { name: 'Alex', note: null, allowNotes: true, expiresInDays: 14 });
    const opened = await deck.openLink(sql, live.token);
    expect(opened?.id).toBe(live.id);
    expect(opened?.open_count).toBe(1);

    await deck.setLinkRevoked(sql, live.id, true);
    expect(await deck.openLink(sql, live.token)).toBeNull();
    expect(await deck.liveLink(sql, live.id)).toBeNull();
    await deck.extendLink(sql, live.id, 14);
    expect(await deck.liveLink(sql, live.id)).not.toBeNull();

    const old = await deck.createLink(sql, { name: 'Shane', note: null, allowNotes: true, expiresInDays: 1 });
    await sql`update deck_links set expires_at = now() - interval '1 minute' where id = ${old.id}`;
    expect(await deck.openLink(sql, old.token)).toBeNull();
    expect(deck.linkState({ revoked_at: null, expires_at: new Date(Date.now() - 1000) })).toBe('expired');
    expect(await deck.openLink(sql, 'not a token')).toBeNull();
  });

  it('signs the share cookie and rejects tampering and expiry', () => {
    const id = randomUUID();
    const { value, maxAge } = deck.makeLookCookie({ id, expires_at: new Date(Date.now() + 3 * 86_400_000) });
    expect(maxAge).toBeGreaterThan(2 * 86_400);
    expect(maxAge).toBeLessThanOrEqual(3 * 86_400);
    expect(deck.verifyLookCookie(value)).toBe(id);
    expect(deck.verifyLookCookie(value.replace(id, randomUUID()))).toBeNull();
    expect(deck.verifyLookCookie(value, Date.now() + 4 * 86_400_000)).toBeNull();
    // A link with no end still gets a cookie that lapses after 30 days.
    const forever = deck.makeLookCookie({ id, expires_at: null });
    expect(forever.maxAge).toBe(30 * 86_400);
  });

  it('reads the create-link form', () => {
    const form = new Map<string, string>([['name', ' Running group '], ['expires', 'never'], ['allow_notes', 'on']]);
    expect(deck.readLinkInput((k) => form.get(k) ?? null)).toEqual({ name: 'Running group', note: null, allowNotes: true, expiresInDays: null });
    expect(deck.readLinkInput(() => null)).toHaveProperty('error');
  });
});

describe('the gate in front of the deck files', () => {
  const req = (path: string, cookie?: string, accept = 'text/html') =>
    new NextRequest(`https://fieldwork.test${path}`, { headers: { accept, ...(cookie ? { cookie } : {}) } });

  it('needs the admin session for the admin copy', () => {
    expect(proxy(req('/admin/deck/assets/index.js', undefined, '*/*')).status).toBe(404);
    expect(proxy(req('/admin/deck/s/fieldwork-day')).headers.get('location')).toBe('https://fieldwork.test/admin/login');
    const ok = proxy(req('/admin/deck/assets/index.js', `${SESSION_COOKIE}=${makeSessionToken()}`, '*/*'));
    expect(ok.headers.get('x-middleware-next')).toBe('1');
  });

  it('needs a share cookie for the share copy, but lets the link itself through', () => {
    expect(proxy(req('/look/alex-k3J9pQ2mXw')).headers.get('x-middleware-next')).toBe('1');
    expect(proxy(req('/look/assets/index.js', undefined, '*/*')).status).toBe(404);
    expect(proxy(req('/look/s/fieldwork-day')).headers.get('location')).toBe('https://fieldwork.test/look');
    const { value } = deck.makeLookCookie({ id: randomUUID(), expires_at: null });
    expect(proxy(req('/look/assets/index.js', `${deck.LOOK_COOKIE}=${value}`, '*/*')).headers.get('x-middleware-next')).toBe('1');
    // The admin cookie does not open share paths, and a share cookie does not open admin paths.
    expect(proxy(req('/admin/deck/assets/a.js', `${deck.LOOK_COOKIE}=${value}`, '*/*')).status).toBe(404);
  });
});

describe('tracking', () => {
  it('drops malformed check-ins and bad views', () => {
    expect(deck.readTrackPayload(null)).toBeNull();
    expect(deck.readTrackPayload({ sid: 'nope', views: [] })).toBeNull();
    const p = deck.readTrackPayload({
      sid: randomUUID(),
      commit: 'e75dc16',
      views: [view(0, 1, null, 5000), { seq: 1, page: 0, at: Date.now(), dwell: 1 }, { seq: 2, page: 3, at: Date.now(), dwell: -5 }],
    });
    expect(p?.views).toHaveLength(1);
    expect(p?.commit).toBe('e75dc16');
  });

  it('records a run, only ever grows a view, and tags a run during a cohort day', async () => {
    const [cohort] = await sql<{ id: string }[]>`
      insert into cohorts (slug, title, starts_at, ends_at, capacity, price_cents, status)
      values ('today', 'Fieldwork: today', now() - interval '1 hour', now() + interval '5 hours', 10, 0, 'closed') returning id
    `;
    const sid = randomUUID();
    const base = { sid, commit: null, pages: 88, device: 'Mac · Chrome', presented: false };
    expect(await deck.recordTrack(sql, { kind: 'admin' }, { ...base, views: [view(0, 1, null, 4000), view(1, 2, 1, 1000)] }, null)).toBe(true);
    expect(await deck.recordTrack(sql, { kind: 'admin' }, { ...base, presented: true, views: [view(1, 2, 1, 9000), view(0, 1, null, 100)] }, null)).toBe(true);
    const [s] = await sql<{ cohort_id: string; presented: boolean }[]>`select cohort_id, presented from deck_sessions where id = ${sid}`;
    expect(s).toEqual({ cohort_id: cohort.id, presented: true });
    const vs = await deck.listViews(sql, sid);
    expect(vs.map((v) => v.dwell_ms)).toEqual([4000, 9000]);
    await sql`update cohorts set status = 'cancelled' where id = ${cohort.id}`;
  });

  it("won't let a share link write into someone else's run", async () => {
    const link = await deck.createLink(sql, { name: 'Sam', note: null, allowNotes: true, expiresInDays: 7 });
    const sid = randomUUID();
    const p = { sid, commit: null, pages: 88, device: null, presented: false, views: [view(0, 1, null, 1000)] };
    expect(await deck.recordTrack(sql, { kind: 'admin' }, p, null)).toBe(true);
    expect(await deck.recordTrack(sql, { kind: 'link', linkId: link.id }, { ...p, views: [view(0, 1, null, 99_000)] }, null)).toBe(false);
    expect((await deck.listViews(sql, sid))[0].dwell_ms).toBe(1000);
  });
});

describe('analytics', () => {
  let linkId = '';
  beforeAll(async () => {
    await sql`delete from deck_sessions`;
    linkId = (await deck.createLink(sql, { name: 'Pat', note: null, allowNotes: true, expiresInDays: 7 })).id;
    // Run A: 1 (60s) -> 2 (120s) -> 3 (30s) -> back to 2 (60s). Run B: 1 (40s) -> 2 (20s), stops.
    const a = randomUUID();
    const b = randomUUID();
    const base = { commit: null, pages: 3, device: null, presented: false };
    await deck.recordTrack(sql, { kind: 'admin' }, { ...base, sid: a, views: [view(0, 1, null, 60_000), view(1, 2, 1, 120_000), view(2, 3, 2, 30_000), view(3, 2, 3, 60_000)] }, null);
    await deck.recordTrack(sql, { kind: 'link', linkId }, { ...base, sid: b, views: [view(0, 1, null, 40_000), view(1, 2, 1, 20_000)] }, null);
    // A peek under 30 seconds is left out.
    await deck.recordTrack(sql, { kind: 'admin' }, { ...base, sid: randomUUID(), views: [view(0, 1, null, 5_000)] }, null);
  });

  it('counts time, comebacks, reach and where people stopped', async () => {
    const { runs, pages } = await deck.pageStats(sql, { kind: 'all' });
    expect(runs).toBe(2);
    const p = Object.fromEntries(pages.map((x) => [x.page, x]));
    expect(p[1]).toMatchObject({ reached: 2, median_s: 50 });
    expect(p[2]).toMatchObject({ reached: 2, median_s: 100, backs: 1, revisits: 1, stopped: 1 });
    expect(p[3]).toMatchObject({ reached: 1, median_s: 30, stopped: 1 });
  });

  it('filters by who was watching', async () => {
    expect((await deck.pageStats(sql, { kind: 'links' })).runs).toBe(1);
    expect((await deck.pageStats(sql, { kind: 'link', id: linkId })).runs).toBe(1);
    expect((await deck.pageStats(sql, { kind: 'rehearsal' })).runs).toBe(1);
    expect((await deck.listSessions(sql, { kind: 'you' })).length).toBe(2);
    expect(deck.parseFilter(`link:${linkId}`)).toEqual({ kind: 'link', id: linkId });
    expect(deck.parseFilter('link:nope')).toEqual({ kind: 'all' });
  });

  it('takes the median of each run’s time on a section', async () => {
    const rows = await deck.runPageTimes(sql, { kind: 'all' });
    const [first, rest] = deck.sectionTimes([{ first: 1, last: 1 }, { first: 2, last: 3 }], rows);
    expect(first).toEqual({ seconds: 50, runs: 2 });
    // Run A spent 210s on pages 2-3, run B 20s.
    expect(rest).toEqual({ seconds: 115, runs: 2 });
    expect(deck.median([])).toBe(0);
  });
});

describe('notes and the overview', () => {
  it('keeps notes, marks them done, and lists what needs doing', async () => {
    const link = await deck.createLink(sql, { name: 'Robin', note: null, allowNotes: true, expiresInDays: 7 });
    await deck.addNote(sql, { kind: 'link', linkId: link.id }, { sid: null, page: 49, body: 'Swap the order?', commit: null });
    await deck.addNote(sql, { kind: 'admin' }, { sid: randomUUID(), page: 27, body: 'Cut file 6', commit: null });
    const open = await deck.listNotes(sql, { open: true });
    expect(open.map((n) => [n.page, n.link_name])).toEqual([
      [27, null],
      [49, 'Robin'],
    ]);
    expect(deck.readNote({ page: 3, body: '   ' })).toBeNull();

    await sql`
      insert into cohorts (slug, title, starts_at, ends_at, capacity, price_cents, status, pre_course_days)
      values ('soon', 'Fieldwork: soon', now() + interval '3 days', now() + interval '3 days 7 hours', 10, 0, 'closed', 3)
    `;
    const todos = await listTodos(sql);
    const keys = todos.map((t) => t.key.split(':')[0]);
    expect(keys).toContain('venue');
    expect(keys).toContain('notes');
    expect(todos.find((t) => t.key === 'notes')?.detail).toBe('From Robin and you.');

    await deck.setNoteDone(sql, open[0].id, true);
    await deck.setNoteDone(sql, open[1].id, true);
    expect((await listTodos(sql)).some((t) => t.key === 'notes')).toBe(false);
  });
});
