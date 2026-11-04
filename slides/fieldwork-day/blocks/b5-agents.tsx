/* Block 5 · 13:00 · Agents and computer use (headline block). */
import type { Page } from '@open-slide/core';
import { useIsActivePage } from '@open-slide/core';
import { useCallback, useEffect, useState } from 'react';
import { Chip, Eyebrow, Frame, Hl, Pad, SideLabel, Split, Title } from '@assets/fieldwork/brand';
import { Head, PageNo, Src, eb, lab, live, opener, usePlay } from '../kit';
import { PX, SortBoard, type SortState, type Zone, cqw, stateFrom, zoneOf } from '../drag/sort-board';
import { BeatSteps } from '../stage/beats';
import { BEAT_COUNT, QuoteRun } from '../stage/quote-run';

const Open = opener(
  'agents',
  'An agent takes a goal, makes a plan, works through steps you can watch, and stops to ask before anything that matters. Computer use lets it work in apps that have no connector.',
);

/* ---------- from answers to actions ---------- */
const CHAT = ['You ask', 'It answers', 'You copy, paste and do the work'];
const AGENT = ['You give a goal', 'It plans', 'Step', 'Step', 'Step', 'It checks in', 'You review'];
const AnswersToActions: Page = () => {
  const active = useIsActivePage();
  const [k, setK] = useState(active ? -1 : AGENT.length);
  useEffect(() => {
    if (!active || k >= AGENT.length) return;
    const t = setTimeout(() => setK((x) => x + 1), k < 0 ? 500 : 520);
    return () => clearTimeout(t);
  }, [active, k]);
  return (
    <Frame label="From answers to actions">
      <Head
        eb={eb('agents', 'Agents · the shift')}
        title="From answers to actions"
        sum="This morning you asked and it answered. This afternoon you hand over a goal, and it does the steps. Your job moves from typing to checking."
      />
      <PageNo />
      <div className="b5-rows">
        <div className="row">
          <div className="lbl">
            <span className="dk-k">L1–L2</span>
            <b>Chat</b>
          </div>
          <div className="seq">
            {CHAT.map((c, i) => (
              <span key={i} className={i === 2 ? 'you' : ''}>
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="lbl">
            <span className="dk-k">L3–L4</span>
            <b>Agent</b>
          </div>
          <div className="seq agent">
            {AGENT.map((c, i) => (
              <span key={i} className={`${i <= k ? 'lit' : ''} ${i === 0 || i === AGENT.length - 1 ? 'you' : ''} ${i === 5 ? 'ask' : ''}`}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="b5-shift">
        The agent does the middle. <Hl>You own the two ends:</Hl> a clear goal at the start, a real check at the finish.
      </p>
    </Frame>
  );
};

/* ---------------- 3 · watch it work ---------------- */
const STEPS = [
  { c: 'Goal', log: 'Goal received', note: 'You give it a goal in plain words, including what “best” means to you.', hand: "say what 'best' means", tag: 'Step 1 · the brief' },
  { c: 'Plan', log: 'Plan: 3 steps', note: 'It writes a plan first. Read it: this is the cheapest moment to correct it.', hand: 'read the plan!', tag: 'Step 2 · plan' },
  { c: 'Email', log: 'Read 3 emails in Outlook', note: 'It reads your email through a connector. One supplier only gives prices on its website.', hand: 'connector = plugged in', tag: 'Step 3 · connector' },
  { c: 'Portal', log: 'Opened Northline trade portal', note: 'That website has no connector, so the agent uses the screen like you would: clicking and downloading. This is computer use.', hand: 'no connector → it clicks', tag: 'Step 4 · computer use' },
  { c: 'Compare', log: 'Built the comparison', note: "It checks each quote against your rule. The cheapest supplier can't deliver by Friday, so it picks Northline.", hand: 'cheapest ≠ best', tag: 'Step 5 · judgment' },
  { c: 'Draft', log: 'Drafted reply · waiting for you', note: 'It drafts the reply and stops. Nothing is sent until you approve it.', hand: 'it waits for you ✓', tag: 'Step 6 · your call' },
];

// Built with the Stageshow kit (stage/quote-run.tsx). Each clicker press plays one step in
// both windows; going back shows the step before, finished.
const StagedSide = ({ side, beat, live }: { side: 'L' | 'R'; beat: number; live: boolean }) => {
  const isL = side === 'L';
  return (
    <>
      <SideLabel
        name={isL ? 'OpenAI · Codex' : 'Claude'}
        sub={isL ? 'Codex, in ChatGPT desktop' : 'Cowork, in Claude desktop'}
      />
      <div className="b5-stage">
        <QuoteRun
          side={side}
          beat={beat}
          live={live}
          logs={STEPS.map((s) => s.log)}
          agent={isL ? 'Codex' : 'Claude'}
          title={isL ? 'ChatGPT · Codex' : 'Claude · Cowork'}
        />
        {isL ? (
          <span className="tagnote" style={{ right: '1.2cqw', top: '.75cqw' }}>
            {STEPS[beat].tag}
          </span>
        ) : (
          <span className="handnote" style={{ right: '1.4cqw', bottom: '1.4cqw' }}>
            {STEPS[beat].hand}
          </span>
        )}
      </div>
    </>
  );
};

export const WatchItWork: Page = () => {
  const active = useIsActivePage();
  const [beat, setBeat] = useState(0);
  const onBeat = useCallback((b: number) => setBeat(Math.min(b, BEAT_COUNT - 1)), []);
  return (
    <Frame label="Watch it work">
      <PageNo />
      <BeatSteps count={BEAT_COUNT - 1} onBeat={onBeat} />
      <Pad style={{ paddingBottom: 0 }}>
        <Eyebrow>{eb('agents', 'Agents · watch it work')}</Eyebrow>
        <Title>Watch it work</Title>
        <div className="steps" style={{ marginTop: '1cqw' }}>
          {STEPS.map((s, i) => (
            <Chip key={s.c} n={i + 1} label={s.c} state={i === beat ? 'on' : i < beat ? 'past' : ''} onClick={() => {}} />
          ))}
        </div>
        <p className="stepnote" style={{ margin: '.8cqw 0 0' }}>
          {STEPS[beat].note}
        </p>
      </Pad>
      <Split
        top="17.6cqw"
        left={<StagedSide side="L" beat={beat} live={active} />}
        right={<StagedSide side="R" beat={beat} live={active} />}
      />
    </Frame>
  );
};

/* ---------- connector or screen ---------- */
const ConnectorOrScreen: Page = () => (
  <Frame label="Connector or screen">
    <Head
      eb={eb('agents', 'Agents · computer use')}
      title="No connector? It uses the screen like you would"
      sum="Supplier portals, government sites, the old desktop program in the back office. If an app has no connector, the agent can look at the screen, click and type. That is computer use."
    />
    <PageNo />
    <div className="b5-lanes">
      <div className="q">
        <span className="dk-k">The question</span>
        <b>Does the app have a connector?</b>
      </div>
      <div className="lane">
        <span className="dk-k">Yes</span>
        <b>It talks to the app directly</b>
        <span>Fast, reliable, and you control the permissions. Outlook, Gmail, Google Drive, OneDrive.</span>
        <svg viewBox="0 0 120 40" aria-hidden="true">
          <path d="M4 20 H50 M70 20 H116" stroke="var(--ink)" strokeWidth="3" />
          <rect x="50" y="10" width="20" height="20" fill="var(--white)" stroke="var(--ink)" strokeWidth="3" />
        </svg>
      </div>
      <div className="lane scr">
        <span className="dk-k">No</span>
        <b>It looks, clicks and types</b>
        <span>Slower, and it can misclick. But it works on almost anything with a screen. Watch it the first few times.</span>
        <svg viewBox="0 0 120 40" aria-hidden="true">
          <rect x="4" y="4" width="70" height="32" fill="var(--white)" stroke="var(--ink)" strokeWidth="3" />
          <path className="b5-cur" d="M84 8 L84 34 L91 27 L96 37 L100 35 L95 25 L104 25 Z" fill="var(--ink)" />
        </svg>
      </div>
    </div>
    <div className="b5-where">
      <div>
        <span className="dk-k">ChatGPT</span>
        <span>Codex, with computer use switched on</span>
      </div>
      <div>
        <span className="dk-k">Claude</span>
        <span>Cowork, with computer use switched on</span>
      </div>
      <div>
        <span className="dk-k">Both</span>
        <span>Ask before it signs in anywhere, pays, or submits a form</span>
      </div>
    </div>
  </Frame>
);

const Live = live({
  block: 'agents',
  title: 'Three supplier quotes, one of them stuck on a website',
  minutes: 8,
  backup: () => WatchItWork,
  apps: [
    {
      who: 'openai',
      app: 'ChatGPT desktop',
      mode: 'Codex · computer use',
      steps: [
        'Paste the goal from the next page. Read the plan out loud before it starts.',
        'Watch it open the supplier site and find the price. Narrate each click.',
        'Stop at the draft. Do not send.',
      ],
    },
    {
      who: 'claude',
      app: 'Claude desktop',
      mode: 'Cowork · computer use',
      steps: [
        'Same goal, same inbox.',
        'Compare the two tables. Same winner? Same reasons?',
        'Ask the room: which steps would you let it do alone next time?',
      ],
    },
  ],
});

/* ---------- write a goal it can finish ---------- */
const PARTS: { t: string; k?: string }[] = [
  { t: 'Compare the three conduit quotes in my inbox for the Baldivis job', k: 'The job' },
  { t: ' (40 m of 50 mm conduit). ' },
  { t: 'Northline only shows prices on their trade portal; get theirs there.', k: 'Where things are' },
  { t: ' ' },
  { t: 'Best = cheapest that can deliver by Friday.', k: 'What good means' },
  { t: ' ' },
  { t: 'Put the comparison in a table and draft a reply to the winner.', k: 'What you want back' },
  { t: ' ' },
  { t: 'Stop before sending anything.', k: 'Where to stop' },
];
const GoodGoal: Page = () => {
  const [good, setGood] = useState(true);
  const on = usePlay(120);
  return (
    <Frame label="Write a goal it can finish">
      <Head
        eb={eb('agents', 'Agents · the brief')}
        title="Write a goal it can finish"
        sum="Agents fail on vague goals, not hard ones. Five parts, in plain words. It takes thirty seconds and saves twenty minutes."
      />
      <PageNo />
      <div className="b5-goal-tog">
        <Chip n={1} label="How most people ask" state={!good ? 'on' : ''} onClick={() => setGood(false)} />
        <Chip n={2} label="A goal it can finish" state={good ? 'on' : ''} onClick={() => setGood(true)} />
      </div>
      <div className={`b5-goal ${on ? '' : 'pre'}`}>
        {good ? (
          <p>
            {PARTS.map((p, i) =>
              p.k ? (
                <span key={i} className="part dk-fade" style={{ ['--i' as string]: i }}>
                  <span className="k-at">
                    <span className="k">{p.k}</span>
                  </span>
                  <span className="t">{p.t}</span>
                </span>
              ) : (
                <span key={i}>{p.t}</span>
              ),
            )}
          </p>
        ) : (
          <p className="vague">“Sort out the quotes for the Baldivis job.”</p>
        )}
      </div>
      <div className="b5-goal-check">
        {['The job', 'Where things are', 'What good means', 'What you want back', 'Where to stop'].map((k) => (
          <span key={k} className={good ? 'y' : ''}>
            {good ? '✓' : '○'} {k}
          </span>
        ))}
      </div>
    </Frame>
  );
};

/* ---------- choose by stakes ---------- */
type Q = 'run' | 'check' | 'approve' | 'human';
const QUAD: Record<Q, { t: string; d: string; x: number; y: number }> = {
  run: { t: 'Let it run', d: 'Low stakes, easy to undo', x: 0, y: 1 },
  check: { t: 'Check the result', d: 'Matters, but you can fix it', x: 1, y: 1 },
  approve: { t: 'Approve before it acts', d: 'Small, but can’t be undone', x: 0, y: 0 },
  human: { t: 'Keep it human', d: 'Matters, and can’t be undone', x: 1, y: 0 },
};
const TASKS: { t: string; q: Q }[] = [
  { t: 'Rename and file 200 receipts (on a copy)', q: 'run' },
  { t: 'Tidy the shared drive into folders', q: 'run' },
  { t: 'Compare three supplier quotes', q: 'check' },
  { t: 'Update the price list on the website', q: 'check' },
  { t: 'Send the overdue invoice reminders', q: 'approve' },
  { t: 'Book the site inspection', q: 'approve' },
  { t: 'Pay a supplier', q: 'human' },
  { t: 'Tell a client the job is delayed', q: 'human' },
];
const STAKE_CARDS = TASKS.map((_, i) => `job-${i}`);
const STAKE_ZONES = ['tray', ...(Object.keys(QUAD) as Q[])];
// Board geometry in canvas px, matching .b5-mx and .b5-tray in deck.css (1cqw = 19.2px).
const SB = { x: 3.6 * PX, y: 15.4 * PX, w: 92.8 * PX, h: (56.25 - 15.4 - 3) * PX };
const MX = { left: (33 - 3.6) * PX, ax: 2.4 * PX, gap: 0.8 * PX, foot: 2.2 * PX };
const QW = (SB.w - MX.left - MX.ax - 2 * MX.gap) / 2;
const QH = (SB.h - MX.foot - 2 * MX.gap) / 2;
const stakeZones: Zone[] = [
  { id: 'tray', x: 0, y: 0, w: 26 * PX, top: 2 * PX, cardH: 2.5 * PX, gap: 0.5 * PX, h: SB.h },
  ...(Object.keys(QUAD) as Q[]).map((q) => ({
    id: q,
    x: MX.left + MX.ax + MX.gap + QUAD[q].x * (QW + MX.gap),
    y: (1 - QUAD[q].y) * (QH + MX.gap),
    w: QW,
    h: QH,
    top: 5.2 * PX,
    pad: 1.1 * PX,
    cardH: 2.3 * PX,
    gap: 0.45 * PX,
  })),
];
const stakesAll = (where: (i: number) => string) => stateFrom(STAKE_ZONES, STAKE_CARDS, (c) => where(Number(c.slice(4))));
const STAKES_ANSWER = stakesAll((i) => TASKS[i].q);
const STAKES_EMPTY = stakesAll(() => 'tray');

const Stakes: Page = () => {
  const active = useIsActivePage();
  // Off the live page (thumbnails, presenter preview) the board shows the finished placement.
  const [state, setState] = useState<SortState>(active ? STAKES_EMPTY : STAKES_ANSWER);
  // The room's placement at the moment the answers were shown; null until then.
  const [room, setRoom] = useState<SortState | null>(active ? null : STAKES_ANSWER);
  const placed = STAKE_CARDS.filter((c) => zoneOf(state, c) !== 'tray').length;
  const right = room ? STAKE_CARDS.filter((c, i) => zoneOf(room, c) === TASKS[i].q).length : 0;
  const render = useCallback(
    (c: string) => {
      const i = Number(c.slice(4));
      const was = room ? zoneOf(room, c) : undefined;
      const ok = was === TASKS[i].q;
      return (
        <>
          <span>{TASKS[i].t}</span>
          {room && <span className={`st ${ok ? 'ok' : 'bad'}`}>{ok ? '✓' : was === 'tray' ? 'not placed' : `was: ${QUAD[was as Q].t}`}</span>}
        </>
      );
    },
    [room],
  );
  return (
    <Frame label="Choose by stakes">
      <Head
        eb={eb('agents', 'Agents · how much to watch')}
        title="How much to watch: choose by stakes"
        sum="Autopilot is not all or nothing. Ask two questions: how bad if it's wrong, and can I undo it? Drag each job to where the room puts it, then show the answers."
      />
      <PageNo />
      <div className="b5-mx">
        <div className="ax y">
          <span>Easy to undo</span>
          <span>Hard to undo</span>
        </div>
        <div className="ax x">
          <span>Small if wrong</span>
          <span>Big if wrong</span>
        </div>
        {(Object.keys(QUAD) as Q[]).map((q) => (
          <div key={q} className={`quad q-${q}`} style={{ gridColumn: QUAD[q].x + 2, gridRow: 2 - QUAD[q].y }}>
            <b>{QUAD[q].t}</b>
            <span>{QUAD[q].d}</span>
          </div>
        ))}
      </div>
      <div className="b5-tray">
        <span className="dk-k">Jobs {placed ? `· ${placed} of ${TASKS.length} placed` : ''}</span>
        <div className="pbtns" style={{ marginTop: `${(stakeZones[0].top ?? 0) / PX + TASKS.length * 3 + 0.6}cqw` }}>
          <button
            className="rb primary"
            type="button"
            onClick={() => {
              setRoom(state);
              setState(STAKES_ANSWER);
            }}
          >
            Show the answers
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              setRoom(null);
              setState(STAKES_EMPTY);
            }}
          >
            Reset
          </button>
        </div>
        {room && active && (
          <span className="dk-k" style={{ color: 'var(--ink)' }}>
            The room matched {right} of {TASKS.length}
          </span>
        )}
      </div>
      <div style={{ position: 'absolute', left: cqw(SB.x), top: cqw(SB.y) }}>
        <SortBoard id="stakes" width={SB.w} height={SB.h} zones={stakeZones} cards={STAKE_CARDS} state={state} onChange={setState} locked={!!room} render={render} />
      </div>
    </Frame>
  );
};

/* ---------- the decision trail ---------- */
const TRAIL: { d: string; s: string; who: string; t: string; gap?: boolean }[] = [
  { d: '12 Aug', s: 'Email', who: 'Electrical engineer', t: '“40 mm won’t take the extra circuits for the second shed.”' },
  { d: '14 Aug', s: 'Teams', who: 'Site lead', t: '“Agreed, go to 50 mm. Someone check the cost.”' },
  { d: '?', s: 'Nothing found', who: '', t: 'No record of who approved the extra cost. Ask the site lead.', gap: true },
  { d: '2 Sep', s: 'Email', who: 'Northline Supplies', t: 'Revised quote Q-77 for 50 mm conduit.' },
  { d: '3 Sep', s: 'Meeting notes', who: 'Weekly site meeting', t: 'Variation V-07 raised for the conduit change.' },
];
const DecisionTrail: Page = () => {
  const on = usePlay(100);
  return (
    <Frame label="Why did we decide that?">
      <Head
        eb={eb('agents', 'Agents · a second use')}
        title="“Why did we decide that?”"
        sum="Disputes, variations, “who approved this?”. An agent can search email, chat and notes and rebuild the trail. The good ones show you the gap instead of filling it."
      />
      <PageNo />
      <div className={`b5-trail ${on ? '' : 'pre'}`}>
        {TRAIL.map((r, i) => (
          <div key={i} className={`dk-fade ${r.gap ? 'gap' : ''}`} style={{ ['--i' as string]: i * 2 }}>
            <span className="d">{r.d}</span>
            <span className="s">{r.s}</span>
            <span className="w">{r.who}</span>
            <span className="t">{r.t}</span>
          </div>
        ))}
      </div>
      <div className="b5-trail-side">
        <span className="dk-k">The lesson</span>
        <p>
          It refused to invent the missing approval. <Hl>Keep the gaps visible.</Hl> An answer that admits what it couldn't find is
          worth more than a tidy one that doesn't.
        </p>
      </div>
      <Src>A made-up job. The pattern turns up in any business that agrees changes by email and phone.</Src>
    </Frame>
  );
};

const Lab4 = lab({
  id: 'lab4',
  n: 4,
  block: 'agents',
  minutes: 25,
  title: 'An admin job, done by an agent',
  goal: 'Hand an agent one real multi-step job from your list: reconcile two lists, triage an inbox folder, compile quotes, fill a form from a document.',
  done: 'It finished or stopped where you told it to, and you checked one result against the source before approving.',
  keep: 'The goal you wrote. Next time, try the same job with less watching.',
  openai: [
    <>
      ChatGPT desktop → <b>Work</b> for connected apps, or <b>Codex</b> for files on your computer.
    </>,
    'Write the goal with all five parts: the job, where things are, what good means, what you want back, where to stop.',
    'Read the plan before it starts. Correct it there; that is the cheapest moment.',
    'When it stops, check one item against the source. Then approve, or tell it what to fix.',
  ],
  claude: [
    <>
      Claude desktop → <b>Cowork</b>. Pick the folder or connected app it may use.
    </>,
    'Write the goal with all five parts: the job, where things are, what good means, what you want back, where to stop.',
    'Read the plan before it starts. Correct it there; that is the cheapest moment.',
    'When it stops, check one item against the source. Then approve, or tell it what to fix.',
  ],
  hand: 'stop it if it wanders',
});

export const pages: [Page, string][] = [
  [Open, '13:00 · Block 5 opener, the headline block. Sixty minutes, ending in a 25-minute lab.'],
  [
    AnswersToActions,
    '3 min. Let the agent row light up. The line to land: the agent does the middle, you own the two ends.',
  ],
  [
    WatchItWork,
    '6 min. Each click plays one step in both windows, Codex on the left and Claude on the right, same job. Step 3: no cursor, it reads email through the connector. Step 4: the window zooms in and the cursor clicks Download on the portal; this is computer use, so pause here. Step 6: it stops at the draft. Click Approve to show nothing is sent. Back shows the step before, finished.',
  ],
  [
    ConnectorOrScreen,
    '3 min. Connector first, screen second. Be honest that computer use is slower and can misclick. Set the rule: it asks before it signs in, pays or submits.',
  ],
  [
    Live,
    '8 min. Use a demo inbox with the three quote emails, and a test supplier page you control (not a real supplier). Keep the backup recording ready; the page before last runs the same thing in the deck. Never let it press Send.',
  ],
  [
    GoodGoal,
    '4 min. Click 1 then 2. Read the good goal out loud; the labels show the five parts. This page is the template for the lab.',
  ],
  [
    Stakes,
    '4 min. Read a job, ask the room where it goes, then drag it there. "Show the answers" if time is short: the jobs slide to their corners and each one shows a tick or where it should have gone. The bottom-right corner never gets automated.',
  ],
  [
    DecisionTrail,
    '3 min. The row with the question mark is the point: a good agent shows you what it could not find. Same lesson as the flagged digit this morning.',
  ],
  [
    Lab4,
    '25 min. Start the timer. Walk the room and look at plans before they run. Common snag: the goal has no stopping point. Ask "where should it stop?" and have them add it.',
  ],
];
