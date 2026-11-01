/*
 * Fieldwork interactive slide prototype, ported from course/design/prototype-slides (31 Oct 2026).
 * Four pages: a cover, then three interaction types (explore and zoom, watch it work, try it yourself).
 * App windows are simplified stand-ins, to be checked against the current apps before each course.
 */
import { type Page, type SlideMeta, useIsActivePage } from '@open-slide/core';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Chip,
  Eyebrow,
  Frame,
  type Hotspot,
  InsetWindow,
  Mark,
  Pad,
  SideLabel,
  Split,
  Title,
} from '@assets/fieldwork/brand';

/* ---------------- 1 · cover ---------------- */
const Cover: Page = () => (
  <Frame label="Cover">
    <Pad>
      <Eyebrow>Prototype · slides that do things</Eyebrow>
      <div className="cover-mark">
        <Mark />
        <span className="wm">Fieldwork</span>
      </div>
      <div className="cover-list">
        <div>
          <b>Explore and zoom</b>
          <span>Inset versions of both apps. Click a number to zoom in and see what it is.</span>
        </div>
        <div>
          <b>Watch it work</b>
          <span>Step through an agent run in Codex and Claude at the same time.</span>
        </div>
        <div>
          <b>Try it yourself</b>
          <span>Tick boxes, then check the document. See what the ticks were worth.</span>
        </div>
      </div>
    </Pad>
  </Frame>
);

/* ---------------- 2 · the map of the apps ---------------- */
type Job = {
  id: 'talk' | 'work' | 'build';
  label: string;
  summary: string;
  L: { title: string; tabs: string[]; active: string; map: [string, string] };
  R: { title: string; tabs: string[]; active: string; map: string };
};
// Oct 2026: Codex is a mode inside the ChatGPT desktop app, alongside Chat and Work.
const OPENAI_TABS = ['Chat', 'Work', 'Codex'];
const CLAUDE_TABS = ['Chat', 'Cowork', 'Code'];
const JOBS: Job[] = [
  {
    id: 'talk',
    label: 'Ask and talk',
    summary:
      'A conversation. Best for drafting, thinking out loud and quick answers. It only knows what you tell it, attach or connect.',
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
    summary:
      "Build small tools, sites and automations in a project folder. In ChatGPT it's the Codex mode. In Claude it's the Code tab.",
    L: { title: 'ChatGPT desktop', tabs: OPENAI_TABS, active: 'Codex', map: ['ChatGPT desktop', 'Codex'] },
    R: { title: 'Claude desktop', tabs: CLAUDE_TABS, active: 'Code', map: 'Claude desktop → Code (same app!)' },
  },
];

