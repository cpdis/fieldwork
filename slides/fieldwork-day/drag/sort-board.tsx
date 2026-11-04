/*
 * Sort board: cards the room drags into zones, drawn with Dragology (vendor/, declarative dragging).
 *
 * The board is one SVG laid over the page's own HTML (the zones' boxes, labels and buttons stay
 * HTML, styled in deck.css). Each card is a <g> with a <foreignObject> inside, so the card's copy
 * is ordinary HTML in the brand fonts. Dragology only needs the <g>'s translate(): it works out
 * every place the dragged card could land (every zone, every slot), lets the card float under the
 * pointer, and animates the other cards into the order they would take if it dropped there.
 *
 * Coordinates are canvas pixels (1cqw = 19.2px on the 1920 canvas). The wrapper is sized in cqw
 * from the same numbers, so SVG units and CSS pixels agree and cqw sizes inside the cards hold.
 * Pointer mapping in Dragology divides by the SVG's rendered scale, so it also holds when
 * open-slide scales the whole canvas to the window.
 *
 * The page owns the state (`state` + `onChange`). Drops report through onChange; a state the page
 * sets itself (show the answers, reset) is animated into place over `transition` ms.
 *
 * Rules from vendor/AGENTS.md that matter here: position with transform={translate()}, never
 * x/y; identify elements with id, never key; ids unique across the page; no Fragments inside.
 */
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { type Draggable, DraggableRenderer, type SetState, translate } from './vendor/dragology';
import './drag.css';

export const PX = 19.2; // canvas px per cqw
export const cqw = (px: number) => `${(px / PX).toFixed(4)}cqw`;

export type Zone = {
  id: string;
  /** Box in board px. Cards are laid out inside it, below `top`. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Space above the first card (for the zone's HTML title). */
  top?: number;
  /** Side padding inside the box. */
  pad?: number;
  cols?: number;
  cardH: number;
  gap?: number;
};

/** Zone id → card ids, in order. */
export type SortState = { in: Record<string, string[]> };

export const zoneOf = (s: SortState, card: string) => Object.keys(s.in).find((z) => s.in[z].includes(card));

/** Build a state from a map of card → zone, keeping `cards` order. */
export const stateFrom = (zones: string[], cards: string[], at: (card: string) => string): SortState => {
  const next: SortState = { in: Object.fromEntries(zones.map((z) => [z, [] as string[]])) };
  for (const c of cards) next.in[at(c)].push(c);
  return next;
};

const slot = (z: Zone, i: number) => {
  const cols = z.cols ?? 1;
  const pad = z.pad ?? 0;
  const gap = z.gap ?? 8;
  const w = (z.w - 2 * pad - (cols - 1) * gap) / cols;
  return { x: z.x + pad + (i % cols) * (w + gap), y: z.y + (z.top ?? 0) + Math.floor(i / cols) * (z.cardH + gap), w, h: z.cardH };
};

/** `card` moved into zone `z` at index `i` (clamped). */
const insert = (s: SortState, card: string, z: string, i: number): SortState => {
  const next: SortState = { in: {} };
  for (const k of Object.keys(s.in)) next.in[k] = s.in[k].filter((c) => c !== card);
  const at = Math.max(0, Math.min(next.in[z].length, i));
  next.in[z] = [...next.in[z].slice(0, at), card, ...next.in[z].slice(at)];
  return next;
};

/** The slot in zone `z` whose centre is nearest the pointer, for a list of `n` cards. */
const nearestSlot = (z: Zone, n: number, p: { x: number; y: number }) => {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i <= n; i++) {
    const r = slot(z, i);
    const dx = p.x - (r.x + r.w / 2);
    const dy = p.y - (r.y + r.h / 2);
    const d2 = dx * dx + dy * dy;
    if (d2 < bd) {
      bd = d2;
      best = i;
    }
  }
  return best;
};

export const SortBoard = ({
  id,
  width,
  height,
  zones,
  cards,
  state,
  onChange,
  locked = false,
  transition = 650,
  render,
}: {
  /** Prefix for element ids; unique per page. */
  id: string;
  width: number;
  height: number;
  zones: Zone[];
  /** All card ids, in a stable order. */
  cards: string[];
  state: SortState;
  onChange: (s: SortState) => void;
  /** True freezes the cards (after the answers are shown). */
  locked?: boolean;
  /** How long a state set by the page takes to animate, in ms. */
  transition?: number;
  /** The card's HTML. `zone` is where it sits in the state being drawn. */
  render: (card: string, zone: string, dragging: boolean) => ReactNode;
}) => {
  const byId = useMemo(() => Object.fromEntries(zones.map((z) => [z.id, z])), [zones]);
  // Where the pointer is, in board px, updated every frame of a drag (see changeFrame below).
  const pointer = useRef({ x: 0, y: 0 });
  // The renderer keeps its own state so that a state set by the page can animate (setState with a
  // transition). `inner` is the last state the renderer told us about; a differing prop is pushed in.
  const setInner = useRef<SetState<SortState> | null>(null);
  const inner = useRef(state);
  useEffect(() => {
    if (state !== inner.current) {
      inner.current = state;
      setInner.current?.(state, { transition });
    }
  }, [state, transition]);
  const onDrop = useCallback(
    (s: SortState) => {
      inner.current = s;
      onChange(s);
    },
    [onChange],
  );
  const draggable: Draggable<SortState> = useCallback(
    ({ state: s, d, draggedId, setState }) => (
      <g>
        {void (setInner.current = setState)}
        {zones.map((z) => (
          <rect id={`${id}-zone-${z.id}`} transform={translate(z.x, z.y)} width={z.w} height={z.h} fill="none" />
        ))}
        {cards.map((c) => {
          const z = zoneOf(s, c);
          if (!z) return null;
          const { x, y, w, h } = slot(byId[z], s.in[z].indexOf(c));
          const gid = `${id}-${c}`;
          const dragging = draggedId === gid;
          return (
            <g id={`${gid}-slot`}>
              {dragging && (
                <g id={`${gid}-ghost`} transform={translate(x, y)}>
                  <rect className="dg-ghost" width={w} height={h} />
                </g>
              )}
              <g
              id={gid}
              transform={translate(x, y)}
              dragologyZIndex={dragging ? '/1' : false}
              dragologyOnDrag={
                locked
                  ? false
                  : () =>
                      // The zone under the pointer wins (dropTarget, gap 0 inside it); within that zone, the
                      // slot nearest the pointer. Outside every zone the card goes back where it was (fixed).
                      d
                        .closest([
                          ...zones.map((z) =>
                            d
                              .dropTarget(`${id}-zone-${z.id}`, insert(s, c, z.id, Infinity))
                              .during(() => insert(s, c, z.id, nearestSlot(z, s.in[z.id].filter((k) => k !== c).length, pointer.current))),
                          ),
                          d.fixed(s),
                        ])
                        .withFloating()
                        .changeFrame((f) => {
                          pointer.current = f.pointer;
                          return f;
                        })
              }
            >
                <foreignObject width={w} height={h}>
                  <div
                    className={`dg-card in-${z} ${dragging ? 'dragging' : ''} ${locked ? 'locked' : ''}`}
                    style={{ ['--i' as string]: cards.indexOf(c) }}
                  >
                    {render(c, z, dragging)}
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}
      </g>
    ),
    [byId, cards, id, locked, render, zones],
  );
  return (
    <div className="dg-board" style={{ width: cqw(width), height: cqw(height) }}>
      <DraggableRenderer draggable={draggable} initialState={state} onDropState={onDrop} width={width} height={height} />
    </div>
  );
};
