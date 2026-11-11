/* Block 7 · 15:00 · Background agents (L6). */
import type { Page } from '@open-slide/core';
import { useIsActivePage } from '@open-slide/core';
import { useCallback, useEffect, useState } from 'react';
import { Frame, Hl, SideLabel, Split } from '@assets/fieldwork/brand';
import { PX, SortBoard, type SortState, type Zone, stateFrom, zoneOf } from '../drag/sort-board';
import { Head, PageNo, Src, eb, lab, live, opener, usePlay } from '../kit';
import { useSaved } from '../persist';

const Open = opener(
  'background',
  'Jobs that run on a schedule while you get on with the day. You write the rules once: what it may do alone, what it must ask about, and what it never touches.',
);

/* ---------- a week with three jobs running ---------- */
type Kind = 'brief' | 'todo' | 'enq' | 'review';
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const RUNS: { d: number; h: number; k: Kind }[] = [
  { d: 0, h: 6.5, k: 'brief' },
  ...DAYS.flatMap((_, d) => [
    { d, h: 7.5, k: 'todo' as Kind },
    { d, h: 12, k: 'enq' as Kind },
  ]),
  { d: 4, h: 15, k: 'review' },
];
const H0 = 6;
const H1 = 18;
const NAME: Record<Kind, string> = { brief: 'Monday brief', todo: 'To-do refresh', enq: 'Enquiry replies', review: 'Week in review' };
const OUT: Record<Kind, { title: string; lines: ['did' | 'ask', string][] }> = {
  brief: {
    title: 'Your week at Ridgeline',
    lines: [
      ['did', 'Three site visits: Tue boundary at Ashby Rd, Wed feature survey at Baldivis, Thu strata job in Mount Lawley.'],
      ['ask', 'Thursday reaches 34°. Start Baldivis at 6:00 instead? Say yes and I will move the booking.'],
      ['ask', 'Two quotes are waiting on you: the Coastal subdivision and Westside Electrical.'],
      ['did', 'INV-2207 is 18 days overdue ($2,450). Reminder drafted, not sent.'],
    ],
  },
  todo: {
    title: 'To-do list, refreshed',
    lines: [
      ['did', 'Ticked off two items you finished yesterday, going by your sent email.'],
      ['did', 'Added: call back the strata manager (missed call at 4:52 pm).'],
      ['ask', 'The Lot 14 plan is due tomorrow and has no time blocked. Block two hours this afternoon?'],
    ],
  },
  enq: {
    title: 'New enquiries, replies drafted',
    lines: [
      ['did', 'Three enquiries came in through the website form.'],
      ['did', 'Two replies drafted in your voice. They are in Drafts.'],
      ['ask', 'One asks for a drone survey, which is not on the price list. Your call.'],
    ],
  },
  review: {
    title: 'Your week in review',
    lines: [
      ['did', 'Five quotes sent, three won.'],
      ['did', '31 hours on site. Baldivis ran four hours over.'],
      ['ask', 'Three finished jobs are ready to invoice. Draft invoices are in the accounts, not sent.'],
    ],
  },
};
const fmt = (h: number) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;

