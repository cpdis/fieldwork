/* Block 2 · 9:30 · The map of the apps. */
import type { Page } from '@open-slide/core';
import { useIsActivePage } from '@open-slide/core';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Chip, Frame, Hl, type Hotspot, InsetWindow, SideLabel, Split } from '@assets/fieldwork/brand';
import { PX, SortBoard, type SortState, type Zone, cqw, stateFrom, zoneOf } from '../drag/sort-board';
import { COURSE, PLANS } from '../course';
import { Head, PageNo, Src, eb, lab, live, opener } from '../kit';
import { useSaved } from '../persist';

const Open = opener(
  'map',
  'Two desktop apps, three jobs each. Know which door to use, what each plan means for your data, and do one useful thing before 10:00.',
);

/* ---------- the map (from the prototype) ---------- */
type Job = {
  id: 'talk' | 'work' | 'build';
  label: string;
  summary: string;
  L: { title: string; tabs: string[]; active: string; map: [string, string] };
  R: { title: string; tabs: string[]; active: string; map: string };
};
// Late 2026: Codex is a mode inside the ChatGPT desktop app, beside Chat and Work. Check before each cohort.
const OPENAI_TABS = ['Chat', 'Work', 'Codex'];
const CLAUDE_TABS = ['Chat', 'Cowork', 'Code'];
const JOBS: Job[] = [
  {
    id: 'talk',
    label: 'Ask and talk',
    summary: 'A conversation. Best for drafting, thinking out loud and quick answers. It only knows what you tell it, attach or connect.',
    L: { title: 'ChatGPT desktop', tabs: OPENAI_TABS, active: 'Chat', map: ['ChatGPT desktop', 'Chat'] },
    R: { title: 'Claude desktop', tabs: CLAUDE_TABS, active: 'Chat', map: 'Claude desktop → the Chat tab' },
  },
  {
    id: 'work',
    label: 'Work in your files',
    summary:
      'Hand over a task. It opens your files and connected apps, works through steps you can watch, and makes real documents and spreadsheets.',
    L: { title: 'ChatGPT desktop', tabs: OPENAI_TABS, active: 'Work', map: ['ChatGPT desktop', 'Work'] },
    R: { title: 'Claude desktop', tabs: CLAUDE_TABS, active: 'Cowork', map: 'Claude desktop → Cowork' },
  },
  {
    id: 'build',
    label: 'Build and automate',
    summary: "Build small tools, sites and automations in a project folder. In ChatGPT it's the Codex mode. In Claude it's the Code tab.",
    L: { title: 'ChatGPT desktop', tabs: OPENAI_TABS, active: 'Codex', map: ['ChatGPT desktop', 'Codex'] },
    R: { title: 'Claude desktop', tabs: CLAUDE_TABS, active: 'Code', map: 'Claude desktop → Code (same app!)' },
  },
];

