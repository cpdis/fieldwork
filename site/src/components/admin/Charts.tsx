'use client';

import { useMemo, useRef, useState } from 'react';

/* Charts for the admin. Every series is one ink: identity comes from the panel titles, never
 * from colour. Each chart has a hover readout and a table beside it (see the pages). */

const fmt = (s: number) => {
  const r = Math.round(s);
  if (r < 60) return `${r}s`;
  const m = Math.floor(r / 60);
  return m < 60 ? `${m}m ${String(r % 60).padStart(2, '0')}s` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
};

export interface StripPage {
  n: number;
  title: string;
  block: number | null;
  reached: number;
  median_s: number;
  backs: number;
  revisits: number;
  stopped: number;
}

/**
 * Three panels on one page axis: time on each page (median), comebacks, and how many runs got
 * that far. One shared hover line reads all three for the page under the pointer.
 */
export function PageStrips({ pages, runs, blocks }: { pages: StripPage[]; runs: number; blocks: { n: number; name: string; first: number }[] }) {
  const W = 1000;
  const padL = 44;
  const padR = 8;
  const H = 96;
  const gap = 34;
  const inner = W - padL - padR;
  const band = inner / Math.max(pages.length, 1);
  const maxT = Math.max(30, ...pages.map((p) => p.median_s));
  const maxB = Math.max(1, ...pages.map((p) => p.backs));
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const panels = [
    { key: 't', title: 'Time on page · median', top: 0 },
    { key: 'b', title: 'Came back to it from a later page', top: H + gap },
    { key: 'r', title: `Runs that got this far · of ${runs}`, top: 2 * (H + gap) },
  ];
  const total = 3 * H + 2 * gap + 30;
  const x = (i: number) => padL + i * band;

  const niceT = niceMax(maxT);
  const niceB = Math.max(1, Math.ceil(maxB));

  function onMove(e: React.PointerEvent) {
    const svg = ref.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.floor((vx - padL) / band);
    setHover(i >= 0 && i < pages.length ? i : null);
  }

  const hp = hover === null ? null : pages[hover];
  const line = useMemo(
    () =>
      pages
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${(x(i) + band / 2).toFixed(1)},${(2 * (H + gap) + H - (runs ? (p.reached / runs) * H : 0)).toFixed(1)}`)
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pages, runs, band],
  );

  return (
    <div className="chart" style={{ position: 'relative' }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${total}`}
        width="100%"
        role="img"
        aria-label="Time, comebacks and reach for each page of the deck"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        style={{ display: 'block', touchAction: 'pan-y' }}
      >
        {panels.map((p) => (
          <g key={p.key} transform={`translate(0 ${p.top})`}>
            <text x={padL} y={-10} className="ch-title">
              {p.title}
            </text>
            <line x1={padL} x2={W - padR} y1={H} y2={H} className="ch-axis" />
            <line x1={padL} x2={W - padR} y1={0} y2={0} className="ch-grid" />
            <text x={padL - 6} y={4} className="ch-tick" textAnchor="end">
              {p.key === 't' ? fmt(niceT) : p.key === 'b' ? niceB : '100%'}
            </text>
            <text x={padL - 6} y={H} className="ch-tick" textAnchor="end">
              0
            </text>
          </g>
        ))}
        {blocks.map((b) => (
          <g key={b.n}>
            <line x1={x(b.first - 1)} x2={x(b.first - 1)} y1={0} y2={3 * H + 2 * gap} className="ch-block" />
            <text x={x(b.first - 1) + 3} y={3 * H + 2 * gap + 16} className="ch-tick">
              {b.n === 0 ? 'Open' : `B${b.n}`}
            </text>
          </g>
        ))}
        {pages.map((p, i) => {
          const h = (p.median_s / niceT) * H;
          const hb = (p.backs / niceB) * H;
          const w = Math.max(1, band - 2);
          return (
            <g key={p.n}>
              {h > 0 && <path d={bar(x(i) + 1, H, w, h)} className={`ch-bar${hover === i ? ' on' : ''}`} />}
              {hb > 0 && <path d={bar(x(i) + 1, 2 * H + gap, w, hb)} className={`ch-bar${hover === i ? ' on' : ''}`} />}
            </g>
          );
        })}
        <path d={line} className="ch-line" />
        {hp && hover !== null && (
          <g>
            <line x1={x(hover) + band / 2} x2={x(hover) + band / 2} y1={0} y2={3 * H + 2 * gap} className="ch-cross" />
            <circle cx={x(hover) + band / 2} cy={2 * (H + gap) + H - (runs ? (hp.reached / runs) * H : 0)} r={4} className="ch-dot" />
          </g>
        )}
      </svg>
      {hp && hover !== null && (
        <div
          className="ch-tip"
          style={{ left: `${((x(hover) + band / 2) / W) * 100}%`, transform: `translateX(${hover > pages.length * 0.66 ? '-100%' : hover > pages.length * 0.33 ? '-50%' : '0'})` }}
        >
          <div className="mono">Page {hp.n}</div>
          <strong>{hp.title}</strong>
          <dl>
            <dt>Median time</dt>
            <dd>{fmt(hp.median_s)}</dd>
            <dt>Came back</dt>
            <dd>{hp.backs}</dd>
            <dt>Reached</dt>
            <dd>
              {hp.reached} of {runs}
            </dd>
            {hp.stopped > 0 && (
              <>
                <dt>Stopped here</dt>
                <dd>{hp.stopped}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function niceMax(v: number): number {
  for (const s of [30, 60, 90, 120, 180, 240, 300, 420, 600, 900, 1200]) if (v <= s) return s;
  return Math.ceil(v / 600) * 600;
}

/** A bar with a 4px rounded top and a square foot on the baseline. */
function bar(x: number, base: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  const top = base - h;
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
}

/** Seats taken as the day approached: cumulative, from `span` days out to the day. */
export function PaceLine({ days, capacity, span = 60 }: { days: number[]; capacity: number; span?: number }) {
  const W = 140;
  const H = 34;
  const pts: [number, number][] = [];
  let n = 0;
  const sorted = [...days].map((d) => Math.min(d, span)).sort((a, b) => b - a);
  pts.push([0, H]);
  for (const d of sorted) {
    const px = ((span - d) / span) * W;
    pts.push([px, H - (n / Math.max(capacity, 1)) * H]);
    n += 1;
    pts.push([px, H - (n / Math.max(capacity, 1)) * H]);
  }
  pts.push([W, H - (n / Math.max(capacity, 1)) * H]);
  const d = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${Math.max(1, b).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} width={W} height={H + 4} role="img" aria-label={`${n} of ${capacity} seats, ${span} days out to the day`}>
      <title>{`${n} of ${capacity} seats taken. Left edge is ${span} days out, right edge is the day.`}</title>
      <line x1={0} x2={W} y1={0} y2={0} className="ch-grid" />
      <line x1={0} x2={W} y1={H} y2={H} className="ch-axis" />
      <path d={d} className="ch-line" />
      <circle cx={W} cy={Math.max(1, H - (n / Math.max(capacity, 1)) * H)} r={3} className="ch-dot" />
    </svg>
  );
}

/** A plain weekly bar chart with a hover readout. */
export function WeekBars({ weeks }: { weeks: { label: string; value: number; detail: string }[] }) {
  const W = 600;
  const H = 120;
  const padB = 22;
  const max = Math.max(4, ...weeks.map((w) => w.value));
  const band = W / Math.max(weeks.length, 1);
  const [hover, setHover] = useState<number | null>(null);
  const peak = weeks.reduce((a, w, i) => (w.value > (weeks[a]?.value ?? -1) ? i : a), 0);
  return (
    <div className="chart" style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H + padB}`} width="100%" role="img" aria-label="People asking about a day, per week" onPointerLeave={() => setHover(null)}>
        <line x1={0} x2={W} y1={H} y2={H} className="ch-axis" />
        {weeks.map((w, i) => {
          const h = (w.value / max) * (H - 14);
          const bw = Math.min(28, band - 8);
          const bx = i * band + (band - bw) / 2;
          return (
            <g key={w.label} onPointerEnter={() => setHover(i)}>
              <rect x={i * band} y={0} width={band} height={H + padB} fill="transparent" />
              {h > 0 && <path d={bar(bx, H, bw, h)} className={`ch-bar${hover === i ? ' on' : ''}`} />}
              {i === peak && w.value > 0 && (
                <text x={bx + bw / 2} y={H - h - 5} textAnchor="middle" className="ch-val">
                  {w.value}
                </text>
              )}
              {(i % 2 === weeks.length % 2 || weeks.length <= 8) && (
                <text x={i * band + band / 2} y={H + 16} textAnchor="middle" className="ch-tick">
                  {w.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && weeks[hover] && (
        <div className="ch-tip" style={{ left: `${((hover * band + band / 2) / W) * 100}%`, top: 0, transform: `translateX(${hover > weeks.length / 2 ? '-100%' : '0'})` }}>
          <div className="mono">Week of {weeks[hover].label}</div>
          <strong>{weeks[hover].value} asked</strong>
          <div className="small muted">{weeks[hover].detail}</div>
        </div>
      )}
    </div>
  );
}

export interface PathStep {
  seq: number;
  page: number;
  title: string;
  dwell_s: number;
  back: boolean;
}

/** One run through the deck: page against time. A ring marks each step back. */
export function RunPath({ steps, pageCount }: { steps: PathStep[]; pageCount: number }) {
  const W = 1000;
  const H = 220;
  const padL = 36;
  const padB = 22;
  const total = Math.max(1, steps.reduce((a, s) => a + Math.min(s.dwell_s, 1200), 0));
  const [hover, setHover] = useState<number | null>(null);
  let t = 0;
  const segs = steps.map((s) => {
    const x0 = padL + (t / total) * (W - padL);
    t += Math.min(s.dwell_s, 1200);
    const x1 = padL + (t / total) * (W - padL);
    const y = H - (s.page / Math.max(pageCount, 1)) * (H - 8);
    return { ...s, x0, x1, y };
  });
  const d = segs.map((s, i) => `${i ? 'L' : 'M'}${s.x0.toFixed(1)},${s.y.toFixed(1)} H${s.x1.toFixed(1)}`).join(' ');
  const h = hover === null ? null : segs[hover];
  return (
    <div className="chart" style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H + padB}`} width="100%" role="img" aria-label="Page by time through this run" onPointerLeave={() => setHover(null)}>
        <line x1={padL} x2={W} y1={H} y2={H} className="ch-axis" />
        <line x1={padL} x2={W} y1={8} y2={8} className="ch-grid" />
        <text x={padL - 6} y={12} textAnchor="end" className="ch-tick">
          {pageCount}
        </text>
        <text x={padL - 6} y={H} textAnchor="end" className="ch-tick">
          1
        </text>
        <text x={padL} y={H + 16} className="ch-tick">
          start
        </text>
        <text x={W} y={H + 16} textAnchor="end" className="ch-tick">
          {fmt(total)}
        </text>
        <path d={d} className="ch-line" />
        {segs.map((s, i) => (
          <g key={s.seq} onPointerEnter={() => setHover(i)}>
            <rect x={s.x0} y={0} width={Math.max(4, s.x1 - s.x0)} height={H} fill="transparent" />
            {s.back && <circle cx={s.x0} cy={s.y} r={5} className="ch-ring" />}
          </g>
        ))}
        {h && <line x1={(h.x0 + h.x1) / 2} x2={(h.x0 + h.x1) / 2} y1={0} y2={H} className="ch-cross" />}
      </svg>
      {h && (
        <div className="ch-tip" style={{ left: `${(((h.x0 + h.x1) / 2) / W) * 100}%`, transform: `translateX(${(h.x0 + h.x1) / 2 > W * 0.6 ? '-100%' : '0'})` }}>
          <div className="mono">
            Stop {h.seq + 1} · page {h.page}
            {h.back ? ' · back' : ''}
          </div>
          <strong>{h.title}</strong>
          <div className="small muted">{fmt(h.dwell_s)}</div>
        </div>
      )}
    </div>
  );
}
