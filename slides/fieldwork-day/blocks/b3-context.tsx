/* Block 3 · 10:00 · Context is everything. */
import type { Page } from '@open-slide/core';
import { Step, Steps, useIsActivePage } from '@open-slide/core';
import { Frame, type Hotspot, InsetWindow, SideLabel, Split } from '@assets/fieldwork/brand';
import { Head, PageNo, Shot, Src, eb, lab, live, opener, usePlay } from '../kit';
import { BeatSteps } from '../stage/beats';
import { ContextMail, LEVELS } from '../stage/context-mail';
import { NextWordRun, WORDS } from '../stage/next-word';
import { useBeats } from '../stage/staged';

const Open = opener(
  'context',
  'It only knows what you give it. Give it your business once, in a Project, and every answer after that starts from you instead of from average.',
);

/* ---------- how it works: the next word (staged in stage/next-word.tsx) ---------- */
const NextWord: Page = () => {
  const active = useIsActivePage();
  const { beat, onBeat, pick, take } = useBeats(WORDS);
  return (
    <Frame label="How it works: one word at a time">
      <BeatSteps count={WORDS - 1} onBeat={onBeat} />
      <Head eb={eb('context', 'Context · how it works, in ten minutes')} title="It writes one likely word at a time" />
      <PageNo />
      <div className="b3-nw-stage" data-osd-interactive>
        <NextWordRun beat={beat} take={take} live={active} go={pick} />
      </div>
      <Src>Probabilities are illustrative. Real models choose from tens of thousands of word pieces at each step.</Src>
    </Frame>
  );
};

/* ---------- the context dial (the email is staged in stage/context-mail.tsx) ---------- */
const DIAL = [
  { k: 'Just the ask', d: '“Write a follow-up email to the client after yesterday’s site visit.”' },
  { k: '+ Your Project', d: 'Who you are, who you work for, how you talk.' },
  { k: '+ The source', d: 'Your notes from the site visit.' },
  { k: '+ An example you liked', d: 'One past email you were happy with.' },
];

