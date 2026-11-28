import Link from 'next/link';
import { StatusTag } from '@/components/AdminBits';
import { HeatMap, PaceLine, WeekBars } from '@/components/admin/Charts';
import { cohortStats, interestByWeek } from '@/lib/cohort-stats';
import { listCohorts } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { filterKey, formatDuration, listLinks, listSessions, pageStats, parseFilter, readManifest, runLabel, runPageTimes, sectionTimes } from '@/lib/deck';
import { formatMoney, formatShortDate, formatStamp } from '@/lib/time';

export const metadata = { title: 'Analytics' };

const weekFmt = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export default async function Analytics({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  const { who } = await searchParams;
  // Default to Colin's own runs: the timetable comparison only means something for a full run.
  const filter = parseFilter(who ?? 'you');
  const key = filterKey(filter);
  const sql = getSql();
  const [manifest, stats, perRun, sessions, links, cohorts, cstats, weeks] = await Promise.all([
    readManifest(),
    pageStats(sql, filter),
    runPageTimes(sql, filter),
    listSessions(sql, filter, 40),
    listLinks(sql),
    listCohorts(sql),
    cohortStats(sql),
    interestByWeek(sql, 12),
  ]);

  const pageCount = manifest?.pageCount ?? Math.max(0, ...stats.pages.map((p) => p.page));
  const byPage = new Map(stats.pages.map((p) => [p.page, p]));
  const strip = Array.from({ length: pageCount }, (_, i) => {
    const s = byPage.get(i + 1);
    const m = manifest?.pages[i];
    return {
      n: i + 1,
      title: m?.title ?? `Page ${i + 1}`,
      block: m?.block ?? null,
      reached: s?.reached ?? 0,
      median_s: s?.median_s ?? 0,
      backs: s?.backs ?? 0,
      revisits: s?.revisits ?? 0,
      stopped: s?.stopped ?? 0,
    };
  });
  const mostBacks = [...strip].filter((p) => p.backs > 0).sort((a, b) => b.backs - a.backs).slice(0, 5);
  const longest = [...strip].filter((p) => p.median_s > 0).sort((a, b) => b.median_s - a.median_s).slice(0, 5);
  const finished = strip.length ? strip[strip.length - 1].reached : 0;

  // Per section of the day: the median, across runs, of each run's time on it, against the timetable.
  const sections = manifest?.blocks ?? [];
  const times = sectionTimes(sections, perRun);
  const rows = sections.map((b, i) => {
    const sec = times[i].seconds;
    const over = b.planMin !== null && times[i].runs > 0 && sec > b.planMin * 60 + 120;
    return {
      ...b,
      key: `${b.first}`,
      name: b.n === null ? `${b.name}${b.start ? ` · ${b.start}` : ''}` : b.name,
      time: times[i].runs ? formatMinutes(sec) : '–',
      plan: b.planMin === null ? null : `${b.planMin}m`,
      over,
      seconds: sec,
      backs: strip.slice(b.first - 1, b.last).reduce((a, p) => a + p.backs, 0),
    };
  });
  const typical = rows.reduce((a, r) => a + r.seconds, 0);
  const planned = sections.reduce((a, b) => a + (b.planMin ?? 0), 0);
  const scale = Math.max(1, ...rows.map((r) => Math.max(r.seconds / 60, r.planMin ?? 0)));

  const filters: { key: string; label: string }[] = [
    { key: 'you', label: 'You' },
    { key: 'all', label: 'Everyone' },
    { key: 'rehearsal', label: 'Your rehearsals' },
    { key: 'room', label: 'In the room' },
    { key: 'links', label: 'Share links' },
    ...links.filter((l) => l.sessions > 0).map((l) => ({ key: `link:${l.id}`, label: l.name })),
    ...cohorts.filter((c) => cstats.find((s) => s.id === c.id)).slice(0, 6).map((c) => ({ key: `cohort:${c.id}`, label: formatShortDate(c.starts_at) })),
  ];
  // Cohort pills only make sense for days that have runs; keep the list short.
  const cohortIdsWithRuns = new Set(sessions.map((s) => s.cohort_id).filter(Boolean));
  const shown = filters.filter((f) => !f.key.startsWith('cohort:') || cohortIdsWithRuns.has(f.key.slice(7)) || f.key === key);

  const totals = cstats.reduce(
    (a, c) => ({ seats: a.seats + c.seats, capacity: a.capacity + (c.status === 'cancelled' ? 0 : c.capacity), revenue: a.revenue + c.revenue_cents, responses: a.responses + c.responses }),
    { seats: 0, capacity: 0, revenue: 0, responses: 0 },
  );

  return (
    <div className="stack loose">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="admin-h1">Analytics</h1>
      </div>

      <section className="stack">
        <div className="spread">
          <div>
            <h3>The day, block by block</h3>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              Every run through the deck on this site, yours and your share links&rsquo;. Time counts only while the deck is on screen; runs under 30 seconds are left out, and a
              single stop over 20 minutes counts as 20.
            </p>
          </div>
        </div>
        <div className="pills" role="group" aria-label="Whose runs">
          {shown.map((f) => (
            <Link key={f.key} href={f.key === 'you' ? '/admin/analytics' : `/admin/analytics?who=${f.key}`} aria-current={f.key === key ? 'true' : undefined} scroll={false}>
              {f.label}
            </Link>
          ))}
        </div>
        {stats.runs === 0 ? (
          <div className="card">
            <p style={{ margin: 0 }}>No runs here yet.</p>
            <p className="small muted" style={{ margin: '6px 0 0' }}>
              Open the deck from the <Link href="/admin/deck">Deck</Link> page or send a share link; each run shows up here a few seconds after it starts.
            </p>
          </div>
        ) : (
          <>
            <div className="stats card">
              <div className="stat">
                <div className="v">{stats.runs}</div>
                <div className="k">Runs</div>
              </div>
              <div className="stat">
                <div className="v">{formatMinutes(typical)}</div>
                <div className="k">Typical run{planned ? ` · plan ${formatMinutes(planned * 60)}` : ''}</div>
              </div>
              <div className="stat">
                <div className="v">
                  {finished}/{stats.runs}
                </div>
                <div className="k">Reached the last page</div>
              </div>
              <div className="stat">
                <div className="v">{strip.reduce((a, p) => a + p.backs, 0)}</div>
                <div className="k">Steps back</div>
              </div>
            </div>
            <HeatMap rows={rows} pages={strip} runs={stats.runs} deckUrl={`/admin/deck/s/${manifest?.slide ?? 'fieldwork-day'}`} />
            {planned > 0 && (
              <div className="card">
                <p className="eyebrow" style={{ margin: 0 }}>
                  Against the timetable · minutes
                </p>
                <div className="plan-rows">
                  {rows
                    .filter((r) => r.planMin !== null)
                    .map((r) => {
                      const d = Math.round(r.seconds / 60) - (r.planMin ?? 0);
                      return (
                        <div className="plan-row" key={r.key}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                          <div className="plan-bar" aria-label={`${Math.round(r.seconds / 60)} minutes against ${r.planMin} planned`}>
                            <div className="plan" style={{ width: `${((r.planMin ?? 0) / scale) * 100}%` }} />
                            {r.seconds > 0 && <div className="act" style={{ width: `${(r.seconds / 60 / scale) * 100}%` }} />}
                          </div>
                          <span className="num" style={{ textAlign: 'right', fontWeight: d > 2 ? 600 : 400 }}>
                            {r.seconds === 0 ? '–' : `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)}m`}
                          </span>
                        </div>
                      );
                    })}
                </div>
                <p className="small muted" style={{ margin: '14px 0 0' }}>
                  Outline: the slot in the deck&rsquo;s timetable (course.ts). Bar: the typical time across these runs.
                </p>
              </div>
            )}
            <div className="grid2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div className="card">
                <p className="eyebrow" style={{ margin: 0 }}>Longest on</p>
                <ol className="small" style={{ margin: '10px 0 0', paddingLeft: 20 }}>
                  {longest.map((p) => (
                    <li key={p.n} style={{ marginTop: 4 }}>
                      <span className="num">p{p.n}</span> {p.title} · <span className="num">{formatDuration(p.median_s)}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="card">
                <p className="eyebrow" style={{ margin: 0 }}>Most gone back to</p>
                {mostBacks.length === 0 ? (
                  <p className="small muted" style={{ margin: '10px 0 0' }}>
                    Nobody has stepped back yet.
                  </p>
                ) : (
                  <ol className="small" style={{ margin: '10px 0 0', paddingLeft: 20 }}>
                    {mostBacks.map((p) => (
                      <li key={p.n} style={{ marginTop: 4 }}>
                        <span className="num">p{p.n}</span> {p.title} · <span className="num">{p.backs}×</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
            <details>
              <summary className="small">Every page as a table</summary>
              <div className="tablebox" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Title</th>
                      <th>Median</th>
                      <th>Reached</th>
                      <th>Came back</th>
                      <th>Revisits</th>
                      <th>Stopped here</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strip.map((p) => (
                      <tr key={p.n}>
                        <td className="num">{p.n}</td>
                        <td>{p.title}</td>
                        <td className="num">{formatDuration(p.median_s)}</td>
                        <td className="num">{p.reached}</td>
                        <td className="num">{p.backs}</td>
                        <td className="num">{p.revisits}</td>
                        <td className="num">{p.stopped}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
        {sessions.length > 0 && (
          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Who</th>
                  <th>Time</th>
                  <th>Pages</th>
                  <th>Steps back</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="num small">
                      <Link href={`/admin/analytics/runs/${s.id}`}>{formatStamp(s.started_at)}</Link>
                    </td>
                    <td>{runLabel(s)}</td>
                    <td className="num">{formatDuration(s.seconds)}</td>
                    <td className="num">
                      {s.pages_seen} seen{s.furthest ? ` · to p${s.furthest}` : ''}
                    </td>
                    <td className="num">{s.backs}</td>
                    <td className="small muted">{s.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stack">
        <div>
          <h3>Cohorts</h3>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            Seats, money and feedback per day. The line shows seats filling over the 60 days before each day.
          </p>
        </div>
        <div className="stats card">
          <div className="stat">
            <div className="v">
              {totals.seats}/{totals.capacity}
            </div>
            <div className="k">Seats filled, all days</div>
          </div>
          <div className="stat">
            <div className="v">{formatMoney(totals.revenue)}</div>
            <div className="k">Taken, paid seats</div>
          </div>
          <div className="stat">
            <div className="v">{weeks.reduce((a, w) => a + w.general + w.waitlist, 0)}</div>
            <div className="k">Asked about a day · 12 weeks</div>
          </div>
          <div className="stat">
            <div className="v">{totals.responses}</div>
            <div className="k">Feedback answers</div>
          </div>
        </div>
        {cstats.length > 0 && (
          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Filled</th>
                  <th>Pace</th>
                  <th>Taken</th>
                  <th>Waitlist</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {cstats.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/cohorts/${c.id}`}>{c.title}</Link>
                      <div className="num small muted">{formatShortDate(c.starts_at)}</div>
                    </td>
                    <td>
                      <StatusTag status={c.status} />
                    </td>
                    <td className="num">
                      {c.seats}/{c.capacity}
                      <div className="small muted">{Math.round((c.seats / Math.max(1, c.capacity)) * 100)}%</div>
                    </td>
                    <td>
                      <PaceLine days={c.booked_days_before} capacity={c.capacity} />
                    </td>
                    <td className="num">
                      {formatMoney(c.revenue_cents, c.currency)}
                      {c.dropped > 0 && <div className="small muted">{c.dropped} refunded or cancelled</div>}
                    </td>
                    <td className="num">{c.waitlist}</td>
                    <td className="num small">
                      {c.responses === 0 ? (
                        <span className="muted">none yet</span>
                      ) : (
                        <>
                          {c.responses} answers
                          {c.useful_avg !== null && <div>useful {c.useful_avg}/5</div>}
                          {c.recommend_yes !== null && <div>{Math.round(c.recommend_yes * 100)}% would recommend</div>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="stack">
          <h4 style={{ margin: 0 }}>People asking about a day, per week</h4>
          <WeekBars
            weeks={weeks.map((w) => ({
              label: weekFmt.format(w.week),
              value: w.general + w.waitlist,
              detail: `${w.general} for the next public day, ${w.waitlist} on a day’s waitlist`,
            }))}
          />
        </div>
      </section>
    </div>
  );
}

/** "1h 04m", "58m". */
function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}
