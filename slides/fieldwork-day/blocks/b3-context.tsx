/* Block 3 · 10:00 · Context is everything. */
import type { Page } from '@open-slide/core';
import { Step, Steps } from '@open-slide/core';
import { useState } from 'react';
import { Frame, Hl, type Hotspot, InsetWindow, SideLabel, Split } from '@assets/fieldwork/brand';
import { Head, PageNo, Shot, Src, eb, lab, live, opener, usePlay } from '../kit';

const Open = opener(
  'context',
  'It only knows what you give it. Give it your business once, in a Project, and every answer after that starts from you instead of from average.',
);

/* ---------- how it works: the next word ---------- */
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

const NextWord: Page = () => {
  const [n, setN] = useState(0);
  const done = n >= STEPS_NW.length;
  const cur = STEPS_NW[Math.min(n, STEPS_NW.length - 1)];
  const max = Math.max(...cur.cands.map((c) => c[1]));
  return (
    <Frame label="How it works: one word at a time">
      <Head eb={eb('context', 'Context · how it works, in ten minutes')} title="It writes one likely word at a time" />
      <PageNo />
      <div className="b3-sent">
        <span className="dk-muted">Thanks for having us out on Tuesday. Your quote for the bathroom refit comes to </span>
        {STEPS_NW.slice(0, n).map((s, i) => (
          <span key={s.pick} className={`w ${i === 1 ? 'guess' : ''}`}>
            {s.pick}
            {s.pick === '$' ? '' : ' '}
          </span>
        ))}
        {!done && <span className="caret" />}
      </div>
      <div className="b3-bars">
        <span className="dk-k">{done ? 'Finished' : `Candidates for the next word · step ${n + 1} of ${STEPS_NW.length}`}</span>
        {cur.cands.map(([w, p]) => (
          <div key={`${n}-${w}`} className={`bar ${done && w === cur.pick ? 'picked' : ''}`}>
            <span className="w">{w}</span>
            <span className="track">
              <i style={{ width: `${(p / max) * 100}%`, opacity: done ? 0.25 : 1 }} />
            </span>
            <span className="p">{p}%</span>
          </div>
        ))}
      </div>
      <div className="b3-nw-side">
        <p className="dk-body" style={{ fontSize: '1.5cqw' }}>
          {done ? STEPS_NW[STEPS_NW.length - 1].note : cur.note}
        </p>
        <div className="pbtns">
          <button className="rb primary" type="button" onClick={() => setN((x) => Math.min(STEPS_NW.length, x + 1))} disabled={done}>
            Next word
          </button>
          <button className="rb" type="button" onClick={() => setN(0)}>
            Start again
          </button>
        </div>
        {done && (
          <p className="dk-body" style={{ fontSize: '1.5cqw' }}>
            So: <Hl>give it the price list.</Hl> That is what the rest of this block is about.
          </p>
        )}
      </div>
      <Src>Probabilities are illustrative. Real models choose from tens of thousands of word pieces at each step.</Src>
    </Frame>
  );
};

