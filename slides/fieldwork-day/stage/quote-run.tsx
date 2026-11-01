/*
 * The conduit-quote run from Block 5 ("Watch it work"), staged with the Stageshow kit
 * (vendor/, MIT, Benji Taylor). Trial version, shown next to the original page.
 *
 * One Stage per half. The page passes the beat (0 to 5) from the clicker. Each beat
 * remounts the stage at the previous beat's end state and plays that beat once, so a
 * click always lands on a known picture and going back never replays a mess.
 * Off the live page (thumbnails, presenter preview) the stage is a still of the beat's end.
 *
 * Imports go to single kit files, never kit/index.ts: the index pulls in Icon
 * (lucide-react, not a deck dependency) and the brand marks (not MIT).
 * Sizes inside the stage are design pixels: the stage scales them up to fit the half,
 * so cqw would scale twice.
 */
import { useState } from 'react';
import type { Script } from './vendor/kit/act';
import type { Rect } from './vendor/kit/measure';
import { Camera } from './vendor/kit/motion/Camera';
import { Collapse } from './vendor/kit/motion/Collapse';
import { States } from './vendor/kit/motion/States';
import { Stream } from './vendor/kit/motion/Stream';
import { Check } from './vendor/kit/parts/Check';
import { Stage } from './vendor/kit/stage';
import { Window } from './vendor/kit/window';
import './quote-run.css';

type Pane = 'goal' | 'plan' | 'inbox' | 'portal' | 'compare' | 'draft';
type S = {
  pane: Pane;
  goal: string;
  sent: boolean;
  /** log rows shown, and how many of them are ticked */
  log: number;
  done: number;
  plan: number;
  read: number;
  focus: Rect | null;
  dl: 'idle' | 'busy' | 'done';
  rows: number;
  win: boolean;
  words: number;
};

const W = 420;
const H = 284;

const GOAL =
  'Compare the three conduit quotes in my inbox for 40 m of 50 mm conduit. Best = cheapest that arrives by Friday. Draft a reply to the winner.';
const PLAN = ['Find the three quotes in email', 'Get any missing price from the supplier site', 'Compare against “by Friday”, then draft a reply'];
const MAIL = [
  { from: 'Westside Electrical', subj: 'Quote Q-1182', tag: 'PDF' },
  { from: 'Coastal Wholesale', subj: 'Your quote', tag: 'PDF' },
  { from: 'Northline Supplies', subj: 'Price on our trade portal', tag: 'Link' },
];
const ROWS = [
  { s: 'Westside', m: '$8.40', t: '$336.00', f: 'Yes', bad: false },
  { s: 'Coastal', m: '$7.95', t: '$318.00', f: 'No · 5 days', bad: true },
  { s: 'Northline', m: '$8.10', t: '$324.00', f: 'Yes · 1 day', bad: false },
];
const DRAFT =
  "Hi team, we'd like to go ahead with Q-77, 40 m of 50 mm conduit, delivered by Friday. Please confirm and send the invoice.";
const WORDS = DRAFT.split(' ').length;

const BASE: S = { pane: 'goal', goal: '', sent: false, log: 0, done: 0, plan: 0, read: 0, focus: null, dl: 'idle', rows: 0, win: false, words: 0 };
/** Where each beat ends. Beat n starts from END[n - 1]. */
const END: S[] = [];
END[0] = { ...BASE, goal: GOAL, sent: true, log: 1 };
END[1] = { ...END[0], done: 1, log: 2, pane: 'plan', plan: 3 };
END[2] = { ...END[1], done: 2, log: 3, pane: 'inbox', read: 3 };
END[3] = { ...END[2], done: 3, log: 4, pane: 'portal', dl: 'done' };
END[4] = { ...END[3], done: 4, log: 5, pane: 'compare', rows: 3, win: true };
END[5] = { ...END[4], done: 5, log: 6, pane: 'draft', words: WORDS };
export const BEAT_COUNT = END.length;