const BODY: Record<Job['id'], ReactNode> = {
  talk: (
    <div className="chat">
      <div className="msg me">Rewrite this so it sounds less stiff: “Please find attached our quotation for the works as discussed.”</div>
      <div className="msg ai">
        Here's a friendlier version: “Thanks for walking the site with me on Tuesday. Your quote's attached, and I'm happy to talk
        through any of it.”
      </div>
      <div />
      <div className="composer">
        <b>＋ Attach</b>
        <span>Reply…</span>
      </div>
    </div>
  ),
  work: (
    <div className="cols3">
      <div className="col">
        <div className="mlab">Quotes folder</div>
        <div className="file">westside.pdf</div>
        <div className="file">coastal.pdf</div>
        <div className="file">northline.eml</div>
      </div>
      <div className="col">
        <div className="mlab">Task</div>
        <div className="task">Compare these three quotes and make a table</div>
        <div className="done">Read 3 files</div>
        <div className="done">Pulled unit prices</div>
        <div className="now">Building the table</div>
      </div>
      <div className="col">
        <div className="mlab">comparison.xlsx</div>
        <div className="mini">
          {['Supplier', 'Per m', 'Days'].map((h) => (
            <span key={h} className="h">
              {h}
            </span>
          ))}
          {[
            ['Westside', '$8.40', '2'],
            ['Coastal', '$7.95', '5'],
            ['Northline', '$8.10', '1'],
          ].flatMap((r) => r.map((c, i) => <span key={r[0] + i}>{c}</span>))}
        </div>
      </div>
    </div>
  ),
  build: (
    <div className="cols3">
      <div className="col">
        <div className="mlab">booking-site</div>
        <div className="file">index.html</div>
        <div className="file">styles.css</div>
        <div className="file">dates.json</div>
      </div>
      <div className="col">
        <div className="mlab">Changes · index.html</div>
        <code className="del">- &lt;h1&gt;Welcome&lt;/h1&gt;</code>
        <code className="add">+ &lt;h1&gt;Tap trucks for hire&lt;/h1&gt;</code>
        <code className="add">+ &lt;a href="/book"&gt;Check a date&lt;/a&gt;</code>
      </div>
      <div className="col">
        <div className="mb">
          <div className="mb-bar">localhost:3000</div>
          <div className="mb-body">
            <b>Tap trucks for hire</b>
            <span style={{ color: '#6a6c71' }}>Perth · weekends</span>
            <span className="pill">Check a date</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

const HOTS: Record<Job['id'], Hotspot[]> = {
  talk: [
    { x: 58, y: 47, k: 'The answer', t: "It only knows what's in this chat, plus anything you attach or connect." },
    { x: 28, y: 88, k: 'Attach', t: 'Drop in a file or a photo. The fastest way to give it context.' },
  ],
  work: [
    { x: 27, y: 32, k: 'Your files', t: 'It works inside a folder you choose, or connected apps like Outlook and OneDrive.' },
    { x: 57, y: 56, k: 'The steps', t: 'Each step shows as it happens. You can stop it or step in at any point.' },
    { x: 85, y: 40, k: 'The output', t: 'A real file. Here, a spreadsheet you can open in Excel.' },
  ],
  build: [
    { x: 26, y: 32, k: 'Project folder', t: 'A folder on your computer. Everything it builds lives here.' },
    { x: 57, y: 40, k: 'Changes', t: "Every change is shown line by line before it's kept." },
    { x: 86, y: 45, k: 'Live preview', t: 'What it built, running. Click around before you publish it.' },
  ],
};

export const MapOfApps: Page = () => {
  const [job, setJob] = useState(0);
  const j = JOBS[job];
  return (
    <Frame label="The map of the apps">
      <Head eb={eb('map')} title="Three jobs, three places">
        <div className="steps" style={{ position: 'absolute', right: '3.6cqw', top: '5.6cqw' }}>
          {JOBS.map((x, i) => (
            <Chip key={x.id} n={i + 1} label={x.label} state={i === job ? 'on' : ''} onClick={() => setJob(i)} />
          ))}
        </div>
        <p className="dk-sum">{j.summary}</p>
      </Head>
      <PageNo />
      <Split
        top="13.4cqw"
        left={
          <>
            <SideLabel name="OpenAI · ChatGPT + Codex" sub="one app, three modes" />
            <InsetWindow key={`L-${j.id}`} {...j.L} height={25} hots={HOTS[j.id]}>
              {BODY[j.id]}
            </InsetWindow>
            <div className="mapline">
              Where: {j.L.map[0]} <b>{j.L.map[1]}</b>
            </div>
          </>
        }
        right={
          <>
            <SideLabel name="Claude" sub="same job, other app" />
            <InsetWindow key={`R-${j.id}`} {...j.R} height={25} hots={HOTS[j.id]}>
              {BODY[j.id]}
            </InsetWindow>
            <div className="mapline">{j.R.map}</div>
          </>
        }
      />
    </Frame>
  );
};

/* ---------- plans and privacy ---------- */
type Plan = { name: string; price: string };
const PlanCell = ({ p }: { p: Plan }) => (
  <span>
    {p.name}
    {p.price && <small>{p.price}</small>}
  </span>
);
const PlanStrip = ({ personal, work }: { personal: Plan[]; work: Plan[] }) => (
  <div className="b2-plans">
    <div className="grp">
      <span className="dk-k">Personal</span>
      <div className="row">
        {personal.map((p) => (
          <PlanCell key={p.name} p={p} />
        ))}
      </div>
    </div>
    <div className="grp work">
      <span className="dk-k">Work</span>
      <div className="row">
        {work.map((p) => (
          <PlanCell key={p.name} p={p} />
        ))}
      </div>
    </div>
  </div>
);
const anyPrice = [...PLANS.openai.personal, ...PLANS.openai.work, ...PLANS.claude.personal, ...PLANS.claude.work].some((p) => p.price);

const Plans: Page = () => (
  <Frame label="Plans and privacy">
    <Head
      eb={eb('map', 'The map · plans and privacy')}
      title="Which plan, and who sees your chats"
      sum={
        <>
          Personal plans: you choose whether chats help train the model, so <Hl>check the switch today</Hl>. Work plans: chats are
          not used for training by default, and an admin controls the settings.
        </>
      }
    />
    <PageNo />
    <Split
      top="16.4cqw"
      left={
        <>
          <SideLabel name="OpenAI · ChatGPT" sub="plan names, late 2026" />
          <PlanStrip personal={PLANS.openai.personal} work={PLANS.openai.work} />
          <div className="b2-setting">
            <span className="dk-k">The switch</span>
            <span>
              Settings → Data controls → <b>Improve the model for everyone</b>
            </span>
          </div>
          <div className="b2-setting">
            <span className="dk-k">You will feel</span>
            <span>
              Usage limits, and which models and modes you get. This morning works on Plus and up. <b>Some of this afternoon needs a
              higher plan. We will say when.</b>
            </span>
          </div>
        </>
      }
      right={
        <>
          <SideLabel name="Claude" sub="plan names, late 2026" />
          <PlanStrip personal={PLANS.claude.personal} work={PLANS.claude.work} />
          <div className="b2-setting">
            <span className="dk-k">The switch</span>
            <span>
              Settings → Privacy → <b>Help improve Claude</b>
            </span>
          </div>
          <div className="b2-setting">
            <span className="dk-k">You will feel</span>
            <span>
              Usage limits, and which models and features you get. This morning works on Pro and up. <b>Some of this afternoon needs a
              particular plan. We will say when.</b>
            </span>
          </div>
          <div className="handnote" style={{ right: '3.4cqw', bottom: '2.4cqw' }}>
            {COURSE.menusChecked ? `checked ${COURSE.menusChecked}` : 'names change. check each cohort'}
          </div>
        </>
      }
    />
    {anyPrice && (
      <Src half>
        Prices are A$ a month including GST{COURSE.menusChecked ? `, as charged on ${COURSE.menusChecked}` : ''}. They change; check the
        pricing page before you buy.
      </Src>
    )}
  </Frame>
);

/* ---------- what not to paste ---------- */
type V = 'fine' | 'think' | 'never';
const ITEMS: { t: string; v: V; why: string }[] = [
  { t: 'Your public price list', v: 'fine', why: "It's on your website already." },
  { t: "A client's signed contract", v: 'think', why: 'Client confidentiality. A work plan, or training switched off, and only the pages you need.' },
  { t: 'A sign-in sheet with names and mobiles', v: 'think', why: 'Personal information. A work plan, or names removed first. Delete the chat after.' },
  { t: "A worker's injury details", v: 'think', why: 'Health details are “sensitive information” in privacy law. The minimum needed, with the name taken out.' },
  { t: "A customer's tax file number", v: 'never', why: 'TFNs have their own legal rules. There is no task that needs it.' },
  { t: 'Passwords or bank logins', v: 'never', why: 'Never in a chat. Use the app’s connector or sign in yourself.' },
];
const VL: Record<V, string> = { fine: 'Fine', think: 'Think first', never: 'Never' };
const VSUB: Record<V, string> = { fine: 'Paste it', think: 'Protected plan, minimum needed', never: 'Not in any chat' };
const VS: V[] = ['fine', 'think', 'never'];
const PASTE_CARDS = ITEMS.map((_, i) => `item-${i}`);
const PASTE_ZONES = ['pile', ...VS];
// Board geometry in canvas px (1cqw = 19.2px): the pile on top, three columns below. deck.css .b2-sort matches.
const PB = { x: 3.6 * PX, y: 15.4 * PX, w: 64 * PX, h: 36.4 * PX };
const PILE_H = 1.9 * PX + 2 * 4.4 * PX + 0.5 * PX;
const PILE_COLS = 3; // six cards, two rows of three
const COL_W = (PB.w - 2 * 0.8 * PX) / 3;
// Once the answers are shown the pile is empty, so the columns move up and the cards grow to fit the reason.
const pasteZones = (shown: boolean): Zone[] => {
  const y = shown ? 1.9 * PX : PILE_H + 1.2 * PX;
  return [
    { id: 'pile', x: 0, y: 0, w: PB.w, h: PILE_H, top: 1.9 * PX, cols: PILE_COLS, cardH: 4.4 * PX, gap: 0.5 * PX },
    ...VS.map((v, i) => ({ id: v, x: i * (COL_W + 0.8 * PX), y, w: COL_W, h: PB.h - y, top: 4.4 * PX, pad: 0.7 * PX, cardH: (shown ? 6 : 4.4) * PX, gap: 0.5 * PX })),
  ];
};
const pasteAll = (where: (i: number) => string) => stateFrom(PASTE_ZONES, PASTE_CARDS, (c) => where(Number(c.slice(5))));
const PASTE_ANSWER = pasteAll((i) => ITEMS[i].v);
const PASTE_EMPTY = pasteAll(() => 'pile');

const NotToPaste: Page = () => {
  const active = useIsActivePage();
  // Saved on this laptop, so a reload mid-sort does not lose the room's answers.
  const [state, setState] = useSaved<SortState>('paste:state', active ? PASTE_EMPTY : PASTE_ANSWER, active);
  // The room's sort at the moment the answers were shown; null until then.
  const [room, setRoom] = useSaved<SortState | null>('paste:room', active ? null : PASTE_ANSWER, active);
  const zones = useMemo(() => pasteZones(!!room), [room]);
  const sorted = PASTE_CARDS.filter((c) => zoneOf(state, c) !== 'pile').length;
  const right = room ? PASTE_CARDS.filter((c, i) => zoneOf(room, c) === ITEMS[i].v).length : 0;
  const render = useCallback(
    (c: string) => {
      const i = Number(c.slice(5));
      const was = room ? zoneOf(room, c) : undefined;
      const ok = was === ITEMS[i].v;
      return (
        <div className="b2-sc">
          <b>{ITEMS[i].t}</b>
          {room && <span className={`st ${ok ? 'ok' : 'bad'}`}>{ok ? '✓' : was === 'pile' ? 'not sorted' : `was: ${VL[was as V]}`}</span>}
          {room && <span className="why">{ITEMS[i].why}</span>}
        </div>
      );
    },
    [room],
  );
  return (
    <Frame label="What not to paste">
      <Head
        eb={eb('map', 'The map · privacy')}
        title="Fine, think first, or never?"
        sum="Two cards per column. Drag each one to where the room says it goes, then show the answers. The rule of thumb is on the right."
      />
      <PageNo />
      <div className="b2-sort" style={{ left: cqw(PB.x), top: cqw(PB.y), width: cqw(PB.w), height: cqw(PB.h) }}>
        <span className="dk-k">The room's call {sorted ? `· ${sorted} of ${ITEMS.length} sorted` : ''}</span>
        {VS.map((v, i) => {
          const z = zones[i + 1];
          return (
            <div key={v} className={`zone z-${v}`} style={{ left: cqw(z.x), top: cqw(z.y), width: cqw(z.w), height: cqw(z.h) }}>
              <b>{VL[v]}</b>
              <span>{VSUB[v]}</span>
            </div>
          );
        })}
        <SortBoard id="paste" width={PB.w} height={PB.h} zones={zones} cards={PASTE_CARDS} state={state} onChange={setState} locked={!!room} render={render} />
      </div>
      <div className="b2-rule">
        <span className="dk-k">Rule of thumb</span>
        <p>
          Anything with a person's name in it goes in a <b>work plan</b>, or gets the names taken out.
        </p>
        <p className="solo">
          One-person business, no work plan? Switch training off (previous page) and take the names out before you paste.
        </p>
        <p>
          <Hl>Never</Hl> paste ID numbers, passwords or bank details.
        </p>
        <div className="pbtns">
          <button
            className="rb primary"
            type="button"
            onClick={() => {
              setRoom(state);
              setState(PASTE_ANSWER);
            }}
          >
            Show the answers
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              setRoom(null);
              setState(PASTE_EMPTY);
            }}
          >
            Reset
          </button>
        </div>
        {room && active && (
          <span className="dk-k" style={{ color: 'var(--ink)' }}>
            The room matched {right} of {ITEMS.length}
          </span>
        )}
      </div>
      <Src>
        Good practice for everyone, and the law for some: the Privacy Act 1988 binds businesses over A$3 million turnover and some smaller
        ones, such as health providers. Check where you sit. General guidance, not legal advice.
      </Src>
    </Frame>
  );
};

