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
export const Hl = ({ children }: { children: ReactNode }) => (
  <span style={{ background: 'var(--accent)', color: 'var(--ink)', padding: '0 .12em' }}>{children}</span>
);

/** Benchmark mark: a yellow bar over a tripod. */
export const Mark = ({ size = '9.5cqw' }: { size?: string }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <rect x="12" y="20" width="76" height="9" fill="var(--accent)" />
    <path
      d="M50 36 L50 84 M50 36 L24 84 M50 36 L76 84"
      stroke="var(--ink)"
      strokeWidth="7"
      fill="none"
      strokeLinecap="square"
    />
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