const WorksWhileYouDont: Page = () => {
  const active = useIsActivePage();
  const [p, setP] = useState(active ? 0 : 1);
  const [sel, setSel] = useState(0);
  useEffect(() => {
    if (!active) return;
    setP(0);
    const t0 = performance.now();
    const id = setInterval(() => {
      const x = Math.min(1, (performance.now() - t0 - 500) / 6500);
      setP(Math.max(0, x));
      if (x >= 1) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [active]);
  const nowDay = Math.min(4, Math.floor(p * 5));
  const nowH = H0 + Math.min(1, p * 5 - nowDay) * (H1 - H0);
  const ran = (r: (typeof RUNS)[number]) => r.d < nowDay || (r.d === nowDay && r.h <= nowH) || p >= 1;
  const r = RUNS[sel];
  const o = OUT[r.k];
  return (
    <Frame label="It works while you don't">
      <Head
        eb={eb('background', 'Background · your week')}
        title="It works while you don’t"
        sum="Four small jobs on a schedule. Each one reads, sorts and drafts on its own, then leaves you a short list of decisions. Click any run to see what it left you."
      />
      <PageNo />
      <div className="b7-week">
        <div className="hours">
          {[6, 9, 12, 15, 18].map((h) => (
            <span key={h} style={{ top: `${((h - H0) / (H1 - H0)) * 100}%` }}>
              {h}:00
            </span>
          ))}
        </div>
        {DAYS.map((d, di) => (
          <div key={d} className={`day ${p < 1 && di === nowDay ? 'cur' : ''}`}>
            <span className="dk-k">{d}</span>
            <div className="cl">
              {RUNS.map((x, i) =>
                x.d === di ? (
                  <button
                    key={i}
                    type="button"
                    className={`rn k-${x.k} ${ran(x) ? 'ran' : ''} ${i === sel ? 'sel' : ''}`}
                    style={{ top: `${((x.h - H0) / (H1 - H0)) * 100}%` }}
                    onClick={() => setSel(i)}
                  >
                    <i>{fmt(x.h)}</i>
                    {NAME[x.k]}
                  </button>
                ) : null,
              )}
              {p < 1 && di === nowDay && <div className="nw" style={{ top: `${((nowH - H0) / (H1 - H0)) * 100}%` }} />}
            </div>
          </div>
        ))}
      </div>
      <div className="b7-out" key={sel}>
        <div className="hd">
          <span className="dk-k">
            {NAME[r.k]} · {DAYS[r.d]} {fmt(r.h)}
          </span>
          <span className="dk-k">{ran(r) ? 'Ran on its own' : 'Scheduled'}</span>
        </div>
        <b className="tt">{o.title}</b>
        <ul>
          {o.lines.map(([t, l], i) => (
            <li key={l} className={`dk-fade ${t}`} style={{ ['--i' as string]: i }}>
              <span className="tg">{t === 'did' ? 'Done' : 'Needs you'}</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
        <p className="ft">Read, sort, draft. Nothing sent, nothing booked, nothing paid without you.</p>
      </div>
      <Src right half>
        A real one: Mothership Coffee Roasters runs a Monday brief across six cafés from its tills, books, Slack and email
        (Anthropic, Sep 2026).
      </Src>
    </Frame>
  );
};

/* ---------- approval rules ---------- */
const RULES: { k: string; mark: string; sub: string; cls: string; items: string[] }[] = [
  {
    k: 'Can do alone',
    mark: '✓',
    sub: 'Reading and drafting',
    cls: 'alone',
    items: ['Read the inbox, calendar and job folder', 'Draft replies and leave them in Drafts', 'Update the to-do list', 'Check the weather and the traffic'],
  },
  {
    k: 'Must ask first',
    mark: '?',
    sub: 'Anything that reaches a person',
    cls: 'ask',
    items: ['Send any email to a client or supplier', 'Move or cancel a booking', 'Anything with a price in it', 'Create an invoice'],
  },
  {
    k: 'Never',
    mark: '✕',
    sub: 'Not even if an email asks',
    cls: 'never',
    items: ['Pay, refund or move money', 'Change bank details anywhere', 'Delete email or files', 'Agree to anything on your behalf'],
  },
];
const RULE_CARDS = RULES.flatMap((c, ci) => c.items.map((_, i) => `rule-${ci}-${i}`));
const RULE_ZONES = RULES.map((c) => c.cls);
const ruleText = (card: string) => {
  const [, ci, i] = card.split('-').map(Number);
  return RULES[ci].items[i];
};
const ruleHome = (card: string) => RULES[Number(card.split('-')[1])].cls;
// Board geometry in canvas px (1cqw = 19.2px), matching .b7-rules in deck.css: three cards, 1.6cqw apart.
const RB = { x: 3.6 * PX, y: 17.2 * PX, w: 92.8 * PX, h: 30 * PX };
const RW = (RB.w - 2 * 1.6 * PX) / 3;
const ruleZones: Zone[] = RULES.map((c, i) => ({ id: c.cls, x: i * (RW + 1.6 * PX), y: 0, w: RW, h: RB.h, top: 7.1 * PX, pad: 1.5 * PX, cardH: 2.9 * PX, gap: 0.3 * PX }));
const RULES_OURS = stateFrom(RULE_ZONES, RULE_CARDS, ruleHome);
// Mixed up: every item one list along, so nothing starts in the right place and each list keeps four.
const RULES_MIXED = stateFrom(RULE_ZONES, RULE_CARDS, (c) => RULE_ZONES[(Number(c.split('-')[1]) + 1) % RULE_ZONES.length]);

const ApprovalRules: Page = () => {
  const on = usePlay(120);
  const active = useIsActivePage();
  // Saved on this laptop while the page is live, so a reload mid-sort keeps the room's work.
  const [state, setState] = useSaved<SortState>('rules:state', RULES_OURS, active);
  // 'ours' is the page as a reference; 'mixed' is the room sorting; 'shown' compares the room's sort with ours.
  const [mode, setMode] = useSaved<'ours' | 'mixed' | 'shown'>('rules:mode', 'ours', active);
  const [room, setRoom] = useSaved<SortState | null>('rules:room', null, active);
  const right = room ? RULE_CARDS.filter((c) => zoneOf(room, c) === ruleHome(c)).length : 0;
  const render = useCallback(
    (c: string) => {
      const was = room ? zoneOf(room, c) : undefined;
      const ok = was === ruleHome(c);
      return (
        <>
          <span>{ruleText(c)}</span>
          {room && <span className={`st ${ok ? 'ok' : 'warn'}`}>{ok ? 'same' : `room: ${RULES.find((r) => r.cls === was)?.k}`}</span>}
        </>
      );
    },
    [room],
  );
  return (
    <Frame label="Write the rules first">
      <Head
        eb={eb('background', 'Background · the rules')}
        title="Write the rules before you switch it on"
        sum="An assistant that works while you are away needs rules it cannot talk itself out of. Three short lists, in plain words, saved with the job. Mix them up and let the room sort them."
      />
      <PageNo />
      <div className="b7-rules-btns pbtns">
        {mode === 'ours' ? (
          <button
            className="rb primary"
            type="button"
            onClick={() => {
              setRoom(null);
              setState(RULES_MIXED);
              setMode('mixed');
            }}
          >
            Mix them up
          </button>
        ) : (
          <button
            className="rb primary"
            type="button"
            disabled={mode === 'shown'}
            onClick={() => {
              setRoom(state);
              setState(RULES_OURS);
              setMode('shown');
            }}
          >
            Show ours
          </button>
        )}
        <button
          className="rb"
          type="button"
          onClick={() => {
            setRoom(null);
            setState(RULES_OURS);
            setMode('ours');
          }}
        >
          Reset
        </button>
        {room && active && (
          <span className="dk-k" style={{ color: 'var(--ink)', alignSelf: 'center' }}>
            Same as the room on {right} of {RULE_CARDS.length}
          </span>
        )}
      </div>
      <div className={`b7-rules ${on ? '' : 'pre'}`}>
        {RULES.map((c) => (
          <div key={c.k} className={`card ${c.cls}`}>
            <div className="h">
              <i>{c.mark}</i>
              <div>
                <b>{c.k}</b>
                <span className="dk-k">{c.sub}</span>
              </div>
            </div>
          </div>
        ))}
        <SortBoard id="rules" width={RB.w} height={RB.h} zones={ruleZones} cards={RULE_CARDS} state={state} onChange={setState} locked={mode !== 'mixed'} render={render} />
      </div>
      <div className="b7-rules-foot">
        <div>
          <span className="dk-k">ChatGPT</span>
          <span>Dots have Custom Rules that allow an action, require approval, or block it.</span>
        </div>
        <div>
          <span className="dk-k">Claude</span>
          <span>Each scheduled task has an approval mode. Set it when you create the task.</span>
        </div>
        <div>
          <span className="dk-k">Both</span>
          <span>
            Put the three lists in the task itself. <Hl>A rule you only said once in a chat is not a rule.</Hl>
          </span>
        </div>
      </div>
    </Frame>
  );
};

/* ---------- where it lives ---------- */
const WhereItLives: Page = () => (
  <Frame label="Where background jobs live">
    <Head
      eb={eb('background', 'Background · where it lives')}
      title="Same idea, two switches"
      sum="Both apps can run a saved instruction on a timetable and leave you the result. ChatGPT adds an always-on agent on the higher plans."
    />
    <PageNo />
    <Split
      top="16.4cqw"
      left={
        <>
          <SideLabel name="OpenAI · ChatGPT" sub="check names each cohort" />
          <div className="b2-conn">
            {[
              ['Scheduled tasks', 'Ask in any chat: “every Monday at 6:30, brief me on…”. Plus and up.'],
              ['Manage', 'Scheduled, in the sidebar: see, pause, edit or delete each task.'],
              ['Dots', 'An always-on agent with its own cloud computer. Pro and Business Premium.'],
              ['Rules', 'Custom Rules: allow, ask first, or block, action by action.'],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="dk-k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </>
      }
      right={
        <>
          <SideLabel name="Claude" sub="check names each cohort" />
          <div className="b2-conn">
            {[
              ['Scheduled tasks', 'Scheduled, in the sidebar → New task → Create with Claude. All paid plans.'],
              ['How often', 'Hourly, daily, weekdays, weekly, or only when you press run.'],
              ['Laptop asleep?', 'It runs anyway, in the cloud. A task that needs local files runs on your computer.'],
              ['Rules', 'An approval mode on each task.'],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="dk-k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="handnote" style={{ right: '3.4cqw', bottom: '2.4cqw' }}>
            read every result for the first two weeks
          </div>
        </>
      }
    />
    <Src half>
      Sources: Claude Help Centre, “Schedule recurring tasks in Claude Cowork” (Oct 2026); Engadget on ChatGPT’s Scheduled page (Jun 2026); OpenAI, “Introducing Dots”.
    </Src>
  </Frame>
);

/* ---------- a team of agents (demo only) ---------- */
const HELPERS = [
  { t: 'Read the 60-page spec. List every survey requirement.', r: '31 requirements, 4 unclear', d: 2.6 },
  { t: 'Price each item from our rates file.', r: '27 priced, 4 need a rate', d: 3.2 },
  { t: 'Check last year’s similar job for what we missed.', r: 'Missed last time: council lodgement fees', d: 2.1 },
];
const TeamOfAgents: Page = () => {
  const active = useIsActivePage();
  const [ph, setPh] = useState(active ? 0 : 5);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!active) return;
    setPh(0);
    const ts = [400, 1300, 4700, 5300, 6100].map((ms, i) => setTimeout(() => setPh(i + 1), ms));
    return () => ts.forEach(clearTimeout);
  }, [active, run]);
  const ys = [40, 140, 240];
  return (
    <Frame label="A team of agents">
      <Head
        eb={eb('background', 'Background · levels 7 and 8')}
        title="A team of agents, for a look"
        sum="Not for today, but worth seeing. A lead agent splits a big job, three helpers work at once, and the lead puts it back together for you to review."
      />
      <PageNo />
      <div className="b7-team" data-ph={ph}>
        <svg viewBox="0 0 928 280" aria-hidden="true">
          {ys.map((y) => (
            <path key={`o${y}`} className="out" pathLength={1} d={`M180 140 C 255 140, 255 ${y}, 330 ${y}`} />
          ))}
          {ys.map((y) => (
            <path key={`b${y}`} className="back" pathLength={1} d={`M620 ${y} C 690 ${y}, 690 140, 760 140`} />
          ))}
        </svg>
        <div className="lead">
          <span className="dk-k">Lead agent</span>
          <b>Tender for the Coastal subdivision, 42 lots</b>
          <span className="st2">{ph === 0 ? 'Reading the job' : ph < 4 ? 'Waiting on helpers' : 'Combining'}</span>
        </div>
        {HELPERS.map((h, i) => (
          <div key={h.t} className={`helper ${ph >= 3 ? 'fin' : ph >= 2 ? 'busy' : ''}`} style={{ top: `${ys[i] / 10 - 4}cqw`, ['--d' as string]: `${h.d}s` }}>
            <span className="dk-k">Helper {i + 1}</span>
            <span className="t">{h.t}</span>
            <span className="bar">
              <i />
            </span>
            <span className="res">{ph >= 3 ? h.r : ph >= 2 ? 'Working…' : 'Waiting'}</span>
          </div>
        ))}
        <div className={`result ${ph >= 5 ? 'on' : ''}`}>
          <span className="dk-k">For you to review</span>
          <b>Draft tender, a price, and six questions for the client</b>
          <span className="st2">The lead checked the helpers’ work against the spec first.</span>
        </div>
        <button className="rb" type="button" onClick={() => setRun((x) => x + 1)}>
          Run it again
        </button>
      </div>
      <div className="b7-team-foot">
        <div>
          <span className="dk-k">Where it pays</span>
          <span>A big tender, month-end, research across hundreds of files. Jobs that split cleanly into parts.</span>
        </div>
        <div>
          <span className="dk-k">The right scale</span>
          <span>One agent, plus two or three helpers when a job splits. Not hundreds. That is enough for most small businesses.</span>
        </div>
      </div>
    </Frame>
  );
};

const Live = live({
  block: 'background',
  title: 'Set up the Monday brief',
  minutes: 4,
  backup: () => WorksWhileYouDont,
  liveIn: 'claude',
  apps: [
    {
      who: 'openai',
      app: 'ChatGPT desktop',
      mode: 'Scheduled task',
      steps: [
        <>
          New chat, calendar and email connected: <span className="dk-say">Every Monday at 6:30, brief me on the week: site visits from my calendar, quotes waiting on me, overdue invoices, and any day over 32°. Read only. Draft, never send.</span>
        </>,
        'Open Scheduled in the sidebar. Show the task, its time and the pause switch.',
        'Run it once now, so the room sees a first brief.',
      ],
      ready: 'The same brief, set up as a scheduled task in ChatGPT before the day. Open Scheduled in the sidebar, show the task, its time and the pause switch, then open the brief it produced last Monday.',
    },
    {
      who: 'claude',
      app: 'Claude desktop',
      mode: 'Cowork · Scheduled',
      steps: [
        'Scheduled → New task → Create with Claude. Paste the same brief.',
        'Answer its questions. Set the approval mode so it can read and draft, never send.',
        'Run it now, so the room sees a first brief. Put it beside the ChatGPT one.',
      ],
    },
  ],
});

const Lab7 = lab({
  id: 'lab7',
  n: 7,
  block: 'background',
  minutes: 15,
  title: 'One job that runs without you',
  goal: 'Pick one thing you check every week. Set it up as a scheduled task, with the three lists of rules written into it. Nothing connected? Pick a job that needs no connector: a weekly check of a supplier’s public price page, or a summary of one folder.',
  done: 'The task exists, with its rules written in, and it ran once when you pressed run.',
  keep: 'The scheduled task. Next week it runs on its own.',
  openai: [
    'Pick the job: a Monday brief, an inbox digest, a price check on a public web page, a to-do refresh.',
    <>
      In a new chat: <span className="dk-say">Every [day] at [time], [the job]. You may read and draft. Ask before you send anything. Never pay or delete. Tell me what you could not find.</span>
    </>,
    'Find it under Scheduled in the sidebar. Run it once now.',
    'Read the result. Tighten the wording, then leave it on.',
  ],
  claude: [
    'Pick the job: a Monday brief, an inbox digest, a price check on a public web page, a to-do refresh.',
    <>
      Scheduled → New task → Create with Claude: <span className="dk-say">Every [day] at [time], [the job]. You may read and draft. Ask before you send anything. Never pay or delete. Tell me what you could not find.</span>
    </>,
    'Check the approval mode, then run it once now.',
    'Read the result. Tighten the wording, then leave it on.',
  ],
  hand: 'read and draft, never send',
});

export const pages: [Page, string][] = [
  [Open, '15:00 · Block 7 opener. Thirty minutes, half of it the lab. This is a headline block: everyone leaves with one scheduled job that has run once. Skip the team-of-agents page unless you are ahead.'],
  [
    WorksWhileYouDont,
    '4 min. Let the week run through once. Then click the Monday brief, the enquiry replies and the Friday review. Point at the two tags: "Done" is what it did alone, "Needs you" is the short list it leaves.',
  ],
  [
    ApprovalRules,
    '4 min. Read the three lists. Then "Mix them up": every item moves one list along, and the room sorts them back by dragging; "Show ours" slides them home and marks where the room differed. Ask the room for one more item for each list from their own business. The "Never" list includes bank details on purpose; it sets up the hidden-instruction page in the next block. The sort is saved, so a reload does not lose it.',
  ],
  [
    WhereItLives,
    '3 min. Most people will use scheduled tasks; the always-on agent in ChatGPT is for the higher plans. CHECK BEFORE EACH COHORT, on your own accounts: every row on this page is a product claim (which plans have scheduled tasks, which have Dots, whether Claude tasks run with the laptop asleep), and one of the sources is a news article from June.',
  ],
  [
    TeamOfAgents,
    'Skip unless you are ahead; keep it as a backup. 3 min if used. Demo only. Let it run once. The point is scale: you already have what you need at L5 and L6.',
  ],
  [
    Live,
    '4 min. Claude runs live this block; the ChatGPT task was set up before the day. Use the demo account with the Ridgeline calendar and inbox connected. Run it once on demand so people see a result; do not wait for Monday.',
  ],
  [
    Lab7,
    '15 min. Start the timer. Most people pick the Monday brief; that is fine. Anyone with nothing connected picks the public price page or a folder. Done means the task exists and has run once, not that the brief is perfect. Walk the room and check that every task has the "never" list written into it.',
  ],
];