/* ---------- first win: a photo becomes a spreadsheet ---------- */
// Mobile numbers are from ACMA's range reserved for fiction (0491 57x xxx), so none belong to a real person.
const SHEET = [
  ['Jess Tran', 'Ridgeline', '0491 570 156', '6:52'],
  ["Mick O'Brien", 'Westside Elec.', '0491 570 313', '6:58'],
  ['Priya Nair', 'Ridgeline', '0491 571 266', '7:05'],
  ['Dave Kowalski', 'Northline', '0491 572 549', '7:11'],
  ['Sam Ho', 'Coastal Plumbing', '0491 573 770', '7:15'],
];
const UNSURE = 2; // Priya's 6 looks like a 0

const SignSheet = () => (
  <div className="b2-sheet">
    <div className="hd">
      <b>TOOLBOX TALK · SIGN-IN</b>
      <span>Site: Lot 14, Baldivis · Date: Tue 4 Nov</span>
    </div>
    <div className="gr">
      <div className="r hdr">
        {['Name', 'Company', 'Mobile', 'Time in', 'Sign'].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {SHEET.map((r, i) => (
        <div key={r[0]} className="r">
          <span>{r[0]}</span>
          <span>{r[1]}</span>
          <span>
            {i === UNSURE ? (
              <>
                0491 571 2<span className="smudge">6</span>6
              </>
            ) : (
              r[2]
            )}
          </span>
          <span>{r[3]}</span>
          <span>
            <svg viewBox="0 0 60 16" aria-hidden="true">
              <path d={`M2 ${10 + (i % 2)} C 10 ${2 + i}, 16 14, 24 8 S 40 ${3 + i}, 48 10 L 58 6`} fill="none" stroke="#2d3a6b" strokeWidth="1.6" /> {/* brand-check: ignore-line (biro on the paper sheet) */}
            </svg>
          </span>
        </div>
      ))}
    </div>
  </div>
);

const PhotoWindow = ({ side, rows, flagged }: { side: 'L' | 'R'; rows: number; flagged: boolean }) => {
  const isL = side === 'L';
  return (
    <div className="win">
      <div className="win-bar">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span>{isL ? 'ChatGPT desktop · Chat' : 'Claude desktop · Chat'}</span>
      </div>
      <div className="win-body" style={{ height: '29.6cqw' }}>
        <div className="b2-pw">
          <div className="msg me b2-ask">
            <div className="thumb">
              <SignSheet />
            </div>
            <span>Turn this into a table I can paste into Excel. Flag anything you can't read.</span>
          </div>
          <div className="b2-out">
            <div className="tbl b2-tbl">
              {['Name', 'Company', 'Mobile', 'In'].map((h) => (
                <span key={h} className="h">
                  {h}
                </span>
              ))}
              {SHEET.slice(0, rows).flatMap((r, i) =>
                r.map((c, j) => (
                  <span key={`${i}${j}`} className={i === UNSURE && j === 2 && flagged ? 'flag' : ''}>
                    {c}
                  </span>
                )),
              )}
            </div>
            {flagged && (
              <div className="b2-note">
                <b>1 to check:</b> Priya Nair's mobile. The second-last digit could be a 6 or a 0. I've used 6.
              </div>
            )}
          </div>
        </div>
        {flagged &&
          (isL ? (
            <div className="tagnote" style={{ right: '1cqw', top: '1cqw' }}>
              It tells you what it guessed
            </div>
          ) : (
            <div className="handnote" style={{ right: '1.2cqw', bottom: '1cqw' }}>
              it flags its own guess ✓
            </div>
          ))}
      </div>
    </div>
  );
};

export const PhotoToTable: Page = () => {
  const active = useIsActivePage();
  const [rows, setRows] = useState(active ? 0 : SHEET.length);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!active) {
      setRows(SHEET.length);
      return;
    }
    if (!run) return;
    if (rows >= SHEET.length) {
      setRun(false);
      return;
    }
    const t = setTimeout(() => setRows((r) => r + 1), rows === 0 ? 900 : 420);
    return () => clearTimeout(t);
  }, [active, run, rows]);
  const flagged = rows >= SHEET.length;
  return (
    <Frame label="A photo becomes a spreadsheet">
      <Head eb={eb('map', 'The map · first win')} title="A photo becomes a spreadsheet">
        <div className="runbar" style={{ position: 'absolute', right: '3.6cqw', top: '5.6cqw' }}>
          <button
            className="rb primary"
            type="button"
            onClick={() => {
              setRows(0);
              setRun(true);
            }}
          >
            {rows === 0 && !run ? 'Run it' : 'Run again'}
          </button>
        </div>
        <p className="dk-sum">
          Timesheets, dockets, stocktake sheets, handwritten orders. Photograph it, drop it in, ask for a table. Then check what it
          says it guessed.
        </p>
      </Head>
      <PageNo />
      <Split
        top="13.4cqw"
        left={
          <>
            <SideLabel name="OpenAI · ChatGPT" sub="Chat, with a photo attached" />
            <PhotoWindow side="L" rows={rows} flagged={flagged} />
          </>
        }
        right={
          <>
            <SideLabel name="Claude" sub="Chat, with a photo attached" />
            <PhotoWindow side="R" rows={rows} flagged={flagged} />
          </>
        }
      />
    </Frame>
  );
};

