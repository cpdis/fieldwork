/* Block 2 · 9:30 · The map of the apps. */
import type { Page } from '@open-slide/core';
import { useIsActivePage } from '@open-slide/core';
import { type ReactNode, useEffect, useState } from 'react';
import { Chip, Frame, Hl, type Hotspot, InsetWindow, SideLabel, Split } from '@assets/fieldwork/brand';
import { Head, PageNo, Src, eb, lab, live, opener } from '../kit';

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
const PlanStrip = ({ personal, work }: { personal: string[]; work: string[] }) => (
  <div className="b2-plans">
    <div className="grp">
      <span className="dk-k">Personal</span>
      <div className="row">
        {personal.map((p) => (
          <span key={p}>{p}</span>
        ))}
      </div>
    </div>
    <div className="grp work">
      <span className="dk-k">Work</span>
      <div className="row">
        {work.map((p) => (
          <span key={p}>{p}</span>
        ))}
      </div>
    </div>
  </div>
);

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
          <PlanStrip personal={['Free', 'Plus', 'Pro']} work={['Business', 'Enterprise']} />
          <div className="b2-setting">
            <span className="dk-k">The switch</span>
            <span>
              Settings → Data controls → <b>Improve the model for everyone</b>
            </span>
          </div>
          <div className="b2-setting">
            <span className="dk-k">You will feel</span>
            <span>Usage limits, and which models and modes you get. Today works on Plus and up.</span>
          </div>
        </>
      }
      right={
        <>
          <SideLabel name="Claude" sub="plan names, late 2026" />
          <PlanStrip personal={['Free', 'Pro', 'Max']} work={['Team', 'Enterprise']} />
          <div className="b2-setting">
            <span className="dk-k">The switch</span>
            <span>
              Settings → Privacy → <b>Help improve Claude</b>
            </span>
          </div>
          <div className="b2-setting">
            <span className="dk-k">You will feel</span>
            <span>Usage limits, and which models and features you get. Today works on Pro and up.</span>
          </div>
          <div className="handnote" style={{ right: '3.4cqw', bottom: '2.4cqw' }}>
            names change. check each cohort
          </div>
        </>
      }
    />
  </Frame>
);

/* ---------- what not to paste ---------- */
type V = 'fine' | 'think' | 'never';
const ITEMS: { t: string; v: V; why: string }[] = [
  { t: 'Your public price list', v: 'fine', why: "It's on your website already." },
  { t: 'Draft of a social post', v: 'fine', why: 'Nothing private in it.' },
  { t: "A client's signed contract", v: 'think', why: 'Client confidentiality. Work plan, and only the pages you need.' },
  { t: 'A sign-in sheet with names and mobiles', v: 'think', why: 'Personal information under the Privacy Act. Work plan, then delete the chat.' },
  { t: 'Staff payroll spreadsheet', v: 'think', why: 'Strip names first, or keep it to a work plan your admin controls.' },
  { t: "A worker's injury details", v: 'think', why: 'Health information is “sensitive” under the APPs. Minimum needed, work plan only.' },
  { t: "A customer's tax file number", v: 'never', why: 'TFNs have their own legal rules. There is no task that needs it.' },
  { t: 'Passwords or bank logins', v: 'never', why: 'Never in a chat. Use the app’s connector or sign in yourself.' },
];
const VL: Record<V | 'q', string> = { q: 'Your call?', fine: 'Fine', think: 'Think first', never: 'Never' };
const ORDER: (V | 'q')[] = ['q', 'fine', 'think', 'never'];

