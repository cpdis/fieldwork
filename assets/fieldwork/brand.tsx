/*
 * Fieldwork brand components, shared by every deck in this repo.
 * Import from a slide with:  import { Frame, Title, ... } from '@assets/fieldwork/brand';
 * Rules live in themes/fieldwork.md and the house rules in AGENTS.md.
 */
import { type CSSProperties, type ReactNode, useState } from 'react';
import './fieldwork.css';

// Brand webfonts, loaded once per document (see slide-authoring/references/webfonts.md).
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Source+Sans+3:wght@400;600&family=Caveat:wght@600;700&display=swap';
const FONT_LINK_ID = 'osd-webfont-fieldwork';
if (typeof document !== 'undefined') {
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== FONT_HREF) link.href = FONT_HREF;
}

/** Root of every Fieldwork page: paper ground, tokens, and the cqw size container. */
export const Frame = ({ children, label }: { children: ReactNode; label?: string }) => (
  <div className="fw" aria-label={label}>
    {children}
  </div>
);

/** Padded header area at the top of a page. */
export const Pad = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div className="pad" style={style}>
    {children}
  </div>
);

/** Mono eyebrow, e.g. "Block 2 · 9:30 · The map of the apps". */
export const Eyebrow = ({ children }: { children: ReactNode }) => <div className="eyebrow">{children}</div>;

export const Title = ({ children }: { children: ReactNode }) => <h2 className="title">{children}</h2>;

/** Highlighter: the only sanctioned way to put the accent behind words on paper. */
/** Highlighter. A short phrase never breaks across lines (no stranded "a" or "ask" at a line end). */
export const Hl = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      background: 'var(--accent)',
      color: 'var(--ink)',
      padding: '0 .12em',
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
      whiteSpace: typeof children === 'string' && children.length <= 28 ? 'nowrap' : undefined,
    }}
  >
    {children}
  </span>
);

/**
 * The mark (8A "Hill", chosen 26 Nov 2026): three contour rings at an even
 * interval, drifting up and right so the hill has a steep side, with the
 * summit as the yellow fill. Ink on paper; the yellow always touches ink.
 * Standalone SVGs live in assets/fieldwork/mark/.
 */
export const Mark = ({ size = '9.5cqw' }: { size?: string }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
    <g fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round">
      <path d="M27.56 21.59 C26.49 24.27 22.88 26.40 20.01 27.77 C17.14 29.14 13.09 30.70 10.33 29.80 C7.57 28.90 4.48 25.18 3.44 22.38 C2.40 19.58 3.08 15.89 4.08 13.01 C5.08 10.13 6.94 6.35 9.46 5.10 C11.98 3.85 16.37 4.40 19.20 5.49 C22.03 6.59 25.05 8.99 26.45 11.68 C27.84 14.36 28.64 18.90 27.56 21.59Z" />
      <path d="M24.84 18.54 C24.15 20.25 21.84 21.61 20.01 22.49 C18.17 23.37 15.58 24.37 13.81 23.79 C12.04 23.22 10.07 20.83 9.40 19.04 C8.73 17.25 9.17 14.89 9.81 13.05 C10.45 11.21 11.64 8.79 13.26 7.98 C14.87 7.18 17.68 7.53 19.49 8.24 C21.30 8.94 23.23 10.48 24.13 12.19 C25.02 13.91 25.53 16.82 24.84 18.54Z" />
    </g>
    <path d="M21.62 15.65 C21.33 16.38 20.34 16.96 19.56 17.33 C18.78 17.70 17.68 18.13 16.93 17.88 C16.18 17.64 15.34 16.62 15.06 15.86 C14.77 15.10 14.96 14.10 15.23 13.32 C15.50 12.53 16.01 11.50 16.69 11.16 C17.38 10.82 18.57 10.97 19.34 11.27 C20.11 11.57 20.93 12.22 21.31 12.95 C21.69 13.68 21.91 14.92 21.62 15.65Z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1.5" />
  </svg>
);

/**
 * Dual-track split. Instrument (OpenAI: ChatGPT and Codex) on the left,
 * Field notes (Claude) on the right. Never swap sides between slides.
 */
export const Split = ({ top, left, right }: { top: string; left: ReactNode; right: ReactNode }) => (
  <div className="split" style={{ top }}>
    <div className="half in">{left}</div>
    <div className="half fn">{right}</div>
  </div>
);

export const SideLabel = ({ name, sub }: { name: string; sub: string }) => (
  <div className="side-label">
    <span>{name}</span>
    <span className="sub">{sub}</span>
  </div>
);

export type Hotspot = { x: number; y: number; k: string; t: string };

/**
 * A simplified stand-in for an app window, with numbered hotspots that zoom
 * the window and show a callout. Styled by the half it sits in (.in or .fn).
 */
export const InsetWindow = ({
  title,
  tabs,
  active,
  height,
  hots,
  children,
}: {
  title: string;
  tabs: string[];
  active: string;
  height: number;
  hots: Hotspot[];
  children: ReactNode;
}) => {
  const [on, setOn] = useState<number | null>(null);
  const h = on === null ? null : hots[on];
  return (
    <div className="win">
      <div className="win-bar">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
      </div>
      <div className="win-body" style={{ height: `${height}cqw` }}>
        <div
          className={`canvas ${h ? 'zoomed' : ''}`}
          style={h ? { transformOrigin: `${h.x}% ${h.y}%` } : undefined}
        >
          <div className="sidebar">
            {tabs.map((t) => (
              <div key={t} className={`t ${t === active ? 'on' : ''} ${t.endsWith('↗') ? 'ext' : ''}`}>
                {t}
              </div>
            ))}
          </div>
          <div className="main">{children}</div>
          {hots.map((hs, i) => (
            <button
              key={hs.k}
              className={`hot ${on === i ? 'active' : ''}`}
              type="button"
              style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
              aria-label={`Zoom into ${i + 1}`}
              onClick={() => setOn(on === i ? null : i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {h && (
          <div className="callout">
            <span className="k">{h.k}</span>
            <span className="tx">{h.t}</span>
            <button className="zoomout" type="button" onClick={() => setOn(null)}>
              Zoom out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/** Numbered chip used for step and job pickers. */
export const Chip = ({
  n,
  label,
  state,
  onClick,
}: {
  n: number;
  label: string;
  state: 'on' | 'past' | '';
  onClick: () => void;
}) => (
  <button className={`chip ${state}`} type="button" onClick={onClick}>
    <i>{n}</i>
    {label}
  </button>
);