/** Tick the last log row, then open the next one and switch the screen. */
const next = async (a: Parameters<Script<S>>[0], beat: number, pane: Pane) => {
  await a.wait(250);
  await a.set({ done: beat });
  await a.wait(220);
  await a.set({ log: beat + 1, pane });
};

const BEATS: Script<S>[] = [
  async (a) => {
    await a.wait(500);
    await a.type('goal', GOAL, { interval: 14 });
    await a.wait(350);
    await a.set({ sent: true });
    await a.wait(300);
    await a.set({ log: 1 });
  },
  async (a) => {
    await next(a, 1, 'plan');
    await a.wait(450);
    for (let i = 1; i <= PLAN.length; i++) {
      await a.set({ plan: i });
      await a.wait(380);
    }
  },
  async (a) => {
    await next(a, 2, 'inbox');
    await a.wait(600);
    for (let i = 1; i <= MAIL.length; i++) {
      await a.set({ read: i });
      await a.wait(430);
    }
  },
  async (a) => {
    await next(a, 3, 'portal');
    await a.wait(700);
    await a.set({ focus: a.rect('portal', { layout: true }) });
    await a.wait(1150);
    await a.enter('download');
    await a.wait(120);
    await a.click();
    await a.set({ dl: 'busy' });
    await a.wait(900);
    await a.set({ dl: 'done' });
    await a.wait(900);
    void a.move({ x: 250, y: H - 34 }, { duration: 700 });
    await a.set({ focus: null });
  },
  async (a) => {
    await next(a, 4, 'compare');
    await a.wait(500);
    for (let i = 1; i <= ROWS.length; i++) {
      await a.set({ rows: i });
      await a.wait(320);
    }
    await a.wait(350);
    await a.set({ win: true });
  },
  async (a) => {
    await next(a, 5, 'draft');
    await a.wait(500);
    for (let i = 1; i <= WORDS; i++) {
      a.put({ words: i });
      await a.wait(70);
    }
  },
];

const Lab = ({ children }: { children: string }) => <div className="qr-lab">{children}</div>;