const NotToPaste: Page = () => {
  const [pick, setPick] = useState<(V | 'q')[]>(ITEMS.map(() => 'q'));
  const [shown, setShown] = useState(false);
  const right = ITEMS.filter((it, i) => pick[i] === it.v).length;
  return (
    <Frame label="What not to paste">
      <Head
        eb={eb('map', 'The map · privacy')}
        title="Fine, think first, or never?"
        sum="Click a card to vote with the room. Then show the answers. The rule of thumb is on the right."
      />
      <PageNo />
      <div className="b2-cards">
        {ITEMS.map((it, i) => {
          const p = pick[i];
          return (
            <button
              key={it.t}
              type="button"
              className={`b2-card ${shown ? `show ${it.v}` : ''} ${p !== 'q' ? 'voted' : ''}`}
              onClick={() => {
                const n = [...pick];
                n[i] = ORDER[(ORDER.indexOf(p) + 1) % ORDER.length];
                setPick(n);
              }}
            >
              <b>{it.t}</b>
              <span className={`vote v-${p}`}>{VL[p]}</span>
              {shown && (
                <span className="ans">
                  <span className={`st ${it.v === 'fine' ? 'ok' : it.v === 'think' ? 'warn' : 'bad'}`}>{VL[it.v]}</span>
                  <span>{it.why}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="b2-rule">
        <span className="dk-k">Rule of thumb</span>
        <p>
          Anything with a person's name in it goes in a <b>work plan</b>, or gets the names taken out.
        </p>
        <p>
          <Hl>Never</Hl> paste ID numbers, passwords or bank details.
        </p>
        <div className="pbtns">
          <button className="rb primary" type="button" onClick={() => setShown(true)}>
            Show the answers
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              setPick(ITEMS.map(() => 'q'));
              setShown(false);
            }}
          >
            Reset
          </button>
        </div>
        {shown && pick.some((p) => p !== 'q') && (
          <span className="dk-k" style={{ color: 'var(--ink)' }}>
            The room matched {right} of {ITEMS.length}
          </span>
        )}
      </div>
      <Src>Australian Privacy Principles (Privacy Act 1988). General guidance, not legal advice.</Src>
    </Frame>
  );
};

/* ---------- connect one thing ---------- */
const CONNECT_OPENAI = [
  ['Email', 'Gmail · Outlook'],
  ['Calendar', 'Google Calendar · Outlook'],
  ['Files', 'Google Drive · OneDrive · SharePoint · Dropbox'],
  ['Everything else', 'Check the directory. No connector? Block 5 has the answer.'],
];
const CONNECT_CLAUDE = [
  ['Email', 'Gmail · Outlook (Microsoft 365)'],
  ['Calendar', 'Google Calendar · Outlook (Microsoft 365)'],
  ['Files', 'Google Drive · OneDrive and SharePoint (Microsoft 365)'],
  ['Everything else', 'Check the directory. No connector? Block 5 has the answer.'],
];
const Connect: Page = () => (
  <Frame label="Connect one thing">
    <Head
      eb={eb('map', 'The map · connectors')}
      title="Plug in one thing: your email or your files"
      sum="A connector lets the app read (and sometimes write to) another app you already use, with your permission. Start with one. You can switch it off any time."
    />
    <PageNo />
    <Split
      top="16.4cqw"
      left={
        <>
          <SideLabel name="OpenAI · ChatGPT" sub="Settings → Apps" />
          <div className="b2-conn">
            {CONNECT_OPENAI.map(([k, v]) => (
              <div key={k}>
                <span className="dk-k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="mapline">
            Then in a chat: <b>＋ → pick the app</b>
          </div>
        </>
      }
      right={
        <>
          <SideLabel name="Claude" sub="Settings → Connectors" />
          <div className="b2-conn">
            {CONNECT_CLAUDE.map(([k, v]) => (
              <div key={k}>
                <span className="dk-k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="mapline">then turn it on per chat, from the + menu</div>
        </>
      }
    />
  </Frame>
);

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
  minutes: 5,
  backup: () => PhotoToTable,
  apps: [
    {
      who: 'openai',
      app: 'ChatGPT desktop',
      mode: 'Chat',
      steps: [
        'Photograph the paper sign-in sheet on the front table.',
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
    },
  ],
});

const Lab1 = lab({
  id: 'lab1',
  n: 1,
  block: 'map',
  minutes: 10,
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
  [Open, '9:30 · Block 2 opener. Thirty minutes. Ends with a 10-minute lab.'],
  [
    MapOfApps,
    '6 min. Click the three chips in turn. On each, click a numbered dot in both windows. The big idea: ChatGPT has one app with three modes (Chat, Work, Codex); Claude has one app with Chat, Cowork and Code. Same three jobs. Check the tab names against the live apps before each cohort.',
  ],
  [
    Plans,
    '3 min. Ask who is on a free plan. Tell them today needs a paid plan for the agent parts. Have everyone open the privacy switch now, on screen, and decide. Do not tell them what to choose; tell them where it is.',
  ],
  [
    NotToPaste,
    '4 min. Read each card, ask the room for a show of hands, click to set the room’s vote. Then "Show the answers". The two "Never" cards are the only hard rules. Everything else is "work plan, minimum needed".',
  ],
  [
    Connect,
    '3 min. Do not connect live yet; just show where. In the lab, anyone who finishes early connects their email or files. Microsoft shops: on Claude, the Microsoft 365 connector may need an admin on Team or Enterprise.',
  ],
  [
    PhotoToTable,
    '2 min. Press "Run it". Point at the flag at the end: a good answer tells you what it guessed. That is the habit for the whole day.',
  ],
  [
    Live,
    '5 min. Bring a paper sign-in sheet (the one people signed on arrival works, if they agree; otherwise use a made-up one). Run it in ChatGPT, then Claude. If either app is slow or the Wi-Fi drops, come back and use the page before this one.',
  ],
  [
    Lab1,
    '10 min. Start the timer. Walk the room. Most common snag: the photo is too dark or at an angle; tell them to retake it flat. Early finishers: connect email or files (previous pages).',
  ],
];
