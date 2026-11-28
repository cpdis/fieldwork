import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { safeEqual, sign } from './auth';
import type { Sql } from './db';

/* ------------------------------------------------------------------ the built deck */

export interface DeckPage {
  n: number;
  title: string;
  /** Block number (0 is the opening); null for breaks and lunch. */
  block: number | null;
}
export interface DeckSection {
  n: number | null;
  name: string;
  first: number;
  last: number;
  /** Minutes the timetable (course.ts) gives it; null for the opening. */
  planMin: number | null;
  start: string | null;
}
export interface DeckManifest {
  slide: string;
  title: string;
  builtAt: string;
  commit: string | null;
  message: string | null;
  pageCount: number;
  pages: DeckPage[];
  /** The day in order: blocks (n 0 is the opening) and the breaks between them (n null). */
  blocks: DeckSection[];
}

const BUILD_DIR = join(process.cwd(), 'deck-build');

/** Written by scripts/build-deck.mjs. Null when the deck wasn't built (e.g. a bare `next dev`). */
export async function readManifest(): Promise<DeckManifest | null> {
  try {
    return JSON.parse(await readFile(join(BUILD_DIR, 'manifest.json'), 'utf8')) as DeckManifest;
  } catch {
    return null;
  }
}

export async function readEntryHtml(kind: 'admin' | 'look'): Promise<string | null> {
  try {
    return await readFile(join(BUILD_DIR, `${kind}.html`), 'utf8');
  } catch {
    return null;
  }
}

export interface TrackerConfig {
  mode: 'admin' | 'look';
  /** Where the tracker posts views and notes. */
  api: string;
  commit: string | null;
  pageCount: number;
  notes: boolean;
  /** Shown in the note box on share links ("Notes go to Colin"). */
  who?: string;
}

