import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageStrips, RunPath } from '@/components/admin/Charts';
import { getSql } from '@/lib/db';
import { DWELL_CAP_MS, formatDuration, getSession, listViews, readManifest, runLabel } from '@/lib/deck';
import { formatStamp } from '@/lib/time';
import { removeRun } from '../../../deck/actions';

export const metadata = { title: 'Run' };

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = getSql();
  const [run, manifest] = await Promise.all([getSession(sql, id), readManifest()]);
  if (!run) notFound();
  const views = await listViews(sql, run.id);
  const pageCount = manifest?.pageCount ?? run.page_count ?? Math.max(1, ...views.map((v) => v.page));
  const titleOf = (n: number) => manifest?.pages[n - 1]?.title ?? `Page ${n}`;

  const per = new Map<number, { s: number; backs: number; visits: number }>();
  for (const v of views) {
    const p = per.get(v.page) ?? { s: 0, backs: 0, visits: 0 };
    p.s += Math.min(v.dwell_ms, DWELL_CAP_MS) / 1000;
    p.visits += 1;
    if (v.from_page !== null && v.from_page > v.page) p.backs += 1;
    per.set(v.page, p);
  }
  const strip = Array.from({ length: pageCount }, (_, i) => {
    const p = per.get(i + 1);
    return {
      n: i + 1,
      title: titleOf(i + 1),
      block: manifest?.pages[i]?.block ?? null,
      reached: p ? 1 : 0,
      median_s: Math.round(p?.s ?? 0),
      backs: p?.backs ?? 0,
      revisits: Math.max(0, (p?.visits ?? 0) - 1),
      stopped: run.furthest === i + 1 ? 1 : 0,
    };
  });
  const steps = views.map((v) => ({
    seq: v.seq,
    page: v.page,
    title: titleOf(v.page),
    dwell_s: Math.round(v.dwell_ms / 1000),
    back: v.from_page !== null && v.from_page > v.page,
  }));
  const stale = manifest?.commit && run.commit_sha && manifest.commit !== run.commit_sha;

  return (
    <div className="stack loose">
      <div className="stack">
        <p className="small">
          <Link href="/admin/analytics">Analytics</Link>
        </p>
        <div>
          <p className="eyebrow">Run · {formatStamp(run.started_at)}</p>
          <h1 className="admin-h1">{runLabel(run)}</h1>
        </div>
        <div className="stats card">
          <div className="stat">
            <div className="v">{formatDuration(run.seconds)}</div>
            <div className="k">On screen</div>
          </div>
          <div className="stat">
            <div className="v">{run.pages_seen}</div>
            <div className="k">Pages seen</div>
          </div>
          <div className="stat">
            <div className="v">{run.furthest ? `p${run.furthest}` : '–'}</div>
            <div className="k">Furthest</div>
          </div>
          <div className="stat">
            <div className="v">{run.backs}</div>
            <div className="k">Steps back</div>
          </div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          {run.device ?? 'Unknown device'} · last seen {formatStamp(run.last_seen_at)}
          {run.presented && ' · driven from the presenter view'}
          {stale && ' · on an older build of the deck, so page numbers may have moved'}
        </p>
      </div>

      {steps.length === 0 ? (
        <p className="muted">This run has no pages yet.</p>
      ) : (
        <>
          <section className="stack">
            <h3>Path through the deck</h3>
            <p className="small muted" style={{ margin: 0 }}>
              Page against time on screen. A ring marks each step back to an earlier page.
            </p>
            <RunPath steps={steps} pageCount={pageCount} />
          </section>
          <section className="stack">
            <h3>Page by page</h3>
            <PageStrips pages={strip} runs={1} blocks={manifest?.blocks ?? []} single />
          </section>
          <details>
            <summary className="small">Every stop, in order</summary>
            <div className="tablebox" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Page</th>
                    <th>Time</th>
                    <th>From</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s) => (
                    <tr key={s.seq}>
                      <td className="num">{s.seq + 1}</td>
                      <td>
                        <span className="num">p{s.page}</span> {s.title}
                      </td>
                      <td className="num">{formatDuration(s.dwell_s)}</td>
                      <td className="num small">{s.back ? `back from p${views.find((v) => v.seq === s.seq)?.from_page}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <form action={removeRun.bind(null, run.id)}>
        <button className="btn small quiet">Delete this run</button>
      </form>
    </div>
  );
}
