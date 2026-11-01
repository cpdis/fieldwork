/*
 * Deck kit for the full-day Fieldwork deck: the staff, the day bar, block openers,
 * live-switch pages, labs with a room timer, break pages, and small page furniture.
 * Brand primitives come from @assets/fieldwork/brand; this file only composes them.
 */
import { type Page, useIsActivePage, useSlidePageNumber } from '@open-slide/core';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { Eyebrow, Frame, Pad, SideLabel, Split, Title } from '@assets/fieldwork/brand';
import { type BlockId, DAY, LEVELS, blockById, toMin } from './course';
import './kit.css';

/* ---------------- page registry, so pages can point at each other by number ---------------- */
export const registry = new Map<Page, number>();
export const PageRef = ({ page }: { page?: Page }) => {
  const n = page ? registry.get(page) : undefined;
  return <>{n ? `page ${n}` : 'the backup page'}</>;
};

/* ---------------- motion helpers ---------------- */
/** False for a beat on the live page so CSS transitions can run; true (final state) everywhere else. */
export function usePlay(delay = 80) {
  const active = useIsActivePage();
  const [on, setOn] = useState(!active);
  useEffect(() => {
    if (!active) {
      setOn(true);
      return;
    }
    setOn(false);
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  return on;
}

/** Re-render every `ms` while the page is live. Returns a counter. */
export function useTick(ms: number, running = true) {
  const active = useIsActivePage();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active || !running) return;
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [active, running, ms]);
  return n;
}

/* ---------------- furniture ---------------- */
export const PageNo = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <span className="dk-pg">
      {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </span>
  );
};

/** Source line. `half` keeps it inside the left (OpenAI) half on a Split page. */
export const Src = ({ children, right, half }: { children: ReactNode; right?: boolean; half?: boolean }) => (
  <div className={`dk-src ${right ? 'r' : ''} ${half ? 'h' : ''}`}>{children}</div>
);

/** Standard header: eyebrow, title, optional summary, page number. */
export const Head = ({
  eb,
  title,
  sum,
  children,
  style,
}: {
  eb: ReactNode;
  title: ReactNode;
  sum?: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
}) => (
  <Pad style={{ paddingBottom: 0, ...style }}>
    <Eyebrow>{eb}</Eyebrow>
    <Title>{title}</Title>
    {sum && <p className="dk-sum">{sum}</p>}
    {children}
  </Pad>
);

/** Eyebrow text for a block: "Block 3 · 10:00 · Context is everything". */
export const eb = (id: BlockId, extra?: string) => {
  const b = blockById(id);
  return `Block ${b.n} · ${b.start} · ${extra ?? b.title}`;
};

/* ---------------- the staff ---------------- */
const STAFF_W = 60;
const STAFF_H = 800;
const seg = STAFF_H / 8;
const levelTop = (l: number) => 100 - (l - 0.5) * 12.5; // % from the top, centre of the level's segment

const StaffSvg = () => {
  const u = seg / 10;
  const parts: ReactNode[] = [];
  for (let k = 1; k <= 8; k++) {
    const yb = STAFF_H - (k - 1) * seg; // bottom of this segment
    // lower E, on the left
    parts.push(<rect key={`ls${k}`} x={5} y={yb - 5 * u} width={6} height={5 * u} />);
    for (const j of [0, 2, 4]) parts.push(<rect key={`lb${k}${j}`} x={5} y={yb - (j + 1) * u} width={24} height={u} />);
    // upper E, mirrored on the right
    parts.push(<rect key={`us${k}`} x={STAFF_W - 11} y={yb - 10 * u} width={6} height={5 * u} />);
    for (const j of [5, 7, 9]) parts.push(<rect key={`ub${k}${j}`} x={STAFF_W - 29} y={yb - (j + 1) * u} width={24} height={u} />);
    parts.push(
      <text key={`n${k}`} x={44} y={yb - 1.3 * u} fontSize={26} fontWeight={600} textAnchor="middle" fontFamily="var(--f-sans)">
        {k}
      </text>,
    );
    parts.push(<rect key={`r${k}`} x={0} y={yb - 0.6} width={STAFF_W} height={1.2} fill="var(--rule)" />);
  }
  return (
    <svg viewBox={`0 0 ${STAFF_W} ${STAFF_H}`} preserveAspectRatio="none" aria-hidden="true" fill="var(--ink)">
      {parts}
    </svg>
  );
};