const Live = live({
  block: 'map',
  title: 'A photo becomes a spreadsheet, for real',
  minutes: 4,
  backup: () => PhotoToTable,
  liveIn: 'openai',
  apps: [
    {
      who: 'openai',
      app: 'ChatGPT desktop',
      mode: 'Chat',
      steps: [
        'Photograph the printed sign-in sheet: the made-up Baldivis one, never the real one from the door.',
        <>
          Drop it in and say: “Turn this into a table I can paste into Excel. Flag anything you can't read.”
        </>,
        'Paste into Excel. Find the flagged cell on the paper.',
      ],
    },
    {
      who: 'claude',
      app: 'Claude desktop',
      mode: 'Chat',
      steps: ['Same photo, same words.', 'Compare the two tables side by side.', 'Ask the room: which one would you trust, and why?'],
      ready: 'The same photo and the same words, run before the day. Open the finished chat, put the two tables side by side, and ask the room which one they would trust, and why.',
    },
  ],
});

const Lab1 = lab({
  id: 'lab1',
  n: 1,
  block: 'map',
  minutes: 12,
  title: 'Your first useful task',
  goal: 'Take something on paper that you usually retype, and turn it into rows you can use.',
  done: 'A table is in Excel or Sheets, and you have checked every flagged cell against the paper.',
  keep: 'The prompt. You will reuse it all day.',
  openai: [
    'Open ChatGPT desktop. Start a new chat.',
    'Photograph a docket, receipt, timesheet or whiteboard. Drop the photo in.',
    <>
      Say: <span className="dk-say">Turn this into a table I can paste into Excel. Flag anything you can't read.</span>
    </>,
    'Paste it into Excel or Sheets. Check each flagged cell against the paper.',
  ],
  claude: [
    'Open Claude desktop. Start a new chat.',
    'Photograph a docket, receipt, timesheet or whiteboard. Drop the photo in.',
    <>
      Say: <span className="dk-say">Turn this into a table I can paste into Excel. Flag anything you can't read.</span>
    </>,
    'Paste it into Excel or Sheets. Check each flagged cell against the paper.',
  ],
  hand: 'no paper? use a screenshot',
});