/** Adds the page tracker and note box (public/deck-kit/fw-deck.js) to a built entry page. */
export function injectTracker(html: string, cfg: TrackerConfig, title: string): string {
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const tags = `<script>window.__FW_DECK=${json}</script><script src="/deck-kit/fw-deck.js" defer></script>`;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title><meta name="robots" content="noindex, nofollow">`)
    .replace('</head>', `${tags}</head>`);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/* ------------------------------------------------------------------ share links */

export interface DeckLink {
  id: string;
  token: string;
  name: string;
  note: string | null;
  allow_notes: boolean;
  expires_at: Date | null;
  revoked_at: Date | null;
  open_count: number;
  last_opened_at: Date | null;
  created_at: Date;
}
export interface DeckLinkWithStats extends DeckLink {
  sessions: number;
  seconds: number;
  furthest: number | null;
  notes: number;
}

export const LOOK_COOKIE = 'fw_look';
const LOOK_DAYS = 30;
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function linkState(l: Pick<DeckLink, 'revoked_at' | 'expires_at'>, now = new Date()): 'live' | 'revoked' | 'expired' {
  if (l.revoked_at) return 'revoked';
  if (l.expires_at && l.expires_at <= now) return 'expired';
  return 'live';
}

/** "alex-k3J9pQ2mXw": readable at a glance, 58 bits of randomness after the name. */
export function makeToken(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
  const bytes = randomBytes(10);
  const rand = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return slug ? `${slug}-${rand}` : rand;
}

export interface LinkInput {
  name: string;
  note: string | null;
  allowNotes: boolean;
  /** Null: never expires. */
  expiresInDays: number | null;
}

export function readLinkInput(get: (k: string) => FormDataEntryValue | null): LinkInput | { error: string } {
  const name = String(get('name') ?? '').trim().slice(0, 80);
  if (!name) return { error: 'Give the link a name, such as who it’s for.' };
  const note = String(get('note') ?? '').trim().slice(0, 500) || null;
  const days = String(get('expires') ?? '14');
  const expiresInDays = days === 'never' ? null : Math.min(365, Math.max(1, Number(days) || 14));
  return { name, note, allowNotes: get('allow_notes') != null, expiresInDays };
}

export async function createLink(sql: Sql, input: LinkInput): Promise<DeckLink> {
  const [row] = await sql<DeckLink[]>`
    insert into deck_links (token, name, note, allow_notes, expires_at)
    values (${makeToken(input.name)}, ${input.name}, ${input.note}, ${input.allowNotes},
            ${input.expiresInDays === null ? null : sql`now() + make_interval(days => ${input.expiresInDays})`})
    returning *
  `;
  return row;
}

export async function listLinks(sql: Sql): Promise<DeckLinkWithStats[]> {
  return sql<DeckLinkWithStats[]>`
    select l.*,
      (select count(*) from deck_sessions s where s.link_id = l.id)::int as sessions,
      (select coalesce(sum(least(v.dwell_ms, ${DWELL_CAP_MS})), 0) / 1000 from deck_views v join deck_sessions s on s.id = v.session_id where s.link_id = l.id)::int as seconds,
      (select max(v.page) from deck_views v join deck_sessions s on s.id = v.session_id where s.link_id = l.id)::int as furthest,
      (select count(*) from deck_notes n where n.link_id = l.id)::int as notes
    from deck_links l
    order by l.revoked_at is not null, l.created_at desc
  `;
}

export async function getLink(sql: Sql, id: string): Promise<DeckLink | null> {
  if (!isUuid(id)) return null;
  const [row] = await sql<DeckLink[]>`select * from deck_links where id = ${id}`;
  return row ?? null;
}

/** The link for a token, if it's live; counts the open. */
export async function openLink(sql: Sql, token: string): Promise<DeckLink | null> {
  if (!/^[a-z0-9-]*[A-Za-z0-9]{10}$/.test(token) || token.length > 40) return null;
  const [row] = await sql<DeckLink[]>`
    update deck_links set open_count = open_count + 1, last_opened_at = now()
    where token = ${token} and revoked_at is null and (expires_at is null or expires_at > now())
    returning *
  `;
  return row ?? null;
}

export async function liveLink(sql: Sql, id: string): Promise<DeckLink | null> {
  if (!isUuid(id)) return null;
  const [row] = await sql<DeckLink[]>`
    select * from deck_links where id = ${id} and revoked_at is null and (expires_at is null or expires_at > now())
  `;
  return row ?? null;
}

export async function setLinkRevoked(sql: Sql, id: string, revoked: boolean): Promise<void> {
  await sql`update deck_links set revoked_at = ${revoked ? sql`now()` : null} where id = ${id}`;
}

export async function extendLink(sql: Sql, id: string, days: number | null): Promise<void> {
  await sql`
    update deck_links set expires_at = ${days === null ? null : sql`now() + make_interval(days => ${days})`}, revoked_at = null
    where id = ${id}
  `;
}

export async function deleteLink(sql: Sql, id: string): Promise<void> {
  await sql`delete from deck_links where id = ${id}`;
}

/** Cookie value for a share link: "<link id>.<expiry ms>.<mac>". Checked by src/proxy.ts. */
export function makeLookCookie(link: Pick<DeckLink, 'id' | 'expires_at'>, now = Date.now()): { value: string; maxAge: number } {
  const cap = now + LOOK_DAYS * 86_400_000;
  const exp = Math.min(cap, link.expires_at ? link.expires_at.getTime() : cap);
  const payload = `${link.id}.${exp}`;
  return { value: `${payload}.${sign(`look:${payload}`)}`, maxAge: Math.max(0, Math.floor((exp - now) / 1000)) };
}

/** The link id a share cookie was issued for, if its signature and expiry hold. */
export function verifyLookCookie(value: string | undefined, now = Date.now()): string | null {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [id, exp, mac] = parts;
  if (!isUuid(id) || !/^\d+$/.test(exp)) return null;
  if (!safeEqual(mac, sign(`look:${id}.${exp}`))) return null;
  return Number(exp) > now ? id : null;
}

export const isUuid = (s: unknown): s is string =>
  typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/* ------------------------------------------------------------------ tracking */

/** A single stop longer than this (a laptop left open over lunch) counts as this long. */
export const DWELL_CAP_MS = 20 * 60_000;
const MAX_DWELL_MS = 12 * 3_600_000;

export type Viewer = { kind: 'admin' } | { kind: 'link'; linkId: string };

export interface TrackView {
  seq: number;
  page: number;
  from: number | null;
  at: number;
  dwell: number;
}
export interface TrackPayload {
  sid: string;
  commit: string | null;
  pages: number | null;
  device: string | null;
  presented: boolean;
  views: TrackView[];
}

const int = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null;

/** Validates what the browser sent. Anything malformed is dropped, not stored. */
export function readTrackPayload(body: unknown, now = Date.now()): TrackPayload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!isUuid(b.sid) || !Array.isArray(b.views) || b.views.length > 100) return null;
  const views: TrackView[] = [];
  for (const raw of b.views) {
    if (!raw || typeof raw !== 'object') continue;
    const v = raw as Record<string, unknown>;
    const seq = int(v.seq, 0, 100_000);
    const page = int(v.page, 1, 999);
    const at = int(v.at, now - 7 * 86_400_000, now + 300_000);
    const dwell = int(v.dwell, 0, MAX_DWELL_MS);
    if (seq === null || page === null || at === null || dwell === null) continue;
    views.push({ seq, page, from: int(v.from, 1, 999), at, dwell });
  }
  return {
    sid: b.sid.toLowerCase(),
    commit: typeof b.commit === 'string' && /^[0-9a-f]{7,40}$/.test(b.commit) ? b.commit : null,
    pages: int(b.pages, 1, 999),
    device: typeof b.device === 'string' ? b.device.slice(0, 40) : null,
    presented: b.presented === true,
    views,
  };
}

/** A short device label from a user agent: "Mac · Chrome", "iPhone · Safari". */
export function deviceLabel(ua: string | null): string | null {
  if (!ua) return null;
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const br = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${os} · ${br}`;
}