/* ---------- same idea, two names ---------- */
const ROWS = [
  { shared: 'Decide what to hand over', oa: 'Pick the task', an: 'Delegation', anx: 'what to hand over, and what to keep' },
  { shared: 'Give it what it needs', oa: 'Bring sources', an: 'Description', anx: 'the goal, the context, the format' },
  { shared: 'It does the first draft', oa: 'Draft', an: '(the model’s part)', anx: '' },
  { shared: 'Check it against the source', oa: 'Review', an: 'Discernment', anx: 'is it right, is it good' },
  { shared: 'Own the result', oa: 'You sign it', an: 'Diligence', anx: 'your name on it, so you answer for it' },
];
const SameIdea: Page = () => {
  const on = usePlay(120);
  return (
    <Frame label="Same idea, two names">
      <Head
        eb={eb('context', 'Context · the method')}
        title="One method, two names for it"
        sum="OpenAI teaches a three-step cycle. Anthropic teaches four Ds. They describe the same habit, and it is the habit for the whole day."
      />
      <PageNo />
      <Split
        top="16.4cqw"
        left={
          <>
            <SideLabel name="OpenAI · the cycle" sub="bring sources → draft → review" />
            <div className={`b3-rows ${on ? '' : 'pre'}`}>
              {ROWS.map((r, i) => (
                <div key={r.shared} className="dk-fade" style={{ ['--i' as string]: i }}>
                  <span className="dk-k">
                    {i + 1} · {r.shared}
                  </span>
                  <b className={i === 2 ? 'dk-muted' : ''}>{r.oa}</b>
                </div>
              ))}
            </div>
          </>
        }
        right={
          <>
            <SideLabel name="Anthropic · the 4Ds" sub="AI Fluency course" />
            <div className={`b3-rows ${on ? '' : 'pre'}`}>
              {ROWS.map((r, i) => (
                <div key={r.shared} className="dk-fade" style={{ ['--i' as string]: i + 5 }}>
                  <b className={i === 2 ? 'dk-muted' : ''}>{r.an}</b>
                  {r.anx && <span className="x">{r.anx}</span>}
                </div>
              ))}
            </div>
          </>
        }
      />
    </Frame>
  );
};

/* ---------- the context dial ---------- */
type Seg = [string, number?];
const DIAL = [
  { k: 'Just the ask', d: '“Write a follow-up email to the client after yesterday’s site visit.”' },
  { k: '+ Your Project', d: 'Who you are, who you work for, how you talk.' },
  { k: '+ The source', d: 'Your notes from the site visit.' },
  { k: '+ An example you liked', d: 'One past email you were happy with.' },
];
const EMAILS: { subj: Seg[]; body: Seg[][] }[] = [
  {
    subj: [['Following up on our recent visit']],
    body: [
      [['Dear [Client Name],']],
      [['Thank you for taking the time to meet with us yesterday. It was a pleasure discussing your project, and we are excited about the opportunity to work with you.']],
      [['We will be in touch shortly with next steps. Please don’t hesitate to reach out if you have any questions.']],
      [['Best regards,'], ['\n[Your Name]']],
    ],
  },
  {
    subj: [['Your '], ['boundary survey', 1], [' – next steps']],
    body: [
      [['Hi '], ['Anna', 1], [',']],
      [['Thanks for having us out yesterday. '], ['Ridgeline', 1], [' will prepare a quote for the boundary survey and send it '], ['within two working days', 1], ['.']],
      [['Any questions in the meantime, just reply to this email.']],
      [['Cheers,', 1], ['\nJess Tran, Licensed Surveyor', 1]],
    ],
  },
  {
    subj: [['14 Ashby Rd', 2], [' – '], ['boundary survey', 1], [' next steps']],
    body: [
      [['Hi '], ['Anna', 1], [',']],
      [['Thanks for walking the block with me yesterday. Quick recap: '], ['two of the four boundary pegs are missing (NE and SE corners)', 2], ['. '], ['The eastern fence may sit up to 0.4 m inside your boundary', 2], ['; the survey will confirm it.']],
      [['I’ll send the quote '], ['by Thursday', 2], [' so we can survey '], ['before your fencer starts on the 21st', 2], ['.']],
      [['Cheers,', 1], ['\nJess', 1]],
    ],
  },
  {
    subj: [['14 Ashby Rd', 2], [' – '], ['what we found and what’s next', 3]],
    body: [
      [['Hi '], ['Anna', 1], [',']],
      [['What we found: ', 3], ['two boundary pegs missing (NE and SE corners)', 2], ['. '], ['The eastern fence may sit up to 0.4 m inside your boundary', 2], ['.']],
      [['What happens next: ', 3], ['quote by Thursday', 2], [', survey next week, '], ['before your fencer starts on the 21st', 2], ['.']],
      [['What we need from you: ', 3], ['your Certificate of Title, if it’s handy.', 3]],
      [['Cheers,', 1], ['\nJess', 1]],
    ],
  },
];

const Segs = ({ segs, level }: { segs: Seg[]; level: number }) => (
  <>
    {segs.map(([t, k], i) => (
      <span key={i} className={k ? (k === level ? 'new' : 'old') : ''}>
        {t}
      </span>
    ))}
  </>
);

