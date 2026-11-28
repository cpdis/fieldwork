import { cookies } from 'next/headers';
import { isAdmin } from './auth';
import { getSql } from './db';
import {
  addNote,
  deviceLabel,
  injectTracker,
  liveLink,
  LOOK_COOKIE,
  readEntryHtml,
  readManifest,
  readNote,
  readTrackPayload,
  recordTrack,
  verifyLookCookie,
  type DeckLink,
  type Viewer,
} from './deck';

/** The viewer behind a request: Colin (admin session) or a live share link. */
export async function viewerFor(kind: 'admin' | 'look'): Promise<{ viewer: Viewer; link: DeckLink | null } | null> {
  if (kind === 'admin') return (await isAdmin()) ? { viewer: { kind: 'admin' }, link: null } : null;
  const id = verifyLookCookie((await cookies()).get(LOOK_COOKIE)?.value);
  if (!id) return null;
  const link = await liveLink(getSql(), id);
  return link ? { viewer: { kind: 'link', linkId: link.id }, link } : null;
}

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });

/** GET for the deck's entry page, at any of its client-side routes. */
export async function serveDeck(kind: 'admin' | 'look', req: Request): Promise<Response> {
  const who = await viewerFor(kind);
  if (!who) return Response.redirect(new URL(kind === 'admin' ? '/admin/login' : '/look', req.url), 303);
  const [entry, manifest] = await Promise.all([readEntryHtml(kind), readManifest()]);
  if (!entry || !manifest) return html(notBuilt(), 503);
  return html(
    injectTracker(
      entry,
      {
        mode: kind,
        api: kind === 'admin' ? '/admin/deck/api' : '/look/api',
        commit: manifest.commit,
        pageCount: manifest.pageCount,
        notes: kind === 'admin' ? true : Boolean(who.link?.allow_notes),
        who: kind === 'admin' ? undefined : 'Colin',
      },
      kind === 'admin' ? `${manifest.title} · admin` : manifest.title,
    ),
  );
}

function notBuilt(): string {
  return `<!doctype html><meta charset="utf-8"><title>Deck not built</title><body style="font:16px/1.5 system-ui;margin:48px">
<p>The deck isn’t in this build. It’s built by <code>site/scripts/build-deck.mjs</code> before <code>next build</code>.</p></body>`;
}

async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > 64_000) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function crossSite(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(req.url).host;
  } catch {
    return true;
  }
}

const empty = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

/** POST from the tracker (sendBeacon or fetch keepalive). */
export async function handleTrack(kind: 'admin' | 'look', req: Request): Promise<Response> {
  if (crossSite(req)) return empty(403);
  const who = await viewerFor(kind);
  if (!who) return empty(401);
  const payload = readTrackPayload(await readJson(req));
  if (!payload) return empty(400);
  const ok = await recordTrack(getSql(), who.viewer, payload, payload.device ?? deviceLabel(req.headers.get('user-agent')));
  return empty(ok ? 204 : 409);
}

/** POST from the note box. */
export async function handleNote(kind: 'admin' | 'look', req: Request): Promise<Response> {
  if (crossSite(req)) return empty(403);
  const who = await viewerFor(kind);
  if (!who) return empty(401);
  if (who.link && !who.link.allow_notes) return empty(403);
  const note = readNote(await readJson(req));
  if (!note) return empty(400);
  await addNote(getSql(), who.viewer, note);
  return empty(204);
}