/**
 * Stores a check-in from the tracker. The session is created on first sight; a session id
 * that belongs to another viewer is ignored, so one link can't write into another's runs.
 * Views are upserted by (session, seq) and their time only ever grows.
 */
export async function recordTrack(sql: Sql, viewer: Viewer, p: TrackPayload, device: string | null): Promise<boolean> {
  const linkId = viewer.kind === 'link' ? viewer.linkId : null;
  return sql.begin(async (tx) => {
    const [s] = await tx<{ viewer: string; link_id: string | null }[]>`
      insert into deck_sessions (id, viewer, link_id, cohort_id, commit_sha, page_count, device, presented)
      values (${p.sid}, ${viewer.kind}, ${linkId},
        ${viewer.kind === 'admin' ? tx`(select id from cohorts where now() between starts_at - interval '90 minutes' and ends_at + interval '60 minutes' and status <> 'cancelled' order by starts_at limit 1)` : null},
        ${p.commit}, ${p.pages}, ${device}, ${p.presented})
      on conflict (id) do update set
        last_seen_at = now(),
        presented = deck_sessions.presented or excluded.presented
      returning viewer, link_id
    `;
    if (s.viewer !== viewer.kind || s.link_id !== linkId) return false;
    if (p.views.length === 0) return true;
    const rows = p.views.map((v) => ({
      session_id: p.sid,
      seq: v.seq,
      page: v.page,
      from_page: v.from,
      entered_at: new Date(v.at),
      dwell_ms: v.dwell,
    }));
    await tx`
      insert into deck_views ${tx(rows, 'session_id', 'seq', 'page', 'from_page', 'entered_at', 'dwell_ms')}
      on conflict (session_id, seq) do update set dwell_ms = greatest(deck_views.dwell_ms, excluded.dwell_ms)
    `;
    return true;
  });
}

/* ------------------------------------------------------------------ notes */

export interface DeckNote {
  id: string;
  link_id: string | null;
  link_name: string | null;
  session_id: string | null;
  page: number;
  body: string;
  commit_sha: string | null;
  done_at: Date | null;
  created_at: Date;
}

export function readNote(body: unknown): { sid: string | null; page: number; body: string; commit: string | null } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const page = int(b.page, 1, 999);
  const text = typeof b.body === 'string' ? b.body.trim().slice(0, 4000) : '';
  if (page === null || !text) return null;
  return {
    sid: isUuid(b.sid) ? b.sid.toLowerCase() : null,
    page,
    body: text,
    commit: typeof b.commit === 'string' && /^[0-9a-f]{7,40}$/.test(b.commit) ? b.commit : null,
  };
}

export async function addNote(sql: Sql, viewer: Viewer, n: NonNullable<ReturnType<typeof readNote>>): Promise<void> {
  const linkId = viewer.kind === 'link' ? viewer.linkId : null;
  // Only tie the note to a session the same viewer owns.
  await sql`
    insert into deck_notes (link_id, session_id, page, body, commit_sha)
    values (${linkId},
      (select id from deck_sessions where id = ${n.sid} and viewer = ${viewer.kind} and link_id is not distinct from ${linkId}),
      ${n.page}, ${n.body}, ${n.commit})
  `;
}

export async function listNotes(sql: Sql, opts: { open?: boolean; linkId?: string } = {}): Promise<DeckNote[]> {
  return sql<DeckNote[]>`
    select n.*, l.name as link_name from deck_notes n
    left join deck_links l on l.id = n.link_id
    where true
      ${opts.open ? sql`and n.done_at is null` : sql``}
      ${opts.linkId ? sql`and n.link_id = ${opts.linkId}` : sql``}
    order by n.done_at is not null, n.page, n.created_at
  `;
}

export async function setNoteDone(sql: Sql, id: string, done: boolean): Promise<void> {
  await sql`update deck_notes set done_at = ${done ? sql`now()` : null} where id = ${id}`;
}