export const ContextDial: Page = () => {
  const [lv, setLv] = useState(0);
  const e = EMAILS[lv];
  return (
    <Frame label="The context dial">
      <Head
        eb={eb('context', 'Context · the dial')}
        title="Same ask. Turn up the context"
        sum="Same model, same request. The only thing that changes is what it knows. Click down the dial."
      />
      <PageNo />
      <div className="b3-dial" data-osd-interactive>
        <span className="dk-k">What it knows</span>
        {DIAL.map((d, i) => (
          <button key={d.k} type="button" className={`${i === lv ? 'on' : ''} ${i < lv ? 'past' : ''}`} onClick={() => setLv(i)}>
            <i>{i}</i>
            <b>{d.k}</b>
            <span>{d.d}</span>
          </button>
        ))}
        <p className="dk-body dk-muted" style={{ marginTop: '.8cqw', fontSize: '1.05cqw' }}>
          In ChatGPT and in Claude, steps 1 and 3 live in a <b>Project</b>: instructions plus files. You set them once.
        </p>
      </div>
      <div className="b3-mail" key={lv}>
        <div className="sub">
          <span className="dk-k">Subject</span>
          <b>
            <Segs segs={e.subj} level={lv} />
          </b>
        </div>
        {e.body.map((p, i) => (
          <p key={i}>
            <Segs segs={p} level={lv} />
          </p>
        ))}
      </div>
      <div className="b3-mail-key">
        <span>
          <i className="new" /> from the step you just added
        </span>
        <span>
          <i className="old" /> from earlier steps
        </span>
        <span>Ridgeline Surveying is a made-up business.</span>
      </div>
    </Frame>
  );
};

/* ---------- where context lives ---------- */
const ProjBody = ({ files, inst }: { files: string; inst: string }) => (
  <div className="b3-proj">
    <div className="col">
      <div className="mlab">{inst}</div>
      <div className="task" style={{ fontSize: '.78cqw', lineHeight: 1.4 }}>
        You work for Ridgeline Surveying, licensed surveyors in Perth. Write in plain Australian English, first names, short
        paragraphs. Always use our price list. Never promise a date we haven't confirmed.
      </div>
    </div>
    <div className="col">
      <div className="mlab">{files}</div>
      {['about.md', 'services-and-prices.md', 'voice.md', 'faqs.md', 'past-emails.pdf'].map((f) => (
        <div key={f} className="file">
          {f}
        </div>
      ))}
    </div>
    <div className="col">
      <div className="mlab">Chats in this project</div>
      {['Follow-up: 14 Ashby Rd', 'Quote: feature survey, Mandurah', 'Reply to strata manager'].map((c) => (
        <div key={c} className="file">
          {c}
        </div>
      ))}
    </div>
  </div>
);
const PROJ_HOTS: Hotspot[] = [
  { x: 26, y: 40, k: 'Instructions', t: 'How it should write and what it must always or never do. Five lines is plenty.' },
  { x: 57, y: 45, k: 'Files', t: 'Your price list, services, FAQs, good past emails. It reads these before it answers.' },
  { x: 86, y: 34, k: 'Chats', t: 'Every new chat inside the project starts knowing all of the above.' },
];
const WhereContext: Page = () => (
  <Frame label="Where context lives">
    <Head
      eb={eb('context', 'Context · Projects')}
      title="Where it lives: a Project"
      sum="Both apps have Projects: a folder of instructions and files that every chat inside it starts from. Click the numbers."
    />
    <PageNo />
    <Split
      top="15.4cqw"
      left={
        <>
          <SideLabel name="OpenAI · ChatGPT" sub="Projects, in the sidebar" />
          <InsetWindow title="ChatGPT desktop · Project: Ridgeline" tabs={['Chats', 'Projects', 'Ridgeline']} active="Ridgeline" height={24} hots={PROJ_HOTS}>
            <ProjBody inst="Instructions" files="Files" />
          </InsetWindow>
          <div className="mapline">
            Sidebar → <b>New project</b> → add files and instructions
          </div>
        </>
      }
      right={
        <>
          <SideLabel name="Claude" sub="Projects, in the sidebar" />
          <InsetWindow title="Claude desktop · Project: Ridgeline" tabs={['Chats', 'Projects', 'Ridgeline']} active="Ridgeline" height={24} hots={PROJ_HOTS}>
            <ProjBody inst="Project instructions" files="Project knowledge" />
          </InsetWindow>
          <div className="mapline">Projects → Create → instructions + knowledge</div>
        </>
      }
    />
  </Frame>
);

