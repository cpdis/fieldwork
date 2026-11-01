// brand-check: ignore-colours, ignore-words (the first-draft tile breaks the brand on purpose, and the log names what it breaks)
/*
 * Block 4 "A checker that can count", staged with the Stageshow kit (vendor/, MIT, Benji Taylor).
 *
 * Beat 0: the first-draft tile and an empty prompt. Beat 1: the check is typed and run, and
 * each problem it reports is pinned on the tile as it lands. Beat 2: the agent fixes the five,
 * the tile changes, and the check runs again clean. Drawn at scale 1 (see staged.tsx).
 */
import { Mark } from '@assets/fieldwork/brand';
import type { Script } from './vendor/kit/act';
import { Collapse } from './vendor/kit/motion/Collapse';
import { States } from './vendor/kit/motion/States';
import { Check } from './vendor/kit/parts/Check';
import { Staged } from './staged';
import './check-run.css';

const CMD = 'brand-check linkedin-tile.html';
const FAILS = [
  ['colour #7c3aed is not in the palette', 'line 12'],
  ['font “Poppins” is not a brand font', 'line 4'],
  ['banned phrase “supercharge”', 'line 31'],
  ['sparkle emoji used as decoration', 'line 31'],
  ['yellow used as text on paper', 'line 40'],
];
const PASSES = ['colours: all in the palette', 'fonts: brand fonts only', 'words: nothing from the never list', 'no decoration emoji', 'yellow only as a highlight'];

type S = { cmd: string; ran: boolean; fails: number; sum: boolean; fixing: boolean; fixed: boolean; cmd2: string; passes: number; ok: boolean };
const W = 1776;
const H = 668;

const BASE: S = { cmd: '', ran: false, fails: 0, sum: false, fixing: false, fixed: false, cmd2: '', passes: 0, ok: false };
const RAN: S = { ...BASE, cmd: CMD, ran: true, fails: FAILS.length, sum: true };
const END: S[] = [BASE, RAN, { ...RAN, fixing: true, fixed: true, cmd2: CMD, passes: PASSES.length, ok: true }];
export const BEAT_COUNT = END.length;

const BEATS: (Script<S> | undefined)[] = [
  undefined,
  async (a) => {
    await a.wait(400);
    await a.type('cmd', CMD, { interval: 30 });
    await a.wait(350);
    await a.set({ ran: true });
    await a.wait(650);
    for (let i = 1; i <= FAILS.length; i++) {
      await a.set({ fails: i });
      await a.wait(560);
    }
    await a.set({ sum: true });
  },
  async (a) => {
    await a.wait(400);
    await a.set({ fixing: true });
    await a.wait(1500);
    await a.set({ fixed: true });
    await a.wait(1000);
    await a.type('cmd2', CMD, { interval: 24 });
    await a.wait(300);
    for (let i = 1; i <= PASSES.length; i++) {
      await a.set({ passes: i });
      await a.wait(240);
    }
    await a.wait(150);
    await a.set({ ok: true });
  },
];

/** A numbered pin on the first-draft tile, matching the line in the log. */
const Pin = ({ n, s }: { n: number; s: S }) => (
  <i className="ck-pin" data-on={s.fails >= n || undefined}>
    {n}
  </i>
);

const Prompt = ({ text, full, live }: { text: string; full: boolean; live: boolean }) => (
  <span className="ck-cmd">
    $ {text}
    {live && <i className="ck-caret" data-blink={!text || full || undefined} />}
  </span>
);

const Scene = ({ s }: { s: S }) => (
  <div className="ck-scene">
    <span className="dk-k ck-lab">
      linkedin-tile.html ·{' '}
      <States value={s.fixed ? 'fixed' : 'draft'} align="start" states={{ draft: 'first draft', fixed: 'fixed' }} />
    </span>
    <div className="b4-chk-tile ck-tiles">
      <div className="tile bad" data-on={!s.fixed || undefined} data-marks={s.fails || undefined}>
        <Pin n={1} s={s} />
        <b className="ck-font">
          <Pin n={2} s={s} />
          <span className="ck-m" data-on={s.fails >= 3 || undefined}>
            Supercharge
            <Pin n={3} s={s} />
          </span>{' '}
          your business with AI{' '}
          <span className="ck-m" data-on={s.fails >= 4 || undefined}>
            ✨<Pin n={4} s={s} />
          </span>
        </b>
        <span>Unlock the power of artificial intelligence</span>
        <span className="yl ck-m" data-on={s.fails >= 5 || undefined}>
          Limited seats!
          <Pin n={5} s={s} />
        </span>
      </div>
      <div className="tile good" data-on={s.fixed || undefined}>
        <div className="mk">
          <Mark size="3.4cqw" />
          <span>Fieldwork</span>
        </div>
        <b>
          One day. Both apps. <span className="hl">Your business.</span>
        </b>
        <span className="meta">Perth · December · 12 seats</span>
      </div>
    </div>
    <span className="dk-k ck-lab ck-lab2">Terminal</span>
    <div className="ck-term">
      <div className="ck-lines">
        <Prompt text={s.cmd} full={s.cmd === CMD} live={!s.ran} />
        <Collapse open={s.ran} reveal="clip">
          <span className="ck-dim">Checking 1 file against brand.md</span>
        </Collapse>
        {FAILS.map(([t, l], i) => (
          <Collapse key={t} open={i < s.fails} reveal="clip">
            <span className="ck-bad">
              ✕ <b className="ck-n">{i + 1}</b> {t} <em>{l}</em>
            </span>
          </Collapse>
        ))}
        <Collapse open={s.sum} reveal="clip">
          <span className="ck-sum">5 problems. Not sent.</span>
        </Collapse>
        <Collapse open={s.fixing} reveal="clip">
          <span className="ck-fix">
            <Check on={s.fixed} pending size={17} />
            {s.fixed ? 'Agent fixed the five in linkedin-tile.html' : 'Agent is fixing the five'}
          </span>
        </Collapse>
        <Collapse open={s.fixed} reveal="clip">
          <Prompt text={s.cmd2} full={s.cmd2 === CMD} live={s.passes === 0} />
        </Collapse>
        {PASSES.map((t, i) => (
          <Collapse key={t} open={i < s.passes} reveal="clip">
            <span className="ck-pass">✓ {t}</span>
          </Collapse>
        ))}
        <Collapse open={s.ok} reveal="clip">
          <span className="ck-ok">0 problems. Ready for a human to look at.</span>
        </Collapse>
      </div>
    </div>
  </div>
);

export const CheckRun = ({ beat, take, live }: { beat: number; take: number; live: boolean }) => (
  <div className="ck">
    <Staged<S> beat={beat} take={take} live={live} base={BASE} ends={END} beats={BEATS} width={W} height={H}>
      {(s) => <Scene s={s} />}
    </Staged>
  </div>
);