/* ------------------------------------------------------------------ analytics */

/**
 * Which runs to count. 'you' is every run while signed in; 'rehearsal' is those outside a
 * cohort's day; 'room' is those during one; 'links' is everyone on a share link.
 */
export type DeckFilter =
  | { kind: 'all' }
  | { kind: 'you' }
  | { kind: 'rehearsal' }
  | { kind: 'room' }
  | { kind: 'links' }
  | { kind: 'link'; id: string }
  | { kind: 'cohort'; id: string };

export function parseFilter(v: string | undefined): DeckFilter {
  if (!v || v === 'all') return { kind: 'all' };
  if (v === 'you' || v === 'rehearsal' || v === 'room' || v === 'links') return { kind: v };
  const [k, id] = v.split(':');
  if ((k === 'link' || k === 'cohort') && isUuid(id)) return { kind: k, id };
  return { kind: 'all' };
}

export function filterKey(f: DeckFilter): string {
  return f.kind === 'link' || f.kind === 'cohort' ? `${f.kind}:${f.id}` : f.kind;
}

function where(sql: Sql, f: DeckFilter) {
  switch (f.kind) {
    case 'you':
      return sql`s.viewer = 'admin'`;
    case 'rehearsal':
      return sql`s.viewer = 'admin' and s.cohort_id is null`;
    case 'room':
      return sql`s.viewer = 'admin' and s.cohort_id is not null`;
    case 'links':
      return sql`s.viewer = 'link'`;
    case 'link':
      return sql`s.link_id = ${f.id}`;
    case 'cohort':
      return sql`s.cohort_id = ${f.id}`;
    default:
      return sql`true`;
  }
}

export interface PageStat {
  page: number;
  /** Runs that reached the page at least once. */
  reached: number;
  /** Median, across runs that reached it, of the total time spent on it. */
  median_s: number;
  mean_s: number;
  /** Times someone came back to this page from a later one. */
  backs: number;
  /** Visits after the first, in the same run. */
  revisits: number;
  /** Runs whose furthest page was this one (where people stopped). */
  stopped: number;
}

/**
 * Per page, over runs with at least `minSeconds` of viewing (drops a reload or a peek).
 */
export async function pageStats(sql: Sql, f: DeckFilter, minSeconds = 30): Promise<{ runs: number; pages: PageStat[] }> {
  const rows = await sql<(PageStat & { runs: number })[]>`
    with runs as (
      select s.id from deck_sessions s join deck_views v on v.session_id = s.id
      where ${where(sql, f)}
      group by s.id having sum(least(v.dwell_ms, ${DWELL_CAP_MS})) >= ${minSeconds * 1000}
    ),
    per as (
      select v.session_id, v.page,
        sum(least(v.dwell_ms, ${DWELL_CAP_MS})) as ms,
        count(*) filter (where v.from_page > v.page) as backs,
        count(*) - 1 as revisits
      from deck_views v join runs r on r.id = v.session_id
      group by v.session_id, v.page
    ),
    furthest as (
      select v.session_id, max(v.page) as page from deck_views v join runs r on r.id = v.session_id group by v.session_id
    )
    select p.page::int,
      count(*)::int as reached,
      round(percentile_cont(0.5) within group (order by p.ms) / 1000)::int as median_s,
      round(avg(p.ms) / 1000)::int as mean_s,
      sum(p.backs)::int as backs,
      sum(p.revisits)::int as revisits,
      (select count(*) from furthest x where x.page = p.page)::int as stopped,
      (select count(*) from runs)::int as runs
    from per p
    group by p.page
    order by p.page
  `;
  return { runs: rows[0]?.runs ?? 0, pages: rows.map(({ runs: _r, ...p }) => p) };
}

export interface SessionRow {
  id: string;
  viewer: 'admin' | 'link';
  link_id: string | null;
  link_name: string | null;
  cohort_id: string | null;
  cohort_title: string | null;
  presented: boolean;
  device: string | null;
  commit_sha: string | null;
  page_count: number | null;
  started_at: Date;
  last_seen_at: Date;
  seconds: number;
  pages_seen: number;
  furthest: number | null;
  backs: number;
}

