/* Block 6 · 14:00 · Make it repeatable (L5). */
import type { Page } from '@open-slide/core';
import { useIsActivePage } from '@open-slide/core';
import { useEffect, useState } from 'react';
import { Frame, Hl, SideLabel, Split } from '@assets/fieldwork/brand';
import { CountUp, Head, PageNo, Src, eb, lab, live, opener, usePlay } from '../kit';

const Open = opener(
  'repeat',
  'Save what worked so it runs the same way next time. Most of what businesses automate is boring, and that is good news: boring is easy to get right.',
);

/* ---------- the boring 81% ---------- */
const SEGS = [
  { k: 'Capturing leads', v: 30 },
  { k: 'Sending notifications', v: 19 },
  { k: 'Creating records', v: 18 },
  { k: 'Updating records', v: 14 },
];
const Boring: Page = () => {
  const on = usePlay(150);
  let acc = 0;
  return (
    <Frame label="The boring 81 percent">
      <Head
        eb={eb('repeat', 'Repeatable · what people automate')}
        title="What 20 million automations actually do"
        sum="Moving information from where it lands to everywhere it needs to go. That is four-fifths of all of it."
      />
      <PageNo />
      <div className={`b6-bar ${on ? '' : 'pre'}`}>
        {SEGS.map((s, i) => {
          const left = acc;
          acc += s.v;
          return (
            <div key={s.k} className="seg" style={{ left: `${left}%`, width: `${s.v}%`, ['--i' as string]: i }}>
              <b>{s.v}%</b>
              <span>{s.k}</span>
            </div>
          );
        })}
        <div className="seg rest" style={{ left: '81%', width: '19%', ['--i' as string]: 4 }}>
          <b>19%</b>
          <span>Everything else</span>
        </div>
        <div className="brace" style={{ width: '81%' }}>
          <span>
            <CountUp to={81} ms={1500} />% is moving information around
          </span>
        </div>
      </div>
      <div className="b6-facts">
        {[
          ['Most common app', 'Google Sheets'],
          ['Tools in a typical automation', '3'],
          ['Run on a schedule', '8%'],
          ['Have an AI step', '4.2%, and growing fastest'],
        ].map(([k, v]) => (
          <div key={k}>
            <span className="dk-k">{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <p className="b6-quote">
        “AI earns a step when the work needs judgment.” <span className="dk-attr">Wade Foster, Zapier</span>
      </p>
      <Src>Source: Wade Foster on what 20M+ Zapier workflows automate, 2026. Percentages as reported.</Src>
    </Frame>
  );
};

/* ---------- delete, code, agent or human ---------- */
type L = 'delete' | 'code' | 'agent' | 'human';
const LBL: Record<L | 'q', string> = { q: '?', delete: 'Delete', code: 'Plain rule', agent: 'Agent', human: 'Human' };
const CYCLE: (L | 'q')[] = ['q', 'delete', 'code', 'agent', 'human'];
const PROC: { t: string; a: L; why: string }[] = [
  { t: 'Invoice arrives in the shared inbox', a: 'code', why: 'An inbox rule files it. No judgement needed.' },
  { t: 'Someone prints it for the manager', a: 'delete', why: 'Nobody reads the printout.' },
  { t: 'Type supplier, amount and due date into the accounts', a: 'agent', why: 'Reads any layout of PDF and fills a draft bill.' },
  { t: 'Check it against the purchase order', a: 'agent', why: 'Flags mismatches for a person to look at.' },
  { t: 'Chase a missing PO number', a: 'agent', why: 'Drafts the email. A person sends it.' },
  { t: 'Approve the payment', a: 'human', why: 'Money leaves the business. Always a person.' },
  { t: 'Enter it again in the job spreadsheet', a: 'delete', why: 'Double entry. The accounts are the record.' },
  { t: 'File the PDF in the job folder', a: 'code', why: 'Same rule, every time.' },
];
const Redesign: Page = () => {
  const [pick, setPick] = useState<(L | 'q')[]>(PROC.map(() => 'q'));
  const [shown, setShown] = useState(false);
  return (
    <Frame label="Delete, rule, agent or human">
      <Head
        eb={eb('repeat', 'Repeatable · redesign first')}
        title="Before you automate, label every step"
        sum="Map the job as it is today. Label each step: delete it, a plain rule, an agent, or a human decision. Click to label with the room, then show the redesign."
      />
      <PageNo />
      <div className="b6-proc">
        <div className="hd">
          <span className="dk-k">Paying a supplier invoice, today</span>
          <span className="dk-k">Label</span>
        </div>
        {PROC.map((p, i) => {
          const l = shown ? p.a : pick[i];
          return (
            <div key={p.t} className={`row l-${l}`}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="t">{p.t}</span>
              <button
                type="button"
                className={`lb l-${l}`}
                onClick={() => {
                  if (shown) return;
                  const n = [...pick];
                  n[i] = CYCLE[(CYCLE.indexOf(pick[i]) + 1) % CYCLE.length];
                  setPick(n);
                }}
              >
                {LBL[l]}
              </button>
              {shown && <span className="why">{p.why}</span>}
            </div>
          );
        })}
      </div>
      <div className="b6-proc-side">
        <div className="num">
          <b>{shown ? '$6' : '$31'}</b>
          <span>{shown ? 'cost per invoice, redesigned' : 'cost per invoice, today'}</span>
        </div>
        <p className="dk-body" style={{ fontSize: '1.3cqw' }}>
          {shown ? (
            <>
              Two steps deleted, two plain rules, three agent steps, one human decision. <Hl>The human step is the one that matters.</Hl>
            </>
          ) : (
            'Most of the saving comes from the steps you delete, not the ones you automate.'
          )}
        </p>
        <div className="pbtns">
          <button className="rb primary" type="button" onClick={() => setShown(true)}>
            Show the redesign
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              setShown(false);
              setPick(PROC.map(() => 'q'));
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <Src>Cost figures: an accounts-payable example from a forward-deployed-engineering masterclass (Greg Isenberg with Varick), 2026.</Src>
    </Frame>
  );
};

/* ---------- anatomy of a skill ---------- */
const SkillAnatomy: Page = () => (
  <Frame label="Anatomy of a skill">
    <Head
      eb={eb('repeat', 'Repeatable · skills')}
      title="A skill is a method, written down"
      sum="A short text file: when to use it, the steps, the checks, one good example. The app reads the description and loads the rest only when the job comes up."
    />
    <PageNo />
    <div className="b6-skill">
      <div className="sk">
        <div className="fh">quote-follow-up/SKILL.md</div>
        <pre>
          <span className="g a">{`---
name: quote-follow-up
description: Use after a site visit, to write the
  client's recap email and the quote cover note.
---`}</span>
          <span className="g b">{`1. Read the site notes and the client's history.
2. Recap in three parts: what we found, what
   happens next, what we need from you.
3. Every price comes from services-and-prices.md.
4. Match voice.md. Under 150 words.`}</span>
          <span className="g c">{`## Check before you hand it over
- Every price is in services-and-prices.md
- Every date is one somebody actually said
- Flag anything you guessed`}</span>
          <span className="g d">{`## Example
examples/ashby-rd-recap.md`}</span>
        </pre>
      </div>
      <div className="notes">
        {[
          ['a', 'When to use it', 'The app reads this line to decide whether the skill fits the job. Write it like you would brief a new starter.'],
          ['b', 'The steps', 'The method you already use. Short, numbered, in your words.'],
          ['c', 'The checks', 'What it must verify before it shows you anything. This is where quality comes from.'],
          ['d', 'One good example', 'One real example beats ten rules.'],
        ].map(([g, k, t]) => (
          <div key={g} className={`n g-${g}`}>
            <b>{k}</b>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  </Frame>
);

/* ---------- where skills live ---------- */
const WhereSkills: Page = () => (
  <Frame label="Where skills live">
    <Head
      eb={eb('repeat', 'Repeatable · where they live')}
      title="Same file, both apps"
      sum="Skills use the same SKILL.md format in ChatGPT and Claude, so a method you write once travels with you. Connectors plug in your apps; plugins bundle skills and connectors together."
    />
    <PageNo />
    <Split
      top="16.4cqw"
      left={
        <>
          <SideLabel name="OpenAI · ChatGPT + Codex" sub="check names each cohort" />
          <div className="b2-conn">
            {[
              ['Skills', 'Make one from a chat, or upload a skill folder'],
              ['Codex', 'A skills folder inside the project'],
              ['Connectors', 'Settings → Apps: email, files, calendar, more'],
              ['Plugins', 'Skills and connectors bundled for one job'],
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
              ['Skills', 'Settings → Capabilities → Skills, or ask Claude to make one'],
              ['Code', 'A skills folder inside the project'],
              ['Connectors', 'Settings → Connectors: email, files, calendar, more'],
              ['Plugins', 'Skills and connectors bundled for one job'],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="dk-k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="handnote" style={{ right: '3.4cqw', bottom: '2.4cqw' }}>
            one SKILL.md, two apps
          </div>
        </>
      }
    />
  </Frame>
);

/* ---------- a one-off becomes a method ---------- */
const OneOff: Page = () => {
  const on = usePlay(100);
  return (
    <Frame label="A one-off becomes a method">
      <Head
        eb={eb('repeat', 'Repeatable · a real story')}
        title="One good job, saved as a method"
        sum="From the instructor's own work: a long document review that went well became a skill, and then everyone's checklist got better."
      />
      <PageNo />
      <div className={`b6-story ${on ? '' : 'pre'}`}>
        {[
          ['One long review', 'A long procedure, more than 100 findings, each one tied to a page number you can check.'],
          ['The method, written down', 'How to read it, what to flag, how to word a finding, what to check twice. Saved as a skill.'],
          ['The next review', 'Starts from the method instead of a blank page. Same standard, every time.'],
          ['Shared', 'The lessons became 22 new rows in a colleague’s review checklist.'],
        ].map(([t, d], i) => (
          <div key={t} className="dk-fade" style={{ ['--i' as string]: i * 2 }}>
            <span className="dk-k">{String(i + 1).padStart(2, '0')}</span>
            <b>{t}</b>
            <span>{d}</span>
          </div>
        ))}
      </div>
      <div className="b6-callback">
        <span className="dk-k">Callback</span>
        <p>
          The brand file you wrote before lunch, with “check this against my brand file”? <Hl>That was your first skill.</Hl>
        </p>
      </div>
    </Frame>
  );
};

/* ---------- test it on new input ---------- */
const TESTS = [
  { t: 'Boundary survey, Ashby Rd', ok: true },
  { t: 'Feature survey past Mandurah', ok: false, why: 'Left out the travel charge.' },
  { t: 'Strata enquiry', ok: true },
  { t: 'Repeat client, two lots', ok: true },
  { t: 'Urgent: fencer starts Monday', ok: true },
];
const TestIt: Page = () => {
  const active = useIsActivePage();
  const [fixed, setFixed] = useState(false);
  const [n, setN] = useState(active ? 0 : TESTS.length);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    if (n >= TESTS.length) {
      setRun(false);
      return;
    }
    const t = setTimeout(() => setN((x) => x + 1), 450);
    return () => clearTimeout(t);
  }, [run, n]);
  const pass = TESTS.slice(0, n).filter((t) => t.ok || fixed).length;
  return (
    <Frame label="Test it on new input">
      <Head
        eb={eb('repeat', 'Repeatable · test it')}
        title="Keep five past jobs with the right answers"
        sum="Before you trust a skill, run it on five old jobs where you know what good looks like. When one fails, fix the skill, not the answer."
      />
      <PageNo />
      <div className="b6-tests">
        {TESTS.map((t, i) => {
          const done = i < n;
          const ok = t.ok || fixed;
          return (
            <div key={t.t} className={`row ${done ? (ok ? 'ok' : 'bad') : ''}`}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="t">{t.t}</span>
              <span className={`st ${done ? (ok ? 'ok' : 'bad') : 'mu'}`}>{done ? (ok ? 'Pass' : 'Fail') : 'Not run'}</span>
              {done && !ok && <span className="why">{t.why}</span>}
            </div>
          );
        })}
      </div>
      <div className="b6-tests-side">
        <div className="num">
          <b>
            {pass}
            <span className="dk-muted"> / {TESTS.length}</span>
          </b>
          <span>passing</span>
        </div>
        {fixed && (
          <div className="b6-fix">
            <span className="dk-k">Added to SKILL.md</span>
            <code>4. If the site is past Mandurah, add travel from services-and-prices.md.</code>
          </div>
        )}
        <div className="pbtns">
          <button
            className="rb primary"
            type="button"
            onClick={() => {
              setN(0);
              setRun(true);
            }}
          >
            {n === 0 ? 'Run the tests' : 'Run again'}
          </button>
          <button className="rb" type="button" disabled={fixed || n < TESTS.length} onClick={() => setFixed(true)}>
            Fix the skill
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              setFixed(false);
              setN(0);
              setRun(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <Src>The test-list idea comes from Meta's “organisational second brain” write-up: keep past questions with their right answers.</Src>
    </Frame>
  );
};

const Live = live({
  block: 'repeat',
  title: 'This morning’s job, saved as a skill',
  minutes: 5,
  backup: () => SkillAnatomy,
  apps: [
    {
      who: 'openai',
      app: 'ChatGPT desktop',
      mode: 'Chat',
      steps: [
        'Open the Ridgeline chat from this morning. “Turn what we just did into a skill called quote-follow-up. Include the checks.”',
        'Save it. New chat, new site notes: does it pick the skill up by itself?',
      ],
    },
    {
      who: 'claude',
      app: 'Claude desktop',
      mode: 'Chat',
      steps: [
        'Same request in the Claude Project chat. Compare the two SKILL.md files side by side.',
        'Install it, then run one of the five test jobs.',
      ],
    },
  ],
});

const Lab5 = lab({
  id: 'lab5',
  n: 5,
  block: 'repeat',
  minutes: 20,
  title: 'Turn your task into a skill',
  goal: 'Take a job that went well today and save the method as a skill. Then run it on an example it has not seen.',
  done: 'The skill ran on a new example, and you checked the result against what you would have done.',
  keep: 'The skill. It is your first L5 workflow.',
  openai: [
    <>
      In the chat where the job went well: <span className="dk-say">Turn what we did into a skill. Name it, say when to use it, list the steps and the checks.</span>
    </>,
    'Save it as a skill in ChatGPT (or in the skills folder, in Codex).',
    'New chat, new input. Does it use the skill without being told?',
    'Something wrong? Fix the skill, not the output. Run it again.',
  ],
  claude: [
    <>
      In the chat where the job went well: <span className="dk-say">Turn what we did into a skill. Name it, say when to use it, list the steps and the checks.</span>
    </>,
    'Save it: Settings → Capabilities → Skills.',
    'New chat, new input. Does it use the skill without being told?',
    'Something wrong? Fix the skill, not the output. Run it again.',
  ],
  hand: 'fix the skill, not the answer',
});

export const pages: [Page, string][] = [
  [Open, '14:00 · Block 6 opener. Forty-five minutes, ending in a 20-minute lab. Then the afternoon break.'],
  [
    Boring,
    '3 min. Let the bar build. The point: the money is in moving information around, not in clever AI. AI earns a step only where judgement is needed.',
  ],
  [
    Redesign,
    '5 min. Ask the room to label each step; click to set their answer. Then "Show the redesign". Two steps get deleted outright. The single human step is the payment approval.',
  ],
  [
    SkillAnatomy,
    '3 min. Walk the four coloured parts. The description line matters most: it is how the app knows when to use the skill.',
  ],
  [
    WhereSkills,
    '3 min. Same file format in both apps. Check menu names against the live apps before each cohort; they move.',
  ],
  [
    OneOff,
    '3 min. Your own story. Keep the details anonymous. End on the callback: they already made a skill this morning.',
  ],
  [
    TestIt,
    '3 min. Run the tests, let test 2 fail, press "Fix the skill", then run again. The lesson: fix the method, not the output, and keep a small test list.',
  ],
  [
    Live,
    '5 min. Use the Ridgeline chats from Block 3. If time is tight, do ChatGPT live and show the Claude skill already made.',
  ],
  [
    Lab5,
    '20 min. Start the timer. Common snag: the skill is too long. Tell them to cut it to what they would tell a new starter in two minutes.',
  ],
];