/* ---------- the starter pack ---------- */
const PACK = [
  ['about.md', 'Who you are', 'Ridgeline Surveying. Licensed surveyors, Perth metro and Peel. Six staff. Since 2011.'],
  ['services-and-prices.md', 'What you sell, for how much', 'Boundary re-establishment from $1,450 + GST. Feature survey from $1,900 + GST. Travel past Mandurah quoted.'],
  ['voice.md', 'How you sound', 'Plain Australian English. First names. No “Dear Sir”. Short paragraphs. Sign off “Cheers”.'],
  ['faqs.md', 'What customers ask', 'How long does a boundary survey take? Usually 5–7 working days from booking.'],
  ['examples/', 'Work you were proud of', 'Three past emails and two quotes. It copies the shape of what it sees.'],
  ['corrections.md', 'Every fix, written down', '“We don’t do strata plans. Refer them to …” Each fix becomes a rule, so you make it once.'],
];
const StarterPack: Page = () => {
  const on = usePlay(100);
  return (
    <Frame label="Your business Project: the starter pack">
      <Head
        eb={eb('context', 'Context · what goes in')}
        title="Six plain files. A page each"
        sum="Write your expertise down as plain text, once. It beats clever prompts every time, and it works in both apps."
      />
      <PageNo />
      <div className={`b3-pack ${on ? '' : 'pre'}`}>
        {PACK.map(([f, k, ex], i) => (
          <div key={f} className="dk-tile dk-fade" style={{ ['--i' as string]: i }}>
            <span className="fn">{f}</span>
            <b>{k}</b>
            <span className="ex">{ex}</span>
          </div>
        ))}
      </div>
      <Src>
        The corrections log idea comes from Meta's write-up on building an “organisational second brain”, scaled down to one
        business.
      </Src>
    </Frame>
  );
};

/* ---------- the deck builder ---------- */
const DeckStory: Page = () => (
  <Frame label="A deck builder and a voice recorder">
    <Head
      eb={eb('context', 'Context · a real story')}
      title="A deck builder, a voice recorder, and no clever prompts"
      sum="A deck-building business owner shared how their quoting works now. No integrations, no code. Just good context, every time."
    />
    <PageNo />
    <div className="b3-story">
      <Steps>
        <Step>
          <div>
            <span className="dk-k">On site</span>
            <b>Records the site visit</b>
            <span>A clip-on voice recorder. Every measurement is said out loud while walking the site.</span>
          </div>
        </Step>
        <Step>
          <div>
            <span className="dk-k">In the ute</span>
            <b>Pastes it all in</b>
            <span>The transcript, plus the client's call history, into ChatGPT.</span>
          </div>
        </Step>
        <Step>
          <div>
            <span className="dk-k">5 minutes</span>
            <b>Recap email sent</b>
            <span>The client gets a recap of everything agreed before the ute has left the street.</span>
          </div>
        </Step>
        <Step>
          <div>
            <span className="dk-k">That night</span>
            <b>Proposal drafted</b>
            <span>“Referencing my previous proposals.” Past work is the template.</span>
          </div>
        </Step>
        <Step>
          <div className="res">
            <span className="dk-k">4–6 weeks</span>
            <b>A few hundred thousand dollars of new sales</b>
            <span>
              “I still don't know what an MCP is.”
            </span>
          </div>
        </Step>
      </Steps>
    </div>
    <span className="dk-k b3-photos-cap">From the post</span>
    <div className="b3-photos">
      {['wcd-1', 'wcd-2', 'wcd-3', 'wcd-4'].map((id) => (
        <Shot key={id} id={id} className="sm" />
      ))}
    </div>
    <Src>Source: Jameson Haslam (West Coast Deck), public post on X, Oct 2026. Figures as reported in the post.</Src>
  </Frame>
);