export const Staff = ({
  level,
  from,
  h = 38,
  names = true,
  target,
  onPick,
  marks,
}: {
  level: number;
  from?: number;
  /** Height in cqw. */
  h?: number;
  names?: boolean;
  target?: [number, number, string];
  onPick?: (n: number) => void;
  marks?: Record<number, string>;
}) => {
  const active = useIsActivePage();
  const [shown, setShown] = useState(active && from !== undefined ? from : level);
  useEffect(() => {
    if (!active || from === undefined || from === level) {
      setShown(level);
      return;
    }
    setShown(from);
    const t = setTimeout(() => setShown(level), 450);
    return () => clearTimeout(t);
  }, [active, from, level]);
  return (
    <div className="dk-staff" style={{ height: `${h}cqw` }}>
      <div className="dk-staff-face" style={{ width: `${((h * STAFF_W) / STAFF_H).toFixed(3)}cqw`, height: `${h}cqw` }}>
        <StaffSvg />
        <div className="dk-reading" style={{ top: `${levelTop(shown)}%` }} />
        {target && (
          <>
            <div
              className="dk-band"
              style={{ top: `${100 - target[1] * 12.5}%`, height: `${(target[1] - target[0] + 1) * 12.5}%` }}
            />
            <div className="dk-band-l" style={{ top: `${100 - ((target[0] + target[1]) / 2) * 12.5 + 6.25}%`, marginTop: '-.5cqw' }}>
              {target[2]}
            </div>
          </>
        )}
      </div>
      {names && (
        <div className="dk-staff-names">
          {[...LEVELS].reverse().map((l) => {
            const cls = l.n === shown ? 'on' : '';
            const label = (
              <>
                <span
                  style={
                    l.n === shown
                      ? { background: 'var(--ink)', color: 'var(--paper)', padding: '.3cqw .45cqw' }
                      : { padding: '.3cqw .45cqw' }
                  }
                >
                  L{l.n} · {l.name}
                </span>
                {marks?.[l.n] && <span style={{ color: 'var(--ink)', textTransform: 'none', letterSpacing: 0 }}>{marks[l.n]}</span>}
              </>
            );
            return (
              <div key={l.n} className={cls}>
                {onPick ? (
                  <button type="button" onClick={() => onPick(l.n)} aria-label={`Level ${l.n}, ${l.name}`}>
                    {label}
                  </button>
                ) : (
                  label
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------------- the day bar ---------------- */
export const DayBar = ({ current, style }: { current?: string; style?: CSSProperties }) => {
  const idx = DAY.findIndex((d) => d.id === current);
  return (
    <div className="dk-day" style={style}>
      {DAY.map((d, i) => {
        const len = toMin(d.end) - toMin(d.start);
        const cls = [d.kind === 'break' ? 'brk' : '', i === idx ? 'now' : '', idx >= 0 && i < idx ? 'past' : ''].join(' ');
        return (
          <div key={d.id} className={cls} style={{ flex: `${len} 1 0` }}>
            <span className="t">{d.start}</span>
            <span className="l">{d.kind === 'block' ? d.short : d.title}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ---------------- block opener ---------------- */
export const opener = (id: BlockId, promise: string): Page => {
  const P: Page = () => {
    const b = blockById(id);
    const blocks = DAY.filter((d) => d.kind === 'block') as Extract<(typeof DAY)[number], { kind: 'block' }>[];
    const prev = blocks[blocks.findIndex((x) => x.id === id) - 1];
    const from = prev ? Math.min(prev.level, b.level) : b.level;
    return (
      <Frame label={`Block ${b.n}: ${b.title}`}>
        <Pad>
          <Eyebrow>
            Block {b.n} of 8 · {b.start}–{b.end}
          </Eyebrow>
        </Pad>
        <PageNo />
        <div className="dk-open-n">{String(b.n).padStart(2, '0')}</div>
        <div className="dk-open-t">
          <h1>{b.title}</h1>
          <p>{promise}</p>
        </div>
        <div className="dk-open-out">
          <span className="dk-k">You leave this block with</span>
          <b style={{ fontWeight: 600 }}>{b.out}</b>
        </div>
        <div className="dk-open-staff">
          <Staff level={b.level} from={from} h={38} target={[4, 5, 'Today']} />
        </div>
        <div className="dk-open-day">
          <DayBar current={id} />
        </div>
      </Frame>
    );
  };
  return P;
};

/* ---------------- live switch ---------------- */
export type LiveApp = { who: 'openai' | 'claude'; app: string; mode: string; steps: ReactNode[] };
export const live = ({
  block,
  title,
  minutes,
  apps,
  backup,
}: {
  block: BlockId;
  title: string;
  minutes: number;
  apps: LiveApp[];
  backup?: () => Page | undefined;
}): Page => {
  const ordered = [...apps].sort((a, b) => (a.who === b.who ? 0 : a.who === 'openai' ? -1 : 1));
  const P: Page = () => {
    const b = blockById(block);
    const bk = backup?.();
    return (
      <Frame label={`Live: ${title}`}>
        <div className="dk-live">
          <i className="crop tl" />
          <i className="crop tr" />
          <i className="crop bl" />
          <i className="crop br" />
          <div className="dk-onair">
            <i />
            Live in the app
          </div>
          <PageNo />
          <div className="dk-live-t">
            <div className="eb">
              Block {b.n} · live demo · about {minutes} min
            </div>
            <h2>{title}</h2>
          </div>
          <div className="dk-apps">
            {ordered.map((a, i) => (
              <div key={a.app + a.mode} className={`dk-app ${ordered.length === 1 ? 'solo' : ''}`}>
                <span className="o">{ordered.length > 1 ? (i === 0 ? 'First' : 'Then') : 'In'}</span>
                <span className="n">
                  {a.app} <span>{a.mode}</span>
                </span>
                <ol>
                  {a.steps.map((s, j) => (
                    <li key={j}>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <div className="dk-live-foot">
            <span>
              Switch with <span className="dk-key">⌘</span>
              <span className="dk-key">Tab</span>. Come back the same way.
            </span>
            {bk && (
              <span>
                If the Wi-Fi or the app misbehaves: <b>
                  <PageRef page={bk} />
                </b>{' '}
                runs the same thing inside the deck.
              </span>
            )}
          </div>
        </div>
      </Frame>
    );
  };
  return P;
};

/* ---------------- lab, with a room timer that survives page changes ---------------- */
const clocks: Record<string, { end: number | null; left: number; total: number }> = {};
const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const RoomTimer = ({ id, minutes }: { id: string; minutes: number }) => {
  if (!clocks[id]) clocks[id] = { end: null, left: minutes * 60000, total: minutes * 60000 };
  const c = clocks[id];
  const [, force] = useState(0);
  useTick(250, c.end !== null);
  const left = c.end === null ? c.left : Math.max(0, c.end - Date.now());
  const up = left <= 0;
  const set = (f: () => void) => {
    f();
    force((x) => x + 1);
  };
  return (
    <div className="dk-timer" data-osd-interactive>
      <div className={`dk-clock ${up ? 'up' : ''}`}>
        <div className="k">
          <span className="dk-k" style={{ color: 'var(--ink)' }}>
            {up ? 'Time' : c.end !== null ? 'Running' : left === c.total ? 'Room timer' : 'Paused'}
          </span>
          <span className="dk-k">{Math.round(c.total / 60000)} min</span>
        </div>
        <b>{fmt(left)}</b>
        <div className="bar">
          <i style={{ width: `${(1 - left / c.total) * 100}%` }} />
        </div>
      </div>
      <div className="dk-tbtns">
        <button
          className="rb primary"
          type="button"
          onClick={() =>
            set(() => {
              if (c.end !== null) {
                c.left = Math.max(0, c.end - Date.now());
                c.end = null;
              } else if (c.left > 0) c.end = Date.now() + c.left;
            })
          }
        >
          {c.end !== null ? 'Pause' : left === c.total ? 'Start' : 'Resume'}
        </button>
        <button
          className="rb"
          type="button"
          onClick={() =>
            set(() => {
              c.total += 300000;
              if (c.end !== null) c.end = Math.max(c.end, Date.now()) + 300000;
              else c.left += 300000;
            })
          }
        >
          +5 min
        </button>
        <button
          className="rb"
          type="button"
          onClick={() =>
            set(() => {
              c.total = minutes * 60000;
              c.left = c.total;
              c.end = null;
            })
          }
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export const lab = ({
  id,
  n,
  block,
  minutes,
  title,
  goal,
  done,
  keep,
  openai,
  claude,
  hand,
}: {
  id: string;
  n: number;
  block: BlockId;
  minutes: number;
  title: string;
  goal: ReactNode;
  done: ReactNode;
  keep: ReactNode;
  openai: ReactNode[];
  claude: ReactNode[];
  hand?: string;
}): Page => {
  const P: Page = () => {
    const b = blockById(block);
    return (
      <Frame label={`Lab ${n}: ${title}`}>
        <Pad style={{ paddingBottom: 0 }}>
          <Eyebrow>
            Lab {n} · Block {b.n} · {minutes} min · your own business
          </Eyebrow>
          <Title>{title}</Title>
          <p className="dk-sum" style={{ maxWidth: '56cqw' }}>
            {goal}
          </p>
          <dl className="dk-dk">
            <dt>Done when</dt>
            <dd>{done}</dd>
            <dt>Keep</dt>
            <dd>{keep}</dd>
          </dl>
        </Pad>
        <RoomTimer id={id} minutes={minutes} />
        <Split
          top="23.2cqw"
          left={
            <>
              <SideLabel name="OpenAI · ChatGPT desktop" sub="if you pay for ChatGPT" />
              <ol className="dk-list">
                {openai.map((s, i) => (
                  <li key={i}>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </>
          }
          right={
            <>
              <SideLabel name="Claude" sub="if you pay for Claude" />
              <ol className="dk-list">
                {claude.map((s, i) => (
                  <li key={i}>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              {hand && (
                <div className="handnote" style={{ right: '3.4cqw', bottom: '2cqw' }}>
                  {hand}
                </div>
              )}
            </>
          }
        />
      </Frame>
    );
  };
  return P;
};

/* ---------------- break and lunch ---------------- */
export const breakPage = ({ title, back, sub }: { title: string; back: string; sub: string }): Page => {
  const P: Page = () => {
    useTick(1000);
    const now = new Date();
    const [h, m] = back.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    const left = target.getTime() - now.getTime();
    const counting = left > 0 && left < 75 * 60000;
    const nextBlock = DAY.find((d) => d.start === back);
    return (
      <Frame label={title}>
        <Pad>
          <Eyebrow>{title} · back at {back}</Eyebrow>
        </Pad>
        <PageNo />
        <div className="dk-break-t">
          <h1>{title}</h1>
          <p>{sub}</p>
        </div>
        <div className="dk-break-c">
          <span className="dk-k">{counting ? 'Back in' : 'Back at'}</span>
          <b>{counting ? fmt(left) : back}</b>
          {nextBlock && nextBlock.kind === 'block' && (
            <span style={{ fontSize: '1.3cqw' }}>
              Then: <b style={{ fontWeight: 600 }}>{nextBlock.title}</b>
            </span>
          )}
        </div>
        <div className="dk-open-day">
          <DayBar current={DAY.find((d) => d.kind === 'break' && d.end === back)?.id} />
        </div>
      </Frame>
    );
  };
  return P;
};

/* ---------------- small shared bits ---------------- */
export const Browser = ({ url, children, style }: { url: string; children: ReactNode; style?: CSSProperties }) => (
  <div className="dk-browser" style={style}>
    <div className="bar">
      <span className="dots">
        <i />
        <i />
        <i />
      </span>
      <span className="url">{url}</span>
    </div>
    <div className="view">{children}</div>
  </div>
);

/** Counts up from 0 to `to` on the live page. */
export const CountUp = ({ to, ms = 1200, fmtN = (n: number) => String(Math.round(n)) }: { to: number; ms?: number; fmtN?: (n: number) => string }) => {
  const active = useIsActivePage();
  const [v, setV] = useState(active ? 0 : to);
  const raf = useRef(0);
  useEffect(() => {
    if (!active) {
      setV(to);
      return;
    }
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(to * (1 - (1 - p) ** 3));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [active, to, ms]);
  return <>{fmtN(v)}</>;
};
