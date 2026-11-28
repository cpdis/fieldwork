import Link from 'next/link';
import { listCohorts } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { readManifest } from '@/lib/deck';
import { formatDate, formatShortDate } from '@/lib/time';
import { listTodos } from '@/lib/todos';

export const metadata = { title: 'Overview' };

const dayFmt = new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Australia/Perth' });

export default async function Overview() {
  const sql = getSql();
  const now = new Date();
  const [todos, cohorts, manifest, [week]] = await Promise.all([
    listTodos(sql, now),
    listCohorts(sql),
    readManifest(),
    sql<{ runs: number; asked: number; booked: number }[]>`
      select
        (select count(*) from deck_sessions where started_at > now() - interval '7 days')::int as runs,
        (select count(*) from waitlist where created_at > now() - interval '7 days')::int as asked,
        (select count(*) from bookings where status in ('paid', 'comp') and coalesce(paid_at, created_at) > now() - interval '7 days')::int as booked
    `,
  ]);
  const next = cohorts
    .filter((c) => (c.status === 'open' || c.status === 'closed') && c.ends_at > now)
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0];
  const daysTo = next ? Math.ceil((next.starts_at.getTime() - now.getTime()) / 86_400_000) : null;
  const slide = manifest?.slide ?? 'fieldwork-day';

  return (
    <div className="ov">
      <div className="ov-main">
        <p className="eyebrow">
          {dayFmt.format(now)}
          {next && daysTo !== null && daysTo >= 0 && ` · ${daysTo === 0 ? 'a day is on today' : `next day in ${daysTo} ${daysTo === 1 ? 'day' : 'days'}`}`}
        </p>
        <h1 className="admin-h1">{todos.length === 0 ? 'Nothing needs you' : `${count(todos.length)} ${todos.length === 1 ? 'thing needs' : 'things need'} you`}</h1>
        {todos.length === 0 ? (
          <p className="muted" style={{ marginTop: 12 }}>
            Notes are read, seats are offered and every day has a venue. New things show up here as they happen.
          </p>
        ) : (
          <ol className="todo">
            {todos.map((t, i) => (
              <li key={t.key}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{t.title}</strong>
                  <p>{t.detail}</p>
                </div>
                <Link href={t.href} className={`btn small ${t.primary ? 'ink' : 'quiet'}`}>
                  {t.action}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>

      <aside className="ov-side">
        <section className="deckpanel">
          <p className="eyebrow">
            Deck{manifest ? ` · ${manifest.pageCount} pages${manifest.commit ? ` · main ${manifest.commit.slice(0, 7)}` : ''}` : ' · not built'}
          </p>
          <h2>{manifest?.title ?? 'The deck'}</h2>
          {manifest ? (
            <>
              <a href={`/admin/deck/s/${slide}/presenter`} target="_blank" rel="noopener" className="btn primary present">
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
                </svg>
                Present
              </a>
              <div className="two">
                <a href={`/admin/deck/s/${slide}?p=1`} target="_blank" rel="noopener" className="btn small">
                  Rehearse
                </a>
                <Link href="/admin/deck#links" className="btn small">
                  Share
                </Link>
              </div>
            </>
          ) : (
            <Link href="/admin/deck" className="btn small">
              Why it’s missing
            </Link>
          )}
        </section>

        {next && (
          <Link href={`/admin/cohorts/${next.id}`} className="card side-card">
            <p className="eyebrow" style={{ margin: 0 }}>
              {next.title.replace(/^Fieldwork:\s*/, '')} · {formatShortDate(next.starts_at)}
            </p>
            <div className="seats" aria-label={`${next.seats_taken} of ${next.capacity} seats taken`}>
              {Array.from({ length: Math.min(next.capacity, 40) }, (_, i) => (
                <i key={i} className={i < next.seats_taken ? 'taken' : i < next.seats_taken + next.seats_held ? 'held' : undefined} />
              ))}
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              <span className="num ink">
                {next.seats_taken}/{next.capacity}
              </span>{' '}
              seats · <span className="num ink">{next.waitlist_count}</span> waiting
              {next.venue_name ? ` · ${next.venue_name}` : ' · no venue yet'}
            </p>
            <p className="small muted" style={{ margin: 0 }}>
              {formatDate(next.starts_at)}
            </p>
          </Link>
        )}

        <section className="card side-card">
          <p className="eyebrow" style={{ margin: 0 }}>
            Last 7 days
          </p>
          <dl className="kv">
            <div>
              <dt>Deck runs</dt>
              <dd>{week.runs}</dd>
            </div>
            <div>
              <dt>Asked</dt>
              <dd>{week.asked}</dd>
            </div>
            <div>
              <dt>Booked</dt>
              <dd>{week.booked}</dd>
            </div>
          </dl>
          <Link href="/admin/analytics" className="small">
            All analytics
          </Link>
        </section>
      </aside>
    </div>
  );
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const count = (n: number) => WORDS[n] ?? String(n);