const Live = live({
  block: 'context',
  title: 'Build a Project in front of you',
  minutes: 5,
  backup: () => ContextDial,
  apps: [
    {
      who: 'openai',
      app: 'ChatGPT desktop',
      mode: 'Projects',
      steps: [
        'New project: “Ridgeline”. Drop in about.md, services-and-prices.md and voice.md.',
        'Paste the five-line instructions.',
        'Ask: “Write a follow-up email to the client after yesterday’s site visit.” Attach the site notes.',
      ],
    },
    {
      who: 'claude',
      app: 'Claude desktop',
      mode: 'Projects',
      steps: [
        'Create project “Ridgeline”. Add the same files to Project knowledge.',
        'Same instructions, same ask, same notes.',
        'Put both emails side by side with the one from “just the ask”.',
      ],
    },
  ],
});

const Lab2 = lab({
  id: 'lab2',
  n: 2,
  block: 'context',
  minutes: 20,
  title: 'Build your business Project',
  goal: 'Set up a Project that knows your business, so every chat from now on starts from you.',
  done: 'You asked it a question a customer asked you this week, and the answer used your prices and sounded like you.',
  keep: 'The Project. Every lab after this one runs inside it.',
  openai: [
    <>
      Sidebar → <b>New project</b>. Name it after your business.
    </>,
    'Add what you already have: price list, services page, a few good emails. Photos of paper are fine.',
    'Instructions, five lines: who you are, who your customers are, how you talk, one thing it must always do, one it must never do.',
    'Test it with a real customer question from this week. Fix the files, not the question.',
  ],
  claude: [
    <>
      Projects → <b>Create project</b>. Name it after your business.
    </>,
    'Add what you already have to Project knowledge: price list, services page, a few good emails.',
    'Project instructions, five lines: who you are, your customers, how you talk, one always, one never.',
    'Test it with a real customer question from this week. Fix the files, not the question.',
  ],
  hand: 'a page each is plenty',
});

export const pages: [Page, string][] = [
  [Open, '10:00 · Block 3 opener. Forty-five minutes, ending in a 20-minute lab. Then the break.'],
  [
    NextWord,
    '4 min. Click "Next word" four times. Stop on step 2 and make the point: when the bars are flat, it is guessing, and it does not say so. Finish: "It has never seen your price list." That line sets up the whole block.',
  ],
  [
    SameIdea,
    '3 min. The two vendors teach the same method with different words. Point at row 2 and row 4: giving it what it needs, and checking against the source. Those two are where owners win or lose.',
  ],
  [
    ContextDial,
    '4 min. Click 0, 1, 2, 3 in order and read the subject line each time. Yellow is what the step you just added changed. At 0 it is a template; at 3 it is an email you would actually send. The made-up business is a surveyor; swap the example for your audience if you like.',
  ],
  [
    WhereContext,
    '3 min. Click 1, 2, 3 in both windows. Same three parts in both apps: instructions, files, chats that inherit both. The words differ ("files" versus "project knowledge").',
  ],
  [
    StarterPack,
    '3 min. Six files, a page each. Dwell on corrections.md: every time it gets something wrong, write the fix down once. That is how it gets better without you repeating yourself.',
  ],
  [
    DeckStory,
    '3 min. Press → to build it up. The point: no integrations, no MCP, just context. Record the site visit, paste the transcript and the call history, and use past proposals as the template. Read the last quote with a straight face.',
  ],
  [
    Live,
    '5 min. Have the Ridgeline files ready in a folder on the desktop. Build both Projects quickly. If time is short, build one and show the other already made.',
  ],
  [
    Lab2,
    '20 min. Start the timer. Most common snag: people have no files ready. Tell them to type the five-line instructions and paste their website’s services page. That is enough for now. Break at 10:45.',
  ],
];