export const pages: [Page, string][] = [
  [Open, '9:30 · Block 2 opener. Thirty minutes. Ends with a 12-minute lab.'],
  [
    MapOfApps,
    '5 min. Click the three chips in turn. On each, click a numbered dot in both windows. The big idea: ChatGPT has one app with three modes (Chat, Work, Codex); Claude has one app with Chat, Cowork and Code. Same three jobs. CHECK BEFORE EACH COHORT: open both apps and compare the tab names with this page. They have moved before (Cowork has been folding into the main Claude app). The tab names are two constants at the top of b2-map.tsx.',
  ],
  [
    Plans,
    '3 min. Ask who is on a free plan. Tell them today needs a paid plan, and that two things this afternoon need a particular plan: computer use and background agents. You will say which when you get there. Have everyone open the privacy switch now, on screen, and decide. Do not tell them what to choose; tell them where it is. The first question is always "what does it cost?": fill in the prices in course.ts (PLANS) from your own billing pages and they show here with the date you checked.',
  ],
  [
    NotToPaste,
    '4 min. Six cards. Read each, ask the room for a show of hands, drag it into the column the room picks. Then "Show the answers": every card slides to its right column, with a tick or where the room had put it, and the reason. The two "Never" cards are the only hard rules. Everything else is "protected plan, minimum needed". Be straight about the law: most businesses in this room are under the A$3 million line, so for them this is good practice, not a legal duty, unless they hold health records. Sole operators: training off, names out. The sort is saved, so a reload does not lose it.',
  ],
  [
    PhotoToTable,
    '2 min. Press "Run it". Point at the flag at the end: a good answer tells you what it guessed. That is the habit for the whole day.',
  ],
  [
    Live,
    '4 min. ChatGPT runs live; Claude is open with the same job already finished. Use the printed made-up Baldivis sheet every time. Never photograph the real sign-in sheet from the door: it has real names and mobiles, and you have just filed that under "think first". If the app is slow or the Wi-Fi drops, come back and use the page before this one.',
  ],
  [
    Lab1,
    '12 min. Start the timer. Walk the room. Most common snag: the photo is too dark or at an angle; tell them to retake it flat. Second most common: someone is still not signed in. Sit with them. Connecting email and files comes after lunch, when it is needed.',
  ],
];