export const ContextDial: Page = () => {
  const active = useIsActivePage();
  const { beat: lv, onBeat, pick, take } = useBeats(LEVELS);
  return (
    <Frame label="The context dial">
      <BeatSteps count={LEVELS - 1} onBeat={onBeat} />
      <Head
        eb={eb('context', 'Context · the dial')}
        title="Same ask. Turn up the context"
        sum="Same model, same request. The only thing that changes is what it knows. Click down the dial."
      />
      <PageNo />
      <div className="b3-dial" data-osd-interactive>
        <span className="dk-k">What it knows</span>
        {DIAL.map((d, i) => (
          <button key={d.k} type="button" className={`${i === lv ? 'on' : ''} ${i < lv ? 'past' : ''}`} onClick={() => pick(i)}>
            <i>{i}</i>
            <b>{d.k}</b>
            <span>{d.d}</span>
          </button>
        ))}
        <p className="dk-body dk-muted" style={{ marginTop: '.8cqw', fontSize: '1.05cqw' }}>
          In ChatGPT and in Claude, steps 1 and 3 live in a <b>Project</b>: instructions plus files. You set them once.
        </p>
      </div>
      <div className="b3-mail-stage">
        <ContextMail level={lv} take={take} live={active} />
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
      <div className="task b3-inst">
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
            <span className="dk-k">Afterwards</span>
            <b>Pastes it all in</b>
            <span>The transcript, plus the client's call history, into ChatGPT.</span>
          </div>
        </Step>
        <Step>
          <div>
            <span className="dk-k">5 minutes</span>
            <b>Recap email sent</b>
            <span>The client gets a recap of everything agreed, about five minutes after the visit.</span>
          </div>
        </Step>
        <Step>
          <div>
            <span className="dk-k">Then</span>
            <b>Proposal drafted</b>
            <span>“Referencing my previous proposals.” Past work is the template.</span>
          </div>
        </Step>
        <Step>
          <div className="res">
            <span className="dk-k">4–6 weeks</span>
            <b>A few hundred thousand dollars of new sales</b>
            <span>
              “I still don't know what an MCP is.” (An MCP is the plumbing that connects apps. He never needed it.)
            </span>
          </div>
        </Step>
      </Steps>
    </div>
    <span className="dk-k b3-photos-cap">From the post, on the owner’s phone</span>
    <div className="b3-photos">
      {[
        ['wcd-2', 'The ask, with the transcript'],
        ['wcd-3', 'Every site visit, recorded'],
        ['wcd-4', 'The scope of work it drafted'],
      ].map(([id, c]) => (
        <figure key={id}>
          <Shot id={id} className="sm" />
          <figcaption>{c}</figcaption>
        </figure>
      ))}
    </div>
    <Src>Source: Jameson Haslam (West Coast Deck), public post on X, Oct 2026. Figures as reported in the post.</Src>
  </Frame>
);

const Live = live({
  block: 'context',
  title: 'Build a Project in front of you',
  minutes: 4,
  backup: () => ContextDial,
  liveIn: 'claude',
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
      ready: 'The Ridgeline project, built before the day with the same three files and the same five lines. Open it, show the instructions and the files, and put its email beside the live one.',
    },
    {
      who: 'claude',
      app: 'Claude desktop',
      mode: 'Projects',
      steps: [
        'Create project “Ridgeline”. Add the same files to Project knowledge.',
        'Paste the five-line instructions.',
        'Ask: “Write a follow-up email to the client after yesterday’s site visit.” Attach the site notes.',
        'Put the email beside the one from “just the ask”, and beside the ChatGPT one.',
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
    'Add what you brought: your price list, services page and a few good past emails. Photos of paper are fine.',
    'Instructions, five lines: who you are, who your customers are, how you talk, one thing it must always do, one it must never do.',
    'Test it with a real customer question from this week. Fix the files, not the question.',
  ],
  claude: [
    <>
      Projects → <b>Create project</b>. Name it after your business.
    </>,
    'Add what you brought to Project knowledge: your price list, services page and a few good past emails.',
    'Project instructions, five lines: who you are, your customers, how you talk, one always, one never.',
    'Test it with a real customer question from this week. Fix the files, not the question.',
  ],
  hand: 'a page each is plenty',
});

export const pages: [Page, string][] = [
  [Open, '10:00 · Block 3 opener. Forty-five minutes, ending in a 20-minute lab. Then the break.'],
  [
    NextWord,
    '4 min. The first word picks itself as the page opens: the bars grow, the highlight lands on "$" fast because it is far ahead. Click three times for the next three words. On the second, the bars are flat and the highlight wanders before it settles on a price: stop there and make the point. When the bars are flat, it is guessing, and it does not say so. The last click ends on "It has never seen your price list." That line sets up the whole block.',
  ],
  [
    ContextDial,
    '4 min. Level 0 writes itself as the page opens. Click three times for levels 1, 2 and 3: each click attaches that context to the draft and the email rewrites itself. Read the subject line each time. Yellow is what the step you just added changed. At 0 it is a template; at 3 it is an email you would actually send. The dial buttons jump to any level. The made-up business is a surveyor; swap the example for your audience if you like.',
  ],
  [
    WhereContext,
    '3 min. Click 1, 2, 3 in both windows. Clicking a number zooms in, which is how the room reads the small text. Same three parts in both apps: instructions, files, chats that inherit both. The words differ ("files" versus "project knowledge").',
  ],
  [
    StarterPack,
    '3 min. Six files, a page each. Dwell on corrections.md: every time it gets something wrong, write the fix down once. That is how it gets better without you repeating yourself.',
  ],
  [
    DeckStory,
    '3 min. Press → to build it up. The point: no integrations, no connectors, just context. Record the site visit, paste the transcript and the call history, and use past proposals as the template. The steps are as the owner posted them; the sales figure is his own. Nobody here needs to know what an MCP is either, which is the joke.',
  ],
  [
    Live,
    '4 min. Claude runs live this block; ChatGPT is open with the same Project already built. Have the Ridgeline files ready in a folder on the desktop. Build the one Project, ask for the email, then switch to the ready-made one and show that the parts are the same.',
  ],
  [
    Lab2,
    '20 min. Start the timer. The pre-work email asked everyone to bring a price list and a few past emails. Most common snag: someone did not. Tell them to type the five-line instructions and paste their website’s services page. That is enough for now. Break at 10:45.',
  ],
];
