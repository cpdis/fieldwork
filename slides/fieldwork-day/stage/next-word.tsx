/*
 * Block 3 "It writes one likely word at a time", staged with the Stageshow kit
 * (vendor/, MIT, Benji Taylor).
 *
 * Beat n is word n + 1: the candidates' bars grow, a highlight runs over them the way
 * sampling does (quick when one word is far ahead, wandering when the bars are flat),
 * lands on the pick, and the word is typed into the sentence. The last beat ends on the
 * finished sentence and the line the block hangs on. Drawn at scale 1 (see staged.tsx).
 */
import { Hl } from '@assets/fieldwork/brand';
import type { Script } from './vendor/kit/act';
import { Collapse } from './vendor/kit/motion/Collapse';
import { States } from './vendor/kit/motion/States';
import { Staged } from './staged';
import './next-word.css';

type Cand = [string, number];
const STEPS_NW: { pick: string; cands: Cand[]; note: string }[] = [
  {
    pick: '$',
    cands: [['$', 58], ['about', 17], ['a', 9], ['approximately', 7], ['just', 4]],
    note: 'It writes one word at a time, picking a likely next word. Here it is confident.',
  },
  {
    pick: '14,500',
    cands: [['12,800', 7], ['14,500', 6], ['9,950', 5], ['18,200', 5], ['11,000', 5]],
    note: 'Now the bars are flat. Many prices look right and none is yours. Flat bars mean it is guessing.',
  },
  {
    pick: 'including',
    cands: [['including', 41], ['+', 22], ['.', 18], ['plus', 11], ['excluding', 5]],
    note: 'Back to confident. The sentence sounds more sure of itself than the number deserves.',
  },
  {
    pick: 'GST.',
    cands: [['GST.', 83], ['all', 8], ['labour', 5], ['materials', 3], ['travel', 1]],
    note: 'Fluent, confident, and invented. It has never seen your price list. That is the whole problem, and the fix.',
  },
];
export const WORDS = STEPS_NW.length;
const PICK = STEPS_NW.map((s) => s.cands.findIndex((c) => c[0] === s.pick));
const TYPED = STEPS_NW.map((s) => (s.pick === '$' ? s.pick : `${s.pick} `));
/** Where the highlight runs before it lands: short when one word is far ahead, long when the bars are flat. */
const SWEEP = [
  [2, 1, 0],
  [0, 3, 1, 4, 2, 0, 3, 2, 4, 1],
  [2, 1, 0],
  [1, 0],
];

type S = { step: number; shown: boolean; hl: number; picked: boolean; done: number; cur: string; fin: boolean };
const W = 1776;
const H = 737;

const BASE: S = { step: 0, shown: false, hl: -1, picked: false, done: 0, cur: '', fin: false };
const END: S[] = STEPS_NW.map((_, i) => ({ step: i, shown: true, hl: PICK[i], picked: true, done: i + 1, cur: '', fin: i === STEPS_NW.length - 1 }));

const BEATS: Script<S>[] = STEPS_NW.map((_, b) => async (a) => {
  await a.wait(300);
  if (b > 0) {
    await a.set({ step: b, shown: false, hl: -1, picked: false });
    await a.wait(200);
  }
  await a.set({ shown: true });
  await a.wait(1300);
  for (const h of SWEEP[b]) {
    await a.set({ hl: h });
    await a.wait(b === 1 ? 200 : 160);
  }
  await a.set({ picked: true });
  await a.wait(500);
  await a.type('cur', TYPED[b], { interval: 60 });
  await a.wait(80);
  await a.set({ done: b + 1, cur: '' });
  if (b === STEPS_NW.length - 1) {
    await a.wait(700);
    await a.set({ fin: true });
  }
});

const Scene = ({ s, beat, go }: { s: S; beat: number; go: (b: number) => void }) => {
  const cur = STEPS_NW[s.step];
  const max = Math.max(...cur.cands.map((c) => c[1]));
  return (
    <div className="nw-scene">
      <div className="nw-sent">
        <span className="dk-muted">Thanks for having us out on Tuesday. Your quote for the bathroom refit comes to </span>
        {[...TYPED.slice(0, s.done), s.cur].map((t, i) =>
          t ? (
            <span key={i}>
              <span className={i === 1 ? 'nw-guess' : undefined}>{t.trimEnd()}</span>
              {t.endsWith(' ') ? ' ' : ''}
            </span>
          ) : null,
        )}
        {!s.fin && <span className="nw-caret" data-blink={!s.cur || undefined} />}
      </div>
      <div className="nw-bars" data-shown={s.shown || undefined} data-picked={s.picked || undefined} data-fin={s.fin || undefined}>
        <span className="dk-k">{s.fin ? 'Finished' : `Candidates for the next word · step ${s.step + 1} of ${STEPS_NW.length}`}</span>
        {cur.cands.map(([w, p], i) => (
          <div
            key={`${s.step}-${w}`}
            className="nw-bar"
            data-hl={(i === s.hl && !s.picked) || undefined}
            data-pick={(s.picked && i === PICK[s.step]) || undefined}
            style={{ ['--w' as string]: `${(p / max) * 100}%`, ['--i' as string]: i }}
          >
            <span className="nw-w">{w}</span>
            <span className="nw-track">
              <i />
            </span>
            <span className="nw-p">{p}%</span>
          </div>
        ))}
      </div>
      <div className="nw-side">
        <States value={String(s.step)} align="start" className="nw-note" states={Object.fromEntries(STEPS_NW.map((x, i) => [String(i), <p key={i}>{x.note}</p>]))} />
        <div className="pbtns">
          <button className="rb primary" type="button" onClick={() => go(Math.min(STEPS_NW.length - 1, beat + 1))} disabled={beat >= STEPS_NW.length - 1}>
            Next word
          </button>
          <button className="rb" type="button" onClick={() => go(0)}>
            Start again
          </button>
        </div>
        <Collapse open={s.fin} reveal="clip">
          <p className="nw-so">
            So: <Hl>give it the price list.</Hl> That is what the rest of this block is about.
          </p>
        </Collapse>
      </div>
    </div>
  );
};

export const NextWordRun = ({ beat, take, live, go }: { beat: number; take: number; live: boolean; go: (b: number) => void }) => (
  <div className="nw">
    <Staged<S> beat={beat} take={take} live={live} base={BASE} ends={END} beats={BEATS} width={W} height={H}>
      {(s) => <Scene s={s} beat={beat} go={go} />}
    </Staged>
  </div>
);