const BODY: Record<Job['id'], ReactNode> = {
  talk: (
    <div className="chat">
      <div className="msg me">
        Rewrite this so it sounds less stiff: “Please find attached our quotation for the works as discussed.”
      </div>
      <div className="msg ai">
        Here's a friendlier version: “Thanks for walking the site with me on Tuesday. Your quote's attached, and I'm
        happy to talk through any of it.”
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

const MapOfApps: Page = () => {
  const [job, setJob] = useState(0);
  const j = JOBS[job];
  return (
    <Frame label="The map of the apps">
      <Pad style={{ paddingBottom: 0 }}>
        <Eyebrow>Block 2 · 9:30 · The map of the apps</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2cqw' }}>
          <Title>Three jobs, three places</Title>
          <div className="steps">
            {JOBS.map((x, i) => (
              <Chip key={x.id} n={i + 1} label={x.label} state={i === job ? 'on' : ''} onClick={() => setJob(i)} />
            ))}
          </div>
        </div>
        <p style={{ margin: '.9cqw 0 0', fontSize: '1.2cqw', lineHeight: 1.4, maxWidth: '70cqw' }}>{j.summary}</p>
      </Pad>
      <Split
        top="13.4cqw"
        left={
          <>
            <SideLabel name="OpenAI · ChatGPT + Codex" sub="Instrument side" />
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

/* ---------------- 3 · watch it work ---------------- */
const STEPS = [
  { c: 'Goal', log: 'Goal received', note: 'You give it a goal in plain words, including what “best” means to you.', hand: "say what 'best' means", tag: 'Step 1 · the brief' },
  { c: 'Plan', log: 'Plan: 3 steps', note: 'It writes a plan first. Read it: this is the cheapest moment to correct it.', hand: 'read the plan!', tag: 'Step 2 · plan' },
  { c: 'Email', log: 'Read 3 emails in Outlook', note: 'It reads your email through a connector. One supplier only gives prices on its website.', hand: 'connector = plugged in', tag: 'Step 3 · connector' },
  { c: 'Portal', log: 'Opened Northline trade portal', note: 'That website has no connector, so the agent uses the screen like you would: clicking and downloading. This is computer use.', hand: 'no connector → it clicks', tag: 'Step 4 · computer use' },
  { c: 'Compare', log: 'Built the comparison', note: "It checks each quote against your rule. The cheapest supplier can't deliver by Friday, so it picks Northline.", hand: 'cheapest ≠ best', tag: 'Step 5 · judgment' },
  { c: 'Draft', log: 'Drafted reply · waiting for you', note: 'It drafts the reply and stops. Nothing is sent until you approve it.', hand: 'it waits for you ✓', tag: 'Step 6 · your call' },
];

const Cursor = () => (
  <svg className="cursor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.6 L12 13.8 L19 13.8 Z" fill="#1c1d20" stroke="#fff" strokeWidth="1.4" />
  </svg>
);

const RunScreens = ({ step }: { step: number }) => {
  const [approved, setApproved] = useState(false);
  useEffect(() => {
    if (step !== 5) setApproved(false);
  }, [step]);
  return (
    <>
      <div className="scr" hidden={step !== 0}>
        <div className="mlab">Your goal</div>
        <div className="goal">
          Compare the three conduit quotes in my inbox for 40 m of 50 mm conduit. Best = cheapest that arrives by
          Friday. Draft a reply to the winner.
        </div>
      </div>
      <div className="scr" hidden={step !== 1}>
        <div className="mlab">Plan</div>
        <div className="goal" style={{ background: '#fff', border: '.1cqw solid #dedfd9', display: 'grid', gap: '.4cqw' }}>
          <span>1. Find the three quotes in email</span>
          <span>2. Get any missing price from the supplier site</span>
          <span>3. Compare against “by Friday”, then draft a reply</span>
        </div>
      </div>
      <div className="scr inbox" hidden={step !== 2}>
        <div className="mlab">Outlook · Inbox</div>
        <div>
          <span>Westside Electrical · Quote Q-1182</span>
          <span className="tag">PDF</span>
        </div>
        <div>
          <span>Coastal Wholesale · Your quote</span>
          <span className="tag">PDF</span>
        </div>
        <div className="hl">
          <span>Northline Supplies · Price on our trade portal</span>
          <span className="tag">link</span>
        </div>
      </div>
      <div className="scr portal" hidden={step !== 3}>
        <div className="mb">
          <div className="mb-bar">trade.northline.example/quotes</div>
          <div className="mb-body" style={{ gap: 0, padding: '.4cqw' }}>
            <div className="row">
              <span>Q-77 · 50 mm conduit · 40 m</span>
              <span className="dl">Download quote</span>
            </div>
            <div className="row" style={{ color: '#8a8c91' }}>
              <span>Q-61 · cable tray · 12 m</span>
              <span className="dl" style={{ opacity: 0.5 }}>
                Download quote
              </span>
            </div>
          </div>
        </div>
        <Cursor />
      </div>
      <div className="scr" hidden={step !== 4}>
        <div className="mlab">Comparison</div>
        <div className="tbl">
          {['Supplier', 'Per m', 'Total', 'By Friday?'].map((h) => (
            <span key={h} className="h">
              {h}
            </span>
          ))}
          {['Westside', '$8.40', '$336.00', 'Yes', 'Coastal', '$7.95', '$318.00', 'No · 5 days'].map((c, i) => (
            <span key={`r${i}`}>{c}</span>
          ))}
          {['Northline', '$8.10', '$324.00', 'Yes · 1 day'].map((c) => (
            <span key={c} className="win-row">
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="scr" hidden={step !== 5}>
        <div className="mlab">Draft · not sent</div>
        <div className="draft">
          <span style={{ color: '#6a6c71' }}>To: Northline Supplies</span>
          <span>
            Hi team, we'd like to go ahead with Q-77, 40 m of 50 mm conduit, delivered by Friday. Please confirm and send
            the invoice.
          </span>
          <div className="actions">
            <button className="go" type="button" disabled={approved} onClick={() => setApproved(true)}>
              {approved ? 'Approved · demo, nothing sent' : 'Approve and send'}
            </button>
            <button type="button">Edit</button>
          </div>
        </div>
      </div>
    </>
  );
};

const RunWindow = ({ side, step }: { side: 'L' | 'R'; step: number }) => {
  const isL = side === 'L';
  return (
    <>
      <SideLabel
        name={isL ? 'OpenAI · Codex' : 'Claude'}
        sub={isL ? 'Codex, in ChatGPT desktop' : 'Cowork, in Claude desktop'}
      />
      <div className="win">
        <div className="win-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span>{isL ? 'ChatGPT desktop · Codex' : 'Claude desktop · Cowork'}</span>
        </div>
        <div className="win-body" style={{ height: '27cqw' }}>
          <div className="run">
            <div className="log">
              <div className="lh">{isL ? 'Codex' : 'Claude'} is working</div>
              <div className="loglines">
                {STEPS.slice(0, step + 1).map((s, i) => (
                  <div key={s.c} className={i === step ? 'now' : 'done'}>
                    {s.log}
                  </div>
                ))}
              </div>
            </div>
            <div className={`screen ${step === 3 ? 'at3' : ''}`}>
              <RunScreens step={step} />
            </div>
          </div>
          {isL ? (
            <div className="tagnote" style={{ right: '1cqw', top: '1cqw' }}>
              {STEPS[step].tag}
            </div>
          ) : (
            <div className="handnote" style={{ right: '1.2cqw', bottom: '1.2cqw' }}>
              {STEPS[step].hand}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const WatchItWork: Page = () => {
  const active = useIsActivePage();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Only the live copy of this page plays; thumbnails and the presenter preview stay still.
  useEffect(() => {
    if (!playing || !active) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 2800);
    return () => clearInterval(id);
  }, [playing, active]);
  useEffect(() => {
    if (!active) setPlaying(false);
  }, [active]);
  const go = (s: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(STEPS.length - 1, s)));
  };
  return (
    <Frame label="Watch it work">
      <Pad style={{ paddingBottom: 0 }}>
        <Eyebrow>Block 5 · 13:00 · Agents and computer use</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2cqw' }}>
          <Title>Watch it work</Title>
          <div className="runbar">
            <button className="rb" type="button" onClick={() => go(step - 1)}>
              Back
            </button>
            <button
              className="rb primary"
              type="button"
              onClick={() => {
                if (playing) return setPlaying(false);
                if (step === STEPS.length - 1) setStep(0);
                setPlaying(true);
              }}
            >
              {playing ? 'Pause' : 'Play'}
            </button>
            <button className="rb" type="button" onClick={() => go(step + 1)}>
              Next
            </button>
          </div>
        </div>
        <div className="steps" style={{ marginTop: '1cqw' }}>
          {STEPS.map((s, i) => (
            <Chip key={s.c} n={i + 1} label={s.c} state={i === step ? 'on' : i < step ? 'past' : ''} onClick={() => go(i)} />
          ))}
        </div>
        <p className="stepnote" style={{ margin: '.8cqw 0 0' }}>
          {STEPS[step].note}
        </p>
      </Pad>
      <Split top="17.6cqw" left={<RunWindow side="L" step={step} />} right={<RunWindow side="R" step={step} />} />
    </Frame>
  );
};

/* ---------------- 4 · ticked vs verified ---------------- */
type Finding = [string, string, number, boolean, 'ok' | 'bad' | 'warn'];
const FIND: Finding[] = [
  ['F01', 'Emergency contact still lists the old site supervisor', 3, true, 'ok'],
  ['F02', 'Muster point differs between the map and the text', 5, true, 'bad'],
  ['F03', 'Exclusion zone is 10 m in the text, 15 m in the figure', 7, true, 'ok'],
  ['F04', 'No traffic plan for the north gate', 8, false, 'bad'],
  ['F05', 'Permit number has a typo', 9, true, 'ok'],
  ['F06', 'PPE table leaves out hearing protection near the drill rig', 11, true, 'warn'],
  ['F07', 'Revision log not updated for Rev B', 2, true, 'ok'],
  ['F08', 'Two different dates for the site induction', 4, true, 'bad'],
  ['F09', 'First-aid officer not named', 12, false, 'ok'],
  ['F10', 'Weather stop rule uses an old wind limit', 14, false, 'warn'],
];
const LABEL = { ok: 'Fixed', bad: 'Still wrong', warn: 'Partly fixed' };

const TickedVsVerified: Page = () => {
  const [ticks, setTicks] = useState(FIND.map((f) => f[3]));
  const [checked, setChecked] = useState(false);
  const t = ticks.filter(Boolean).length;
  const v = FIND.filter((f, i) => ticks[i] && f[4] === 'ok').length;
  return (
    <Frame label="A ticked box is not a verified edit">
      <Pad>
        <Eyebrow>Block 9 · 15:30 · Trust</Eyebrow>
        <Title>A ticked box is not a verified edit</Title>
      </Pad>
      <div className="reg">
        <div className="reg-h">
          <span>Site safety plan · Rev B · review register</span>
          <span>Ridgeline Surveying (example)</span>
        </div>
        <div className="rows">
          {FIND.map((f, i) => (
            <label className="r" key={f[0]}>
              <input
                type="checkbox"
                checked={ticks[i]}
                onChange={(e) => {
                  const n = [...ticks];
                  n[i] = e.target.checked;
                  setTicks(n);
                  setChecked(false);
                }}
              />
              <span className="id">{f[0]}</span>
              <span className="txt">{f[1]}</span>
              <span className="pg">p.{f[2]}</span>
              {checked ? (
                <span className={`st ${ticks[i] ? f[4] : 'mu'}`}>{ticks[i] ? LABEL[f[4]] : 'Not ticked'}</span>
              ) : (
                <span />
              )}
            </label>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="nums">
          <div className="num">
            <b>{t}</b>
            <span>Ticked on the checklist</span>
          </div>
          <div className="num v">
            <b>{checked ? v : '–'}</b>
            <span>Fixed in the document</span>
          </div>
        </div>
        <p className="verdict">
          {checked
            ? `${t} ticked. ${v} actually fixed in the document. Check the document, not the checklist.`
            : `The checklist says ${t} ${t === 1 ? 'item is' : 'items are'} done. Tick or untick a few, then check the revised document.`}
        </p>
        <div className="pbtns">
          <button className="rb primary" type="button" onClick={() => setChecked(true)}>
            Check the revised document
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              setTicks(FIND.map((f) => f[3]));
              setChecked(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </Frame>
  );
};

export const meta: SlideMeta = { title: 'Fieldwork · interactive prototype' };

export const notes = [
  'Cover. Three kinds of slide: explore and zoom, watch it work, try it yourself.',
  'Pick a job with the chips, then click a numbered dot in either window to zoom in. Same job, two apps.',
  'Press Play, or step with Next. Pause on step 4 (computer use) and step 6 (it waits for you).',
  'Hand the room the checklist: untick a few, then press Check the revised document. Seven ticked is not seven fixed.',
];

export default [Cover, MapOfApps, WatchItWork, TickedVsVerified] satisfies Page[];