const Scene = ({ s, logs, agent, approved, approve }: { s: S; logs: string[]; agent: string; approved: boolean; approve: () => void }) => (
  <div className="qr-body">
    <div className="qr-log">
      <div className="qr-lh">{agent} is working</div>
      {logs.map((t, i) => (
        <Collapse key={t} open={i < s.log} reveal="drop">
          <div className="qr-li" data-now={(i === s.log - 1 && i >= s.done) || undefined}>
            <Check size={11} on={i < s.done} pending={i === s.log - 1 && i >= s.done} />
            <span>{t}</span>
          </div>
        </Collapse>
      ))}
    </div>
    <div className="qr-pane">
      <States
        value={s.pane}
        align="start"
        className="qr-panes"
        states={{
          goal: (
            <div className="qr-p">
              <Lab>Your goal</Lab>
              <div className="qr-goal" data-sent={s.sent || undefined}>
                <span className="qr-ghost" aria-hidden="true">
                  {GOAL}
                </span>
                <span className="qr-typed">
                  {s.goal}
                  {!s.sent && <i className="qr-caret" />}
                </span>
              </div>
              <div className="qr-sent" data-on={s.sent || undefined}>
                Sent to {agent}
              </div>
            </div>
          ),
          plan: (
            <div className="qr-p">
              <Lab>Plan</Lab>
              <div className="qr-plan">
                {PLAN.map((p, i) => (
                  <Collapse key={p} open={i < s.plan} reveal="drop">
                    <div className="qr-pl">
                      <b>{i + 1}</b>
                      <span>{p}</span>
                    </div>
                  </Collapse>
                ))}
              </div>
            </div>
          ),
          inbox: (
            <div className="qr-p">
              <Lab>Outlook · read through a connector</Lab>
              <div className="qr-mails">
                {MAIL.map((m, i) => (
                  <div key={m.from} className="qr-mail" data-read={i < s.read || undefined} data-flag={(i === 2 && s.read > 2) || undefined}>
                    <Check size={11} on={i < s.read} />
                    <span className="qr-mt">
                      <b>{m.from}</b>
                      <span>{m.subj}</span>
                    </span>
                    <span className="qr-tag">{m.tag}</span>
                  </div>
                ))}
              </div>
              <div className="qr-foot" data-on={s.read > 2 || undefined}>
                No connector for Northline’s portal
              </div>
            </div>
          ),
          portal: (
            <div className="qr-p">
              <Lab>No connector · it uses the screen</Lab>
              <Window chrome="hairline" url="trade.northline.example/quotes" className="qr-browser" data-target="portal">
                <div className="qr-q">
                  <span>
                    <b>Q-77</b> · 50 mm conduit · 40 m
                  </span>
                  <span className="qr-dl" data-target="download" data-cursor="pointer" data-state={s.dl}>
                    <States value={s.dl} states={{ idle: 'Download quote', busy: 'Downloading…', done: 'Downloaded ✓' }} />
                  </span>
                </div>
                <div className="qr-q qr-dim">
                  <span>
                    <b>Q-61</b> · cable tray · 12 m
                  </span>
                  <span className="qr-dl">Download quote</span>
                </div>
              </Window>
            </div>
          ),
          compare: (
            <div className="qr-p">
              <Lab>Comparison · best = cheapest by Friday</Lab>
              <div className="qr-tbl">
                <div className="qr-tr qr-th">
                  <span>Supplier</span>
                  <span>Per m</span>
                  <span>Total</span>
                  <span>By Friday?</span>
                </div>
                {ROWS.map((r, i) => (
                  <Collapse key={r.s} open={i < s.rows}>
                    <div className="qr-tr" data-win={(i === 2 && s.win) || undefined}>
                      <span>{r.s}</span>
                      <span>{r.m}</span>
                      <span>{r.t}</span>
                      <span data-bad={r.bad || undefined}>{r.f}</span>
                    </div>
                  </Collapse>
                ))}
              </div>
              <div className="qr-foot" data-on={s.win || undefined}>
                Cheapest can’t make Friday, so Northline wins
              </div>
            </div>
          ),
          draft: (
            <div className="qr-p">
              <Lab>Draft · not sent</Lab>
              <div className="qr-draft">
                <div className="qr-to">To: Northline Supplies</div>
                <Stream text={DRAFT} count={s.words} className="qr-dtext" />
                <div className="qr-acts">
                  <button className="qr-go" type="button" disabled={approved} onClick={approve}>
                    {approved ? 'Approved · demo, nothing sent' : 'Approve and send'}
                  </button>
                  <span className="qr-btn">Edit</span>
                </div>
              </div>
            </div>
          ),
        }}
      />
    </div>
  </div>
);

export const QuoteRun = ({ side, beat, live, logs, agent, title }: { side: 'L' | 'R'; beat: number; live: boolean; logs: string[]; agent: string; title: string }) => {
  const b = Math.max(0, Math.min(BEAT_COUNT - 1, beat));
  const [approved, setApproved] = useState(false);
  const initial = b === 0 ? BASE : END[b - 1];
  return (
    <div className="qr" data-side={side}>
      <Stage<S>
        key={`${b}-${live}`}
        width={W}
        height={H}
        fill
        unframed
        play="once"
        initial={live ? initial : END[b]}
        poster={END[b]}
        script={live ? BEATS[b] : undefined}
        cursor={live && b === 3 ? { at: { x: W + 40, y: H - 20 }, style: 'real', ripple: true, idle: 1600 } : undefined}
      >
        {(s) => (
          <div className="qr-frame">
            <Camera focus={s.focus} max={1.9} pad={18} feather={10}>
              <Window title={title} className="qr-win" lights="grey">
                <Scene s={s} logs={logs} agent={agent} approved={approved && s.pane === 'draft'} approve={() => setApproved(true)} />
              </Window>
            </Camera>
          </div>
        )}
      </Stage>
    </div>
  );
};
