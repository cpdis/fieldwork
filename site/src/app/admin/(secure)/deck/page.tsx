import Link from 'next/link';
import { CopyButton } from '@/components/admin/CopyButton';
import { siteUrl } from '@/lib/config';
import { getSql } from '@/lib/db';
import { formatDuration, linkState, listLinks, listNotes, readManifest } from '@/lib/deck';
import { formatStamp } from '@/lib/time';
import { createShareLink, markNote, removeLink, restoreLink, revokeLink } from './actions';
import { LinkForm } from './LinkForm';

export const metadata = { title: 'Deck' };

export default async function DeckAdmin({ searchParams }: { searchParams: Promise<{ notes?: string }> }) {
  const { notes: show } = await searchParams;
  const sql = getSql();
  const [manifest, links, notes] = await Promise.all([readManifest(), listLinks(sql), listNotes(sql)]);
  const origin = siteUrl();
  const slide = manifest?.slide ?? 'fieldwork-day';
  const deckUrl = `/admin/deck/s/${slide}`;
  const titleOf = (n: number) => manifest?.pages[n - 1]?.title ?? '';
  const open = notes.filter((n) => !n.done_at);
  const visible = show === 'all' ? notes : open;

  return (
    <div className="stack loose">
      <section className="stack">
        <div className="spread">
          <div>
            <p className="eyebrow">Admin</p>
            <h2 style={{ marginTop: 6 }}>{manifest?.title ?? 'The deck'}</h2>
          </div>
          {manifest && (
            <div className="row">
              <a href={`${deckUrl}?p=1`} className="btn ink" target="_blank" rel="noopener">
                Open the deck
              </a>
              <a href={`${deckUrl}/presenter`} className="btn quiet" target="_blank" rel="noopener">
                Presenter view
              </a>
            </div>
          )}
        </div>
        {manifest ? (
          <div className="card">
            <dl className="kv">
              <div>
                <dt>Pages</dt>
                <dd>{manifest.pageCount}</dd>
              </div>
              <div>
                <dt>Blocks</dt>
                <dd>{manifest.blocks.filter((b) => b.n > 0).length}</dd>
              </div>
              <div>
                <dt>Built</dt>
                <dd style={{ fontSize: 15 }}>{formatStamp(new Date(manifest.builtAt))}</dd>
              </div>
            </dl>
            <p className="sub" style={{ margin: '14px 0 0' }}>
              This is main as of{' '}
              {manifest.commit ? (
                <a href={`https://github.com/cpdis/fieldwork/commit/${manifest.commit}`} className="mono" style={{ textTransform: 'none' }}>
                  {manifest.commit.slice(0, 7)}
                </a>
              ) : (
                'this build'
              )}
              {manifest.message ? ` · ${manifest.message}` : ''}. Every deploy rebuilds it, so a merged deck change shows up here a minute or two later. In the deck,
              press P to present: the presenter view opens with notes and a timer, and drives this window.
            </p>
          </div>
        ) : (
          <div className="notice bad">
            The deck isn&rsquo;t in this build. It&rsquo;s built by <code>scripts/build-deck.mjs</code> during <code>npm run build</code>; run{' '}
            <code>npm run build:deck</code> once for local development.
          </div>
        )}
        {manifest && (
          <details>
            <summary className="small">All {manifest.pageCount} pages</summary>
            <div className="tablebox" style={{ marginTop: 12 }}>
              <table>
                <tbody>
                  {manifest.pages.map((p) => (
                    <tr key={p.n}>
                      <td className="num" style={{ width: 48 }}>
                        {p.n}
                      </td>
                      <td>
                        <a href={`${deckUrl}?p=${p.n}`} target="_blank" rel="noopener">
                          {p.title}
                        </a>
                      </td>
                      <td className="small muted">{p.block === null ? 'Break' : p.block === 0 ? 'Opening' : `Block ${p.block}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </section>

      <section className="stack">
        <div>
          <h3>Share links</h3>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            A private link to the deck on fieldworkperth.com, one per person. They see the slides only: no speaker notes, no presenter view. Turn a link off and it stops
            working on their next page load.
          </p>
        </div>
        <LinkForm action={createShareLink} origin={origin} />
        {links.length > 0 && (
          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>For</th>
                  <th>Link</th>
                  <th>Opened</th>
                  <th>Viewed</th>
                  <th>Notes</th>
                  <th>Until</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {links.map((l) => {
                  const state = linkState(l);
                  const url = `${origin}/look/${l.token}`;
                  return (
                    <tr key={l.id} style={state === 'live' ? undefined : { opacity: 0.6 }}>
                      <td>
                        <strong>{l.name}</strong>
                        {l.note && <div className="small muted">{l.note}</div>}
                        {!l.allow_notes && <div className="small muted">Notes off</div>}
                      </td>
                      <td>
                        {state === 'live' ? (
                          <div className="copy">
                            <code title={url}>/look/{l.token}</code>
                            <CopyButton text={url} label="Copy" />
                          </div>
                        ) : (
                          <span className={`tag ${state === 'revoked' ? 'bad' : 'mute'}`}>{state === 'revoked' ? 'off' : 'expired'}</span>
                        )}
                      </td>
                      <td className="num small">
                        {l.open_count}×{l.last_opened_at && <div className="muted">{formatStamp(l.last_opened_at)}</div>}
                      </td>
                      <td className="num small">
                        {l.sessions > 0 ? (
                          <Link href={`/admin/analytics?who=link:${l.id}`}>
                            {formatDuration(l.seconds)}
                            {l.furthest ? ` · to p${l.furthest}` : ''}
                          </Link>
                        ) : (
                          <span className="muted">not yet</span>
                        )}
                      </td>
                      <td className="num small">{l.notes}</td>
                      <td className="num small">{l.expires_at ? formatStamp(l.expires_at) : 'no end'}</td>
                      <td className="actions">
                        {state === 'live' ? (
                          <form action={revokeLink.bind(null, l.id)}>
                            <button className="btn small quiet">Turn off</button>
                          </form>
                        ) : (
                          <form action={restoreLink.bind(null, l.id)}>
                            <button className="btn small quiet">Turn on for 14 days</button>
                          </form>
                        )}{' '}
                        {state !== 'live' && (
                          <form action={removeLink.bind(null, l.id)}>
                            <button className="btn small quiet" title="Deletes the link, its runs and its notes">
                              Delete
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stack" id="notes">
        <div className="spread">
          <div>
            <h3>Notes on pages</h3>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              Left with the &ldquo;Note on page&rdquo; button, by you while rehearsing or by someone on a share link. Grouped by page.
            </p>
          </div>
          <div className="pills">
            <Link href="/admin/deck#notes" aria-current={show !== 'all' ? 'true' : undefined}>
              Open · {open.length}
            </Link>
            <Link href="/admin/deck?notes=all#notes" aria-current={show === 'all' ? 'true' : undefined}>
              All · {notes.length}
            </Link>
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="muted">{notes.length === 0 ? 'No notes yet.' : 'Nothing open. Every note is marked done.'}</p>
        ) : (
          <div className="card" style={{ padding: '4px 20px' }}>
            <ul className="notes-list">
              {visible.map((n) => (
                <li key={n.id} className={n.done_at ? 'done' : undefined}>
                  <a href={`${deckUrl}?p=${n.page}`} target="_blank" rel="noopener" className="num">
                    p{n.page}
                  </a>
                  <div>
                    <div className="small muted">
                      <strong style={{ color: 'var(--ink)' }}>{titleOf(n.page)}</strong> · {n.link_name ?? 'You'} · {formatStamp(n.created_at)}
                      {manifest?.commit && n.commit_sha && n.commit_sha !== manifest.commit && ' · on an older build'}
                    </div>
                    <blockquote>{n.body}</blockquote>
                  </div>
                  <form action={markNote.bind(null, n.id, !n.done_at)}>
                    <button className="btn small quiet">{n.done_at ? 'Reopen' : 'Done'}</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