export async function listSessions(sql: Sql, f: DeckFilter, limit = 50): Promise<SessionRow[]> {
  return sql<SessionRow[]>`
    select s.id, s.viewer, s.link_id, l.name as link_name, s.cohort_id, c.title as cohort_title, s.presented, s.device,
      s.commit_sha, s.page_count, s.started_at, s.last_seen_at,
      coalesce(sum(least(v.dwell_ms, ${DWELL_CAP_MS})) / 1000, 0)::int as seconds,
      count(distinct v.page)::int as pages_seen,
      max(v.page)::int as furthest,
      count(*) filter (where v.from_page > v.page)::int as backs
    from deck_sessions s
    left join deck_views v on v.session_id = s.id
    left join deck_links l on l.id = s.link_id
    left join cohorts c on c.id = s.cohort_id
    where ${where(sql, f)}
    group by s.id, l.name, c.title
    order by s.started_at desc
    limit ${limit}
  `;
}

export async function getSession(sql: Sql, id: string): Promise<SessionRow | null> {
  if (!isUuid(id)) return null;
  const rows = await sql<SessionRow[]>`
    select s.id, s.viewer, s.link_id, l.name as link_name, s.cohort_id, c.title as cohort_title, s.presented, s.device,
      s.commit_sha, s.page_count, s.started_at, s.last_seen_at,
      coalesce(sum(least(v.dwell_ms, ${DWELL_CAP_MS})) / 1000, 0)::int as seconds,
      count(distinct v.page)::int as pages_seen,
      max(v.page)::int as furthest,
      count(*) filter (where v.from_page > v.page)::int as backs
    from deck_sessions s
    left join deck_views v on v.session_id = s.id
    left join deck_links l on l.id = s.link_id
    left join cohorts c on c.id = s.cohort_id
    where s.id = ${id}
    group by s.id, l.name, c.title
  `;
  return rows[0] ?? null;
}

export interface ViewRow {
  seq: number;
  page: number;
  from_page: number | null;
  entered_at: Date;
  dwell_ms: number;
}

export async function listViews(sql: Sql, sessionId: string): Promise<ViewRow[]> {
  return sql<ViewRow[]>`
    select seq, page, from_page, entered_at, dwell_ms from deck_views where session_id = ${sessionId} order by seq
  `;
}

export async function deleteSession(sql: Sql, id: string): Promise<void> {
  await sql`delete from deck_sessions where id = ${id}`;
}

export async function deckTotals(sql: Sql): Promise<{ runs_7d: number; open_notes: number; live_links: number; last_run: Date | null }> {
  const [row] = await sql<{ runs_7d: number; open_notes: number; live_links: number; last_run: Date | null }[]>`
    select
      (select count(*) from deck_sessions where started_at > now() - interval '7 days')::int as runs_7d,
      (select count(*) from deck_notes where done_at is null)::int as open_notes,
      (select count(*) from deck_links where revoked_at is null and (expires_at is null or expires_at > now()))::int as live_links,
      (select max(last_seen_at) from deck_sessions) as last_run
  `;
  return row;
}

/** "1h 04m", "6m 30s", "45s". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

/** Seconds per page per run, over the same runs pageStats counts. */
export async function runPageTimes(sql: Sql, f: DeckFilter, minSeconds = 30): Promise<{ session_id: string; page: number; s: number }[]> {
  return sql<{ session_id: string; page: number; s: number }[]>`
    with runs as (
      select s.id from deck_sessions s join deck_views v on v.session_id = s.id
      where ${where(sql, f)}
      group by s.id having sum(least(v.dwell_ms, ${DWELL_CAP_MS})) >= ${minSeconds * 1000}
    )
    select v.session_id, v.page::int, (sum(least(v.dwell_ms, ${DWELL_CAP_MS})) / 1000)::int as s
    from deck_views v join runs r on r.id = v.session_id
    group by v.session_id, v.page
  `;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/**
 * Typical time on each section of the day: for every run that reached the section, its total
 * time on the section's pages; then the median across those runs.
 */
export function sectionTimes(sections: Pick<DeckSection, 'first' | 'last'>[], rows: { session_id: string; page: number; s: number }[]): { seconds: number; runs: number }[] {
  return sections.map((sec) => {
    const per = new Map<string, number>();
    for (const r of rows) if (r.page >= sec.first && r.page <= sec.last) per.set(r.session_id, (per.get(r.session_id) ?? 0) + r.s);
    return { seconds: Math.round(median([...per.values()])), runs: per.size };
  });
}

/** "Alex", "You · Fieldwork: pilot day", "You · rehearsal, presenting". */
export function runLabel(s: Pick<SessionRow, 'viewer' | 'link_name' | 'cohort_title' | 'presented'>): string {
  if (s.viewer === 'link') return s.link_name ?? 'Share link';
  if (s.cohort_title) return `You · ${s.cohort_title}`;
  return s.presented ? 'You · rehearsal, presenting' : 'You · rehearsal';
}
