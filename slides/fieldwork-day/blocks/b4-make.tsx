/* Block 4 · 11:00 · Making things that look good. Closes with "how this deck was made". */
// brand-check: ignore-colours, ignore-words (the AI-slop examples and the client site mocks break the brand on purpose)
import type { Page } from '@open-slide/core';
import { useIsActivePage } from '@open-slide/core';
import { type ReactNode, useEffect, useState } from 'react';
import { Chip, Frame, Hl, Mark, Pad, SideLabel, Split } from '@assets/fieldwork/brand';
import { Browser, Head, PageNo, Shot, Src, eb, lab, live, opener, usePlay } from '../kit';
import { BeatSteps } from '../stage/beats';
import { BEAT_COUNT as CHECK_BEATS, CheckRun } from '../stage/check-run';
import { BEAT_COUNT as ITER_BEATS, IterateRun, VERSIONS } from '../stage/iterate-run';
import { useBeats } from '../stage/staged';

const Open = opener(
  'make',
  'AI output looks like AI because it picks the likely choice. Learn to spot the tells, give it a point of view, and keep going past the first draft.',
);

/* ---------- spot the tells ---------- */
const TELLS = [
  { x: 9, y: 9, k: 'Gradient logo', fix: 'One solid colour. Your real logo, not a new one.' },
  { x: 50, y: 22, k: 'All-caps letter-spaced pill', fix: 'Say it plainly in the headline, or cut it.' },
  { x: 24, y: 36, k: 'Italic “fancy” heading', fix: 'One confident weight. No italics for drama.' },
  { x: 76, y: 44, k: 'Vague claim: “Supercharge”', fix: 'A real number or a real service: “Hot water fixed same day, from $180”.' },
  { x: 92, y: 30, k: 'Purple-to-blue gradient', fix: 'Your colours. Plain backgrounds.' },
  { x: 18, y: 72, k: 'Emoji as icons, three identical cards', fix: 'Three real services with prices, or one strong photo.' },
  { x: 50, y: 92, k: '“Scroll to explore”', fix: 'Nobody needs telling. Delete.' },
  { x: 63, y: 13, k: 'Sparkles ✨', fix: 'Means nothing. Delete.' },
];

const SlopSite = () => (
  <div className="b4-slop">
    <div className="nav">
      <b className="logo">Acme</b>
      <span>Services</span>
      <span>About</span>
      <span>Contact</span>
      <span className="glow">Get Started</span>
    </div>
    <div className="hero">
      <span className="pill">✦ AI-POWERED PLUMBING SOLUTIONS ✦</span>
      <h1>
        Experience the <i>Future</i> of Plumbing
      </h1>
      <p>Supercharge your home's water flow with cutting-edge solutions tailored to unlock your property's full potential.</p>
      <div className="btns">
        <span className="glow">Get Started ✨</span>
        <span className="ghost">Learn More</span>
      </div>
    </div>
    <div className="cards">
      {[
        ['🚀', 'Fast', 'Lightning-fast service that exceeds expectations.'],
        ['⚡', 'Reliable', 'Reliable solutions you can count on, every time.'],
        ['💧', 'Innovative', 'Innovative approaches for modern homes.'],
      ].map(([e, t, d]) => (
        <div key={t}>
          <span className="em">{e}</span>
          <b>{t}</b>
          <span>{d}</span>
        </div>
      ))}
    </div>
    <div className="scroll">Scroll to explore ↓</div>
  </div>
);

const SpotTells: Page = () => {
  const [found, setFound] = useState<number[]>([]);
  const [last, setLast] = useState<number | null>(null);
  const all = found.length === TELLS.length;
  return (
    <Frame label="Spot the tells">
      <Head
        eb={eb('make', 'Making things · the tells')}
        title="Spot the tells"
        sum="Ask any AI for “a website for a plumber” and you get the average of every website. Call out what gives it away. Click a number when someone spots one."
      />
      <PageNo />
      <div className="b4-tells-site">
        <Browser url="acme-plumbing.example" style={{ height: '100%' }}>
          <SlopSite />
          {TELLS.map((t, i) => (
            <button
              key={t.k}
              type="button"
              className={`hot b4-hot ${found.includes(i) ? 'found' : ''}`}
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              onClick={() => {
                setFound((f) => (f.includes(i) ? f : [...f, i]));
                setLast(i);
              }}
              aria-label={`Tell ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </Browser>
        <span className="b4-ex">Example of what not to do</span>
      </div>
      <div className="b4-tells-side">
        <div className="num">
          <b>
            {found.length}
            <span className="dk-muted"> / {TELLS.length}</span>
          </b>
          <span>tells found</span>
        </div>
        {last !== null && (
          <div className="b4-tell" key={last}>
            <span className="dk-k">
              {last + 1} · {TELLS[last].k}
            </span>
            <p>
              <b>Instead:</b> {TELLS[last].fix}
            </p>
          </div>
        )}
        <div className="pbtns">
          <button
            className="rb"
            type="button"
            onClick={() => {
              setFound(TELLS.map((_, i) => i));
              setLast(null);
            }}
          >
            Show all
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              setFound([]);
              setLast(null);
            }}
          >
            Reset
          </button>
        </div>
        {all && (
          <ul className="b4-all">
            {TELLS.map((t) => (
              <li key={t.k}>{t.k}</li>
            ))}
          </ul>
        )}
      </div>
      <Src>The tells list follows Hassan El Mghari (@nutlope), “Stop letting your agents ship ugly UIs”, 2026. Acme Plumbing is made up.</Src>
    </Frame>
  );
};

/* ---------- four moves ---------- */
const MOVES = [
  ['01', 'Give it references', 'Screenshots of three sites, posters or menus you like. Keep a folder of them. “Like these, for us.”'],
  ['02', 'Go broad, then sharpen', 'Ask for four different directions first. Pick one. Only then refine.'],
  ['03', 'Make it look at its work', '“Screenshot it, critique it like a designer, fix the top three problems.” Repeat.'],
  ['04', 'Then take things away', 'The last pass removes. Whatever is not helping a customer act goes.'],
];
const FourMoves: Page = () => {
  const on = usePlay(100);
  return (
    <Frame label="Four moves past the first draft">
      <Head
        eb={eb('make', 'Making things · the moves')}
        title="Four moves past the first draft"
        sum="Whatever it makes first is only the base. These four moves work in any app, for a website, a quote template or a flyer."
      />
      <PageNo />
      <div className={`b4-moves ${on ? '' : 'pre'}`}>
        {MOVES.map(([n, t, d], i) => (
          <div key={n} className="dk-fade" style={{ ['--i' as string]: i * 2 }}>
            <span className="dk-k">{n}</span>
            <b>{t}</b>
            <span>{d}</span>
          </div>
        ))}
      </div>
      <div className="b4-moves-tip">
        <span className="dk-k">And</span>
        <span>
          One or two changes per message. Long voice notes beat short typed prompts: record two minutes of what you want, and paste
          the transcript.
        </span>
      </div>
      <Src>After Lenny Rachitsky's guest post, “Turn your AI into a world-class designer”, and @nutlope's rules, 2026.</Src>
    </Frame>
  );
};

/* ---------- first draft to fifth: Ridgeline's site (staged in stage/iterate-run.tsx) ---------- */
export const FirstToFifth: Page = () => {
  const active = useIsActivePage();
  const { beat, onBeat, pick, take } = useBeats(ITER_BEATS);
  return (
    <Frame label="First draft to fifth">
      <BeatSteps count={ITER_BEATS - 1} onBeat={onBeat} />
      <Head eb={eb('make', 'Making things · iterate')} title="First draft to fifth, in five messages">
        <div className="steps" style={{ position: 'absolute', right: '3.6cqw', top: '5.6cqw' }}>
          {VERSIONS.map((_, i) => (
            <Chip key={i} n={i + 1} label={`v${i + 1}`} state={i === beat ? 'on' : i < beat ? 'past' : ''} onClick={() => pick(i)} />
          ))}
        </div>
      </Head>
      <PageNo />
      <div className="b4-iter-stage">
        <IterateRun beat={beat} take={take} live={active} />
      </div>
      <Src>Ridgeline Surveying, its prices and its phone number are made up. (08) 5550 xxxx is a range set aside for fiction.</Src>
    </Frame>
  );
};

/* ---------- what each app makes ---------- */
const Thumb = ({ kind }: { kind: 'doc' | 'sheet' | 'deck' | 'site' | 'app' }) => (
  <div className={`b4-th ${kind}`}>
    {kind === 'doc' && (
      <>
        <i className="h" />
        <i />
        <i />
        <i className="s" />
        <i />
      </>
    )}
    {kind === 'sheet' && Array.from({ length: 15 }, (_, i) => <i key={i} />)}
    {kind === 'deck' && (
      <>
        <i className="t" />
        <i className="b" />
      </>
    )}
    {kind === 'site' && (
      <>
        <i className="bar" />
        <i className="h" />
        <i className="c" />
        <i className="c" />
        <i className="c" />
      </>
    )}
    {kind === 'app' && (
      <>
        <i className="k" />
        <i className="k" />
        <i className="k" />
        <i className="g" />
      </>
    )}
  </div>
);
const MAKES: Record<'L' | 'R', [Parameters<typeof Thumb>[0]['kind'], string, string][]> = {
  L: [
    ['doc', 'Documents', 'Quotes, letters, one-pagers'],
    ['sheet', 'Spreadsheets', 'Real formulas, opens in Excel'],
    ['deck', 'Presentations', 'Editable slides'],
    ['site', 'Sites', 'A page you can share or publish'],
  ],
  R: [
    ['app', 'Artifacts', 'Live pages, calculators, dashboards, shared by link'],
    ['doc', 'Word and PDF files', 'Quotes, letters, one-pagers'],
    ['sheet', 'Excel files', 'Real formulas, opens in Excel'],
    ['deck', 'PowerPoint files', 'Editable slides'],
  ],
};
const WhatItMakes: Page = () => (
  <Frame label="What each app makes">
    <Head
      eb={eb('make', 'Making things · formats')}
      title="Ask for the thing, by name"
      sum="Both apps make real files you can open, edit and send, not just chat text. Say what you want it to be: “Make this a one-page PDF price sheet.”"
    />
    <PageNo />
    <Split
      top="16.4cqw"
      left={
        <>
          <SideLabel name="OpenAI · ChatGPT" sub="Chat and Work modes" />
          <div className="b4-makes">
            {MAKES.L.map(([k, t, d]) => (
              <div key={t}>
                <Thumb kind={k} />
                <b>{t}</b>
                <span>{d}</span>
              </div>
            ))}
          </div>
        </>
      }
      right={
        <>
          <SideLabel name="Claude" sub="Chat and Cowork" />
          <div className="b4-makes">
            {MAKES.R.map(([k, t, d]) => (
              <div key={t}>
                <Thumb kind={k} />
                <b>{t}</b>
                <span>{d}</span>
              </div>
            ))}
          </div>
          <div className="handnote" style={{ right: '3.4cqw', bottom: '2.4cqw' }}>
            shared artifacts run on the viewer's plan
          </div>
        </>
      }
    />
  </Frame>
);

/* ---------- real tools, running in real businesses ---------- */
const TOOLS = [
  {
    id: 'bambi',
    who: 'Bambi Baby · baby-gear stores',
    tool: 'Claude',
    t: 'Speed to lead',
    d: 'Three in four walk-in shoppers used to leave without a name or an email. Now they scan what they like, and the wishlist and the follow-up go out on their own.',
    g: '$60,000 in sales tied to it in the first four days.',
  },
  {
    id: 'kane',
    who: 'KANE · creative agency',
    tool: 'Claude',
    t: 'Proposal builder',
    d: 'Meeting notes in. A fit score, a price from past projects, the proposal and the statement of work out, ready to sign.',
    g: 'Scoping to signature went from weeks to minutes.',
  },
  {
    id: 'packlab',
    who: 'A YouTube channel’s team',
    tool: 'Claude artifact',
    t: 'Thumbnail vote',
    d: 'A shared page where the team votes on video thumbnails, so the decision does not get lost in Slack.',
    g: 'Made in a chat and shared as a link. No code.',
  },
];
const RealTools: Page = () => {
  const on = usePlay(120);
  return (
    <Frame label="Real tools, running in real businesses">
      <Head
        eb={eb('make', 'Making things · real tools')}
        title="Small tools that fit one business"
        sum="Not apps for sale. Each one fits how one business already works, and none needed a software team."
      />
      <PageNo />
      <div className={`b4-tools ${on ? '' : 'pre'}`}>
        {TOOLS.map((x, i) => (
          <div key={x.id} className="dk-fade" style={{ ['--i' as string]: i * 2 }}>
            <Shot id={x.id} style={{ height: '16.2cqw' }} />
            <div className="who">
              <span className="dk-k">{x.who}</span>
              <span className="tl">{x.tool}</span>
            </div>
            <b>{x.t}</b>
            <span className="d">{x.d}</span>
            <span className="g">{x.g}</span>
          </div>
        ))}
      </div>
      <Src>
        Bambi Baby and KANE: Anthropic, Sep 2026, results as each business reported them; the clips are Anthropic’s demos of the
        same workflows. Thumbnail vote: Anthony Dupont-Cinko, “How to Use Claude Artifacts”, Tenex on YouTube, Sep 2026.
      </Src>
    </Frame>
  );
};

/* ---------- pictures ---------- */
const PARTS = [
  { k: 'Subject', t: 'our tap truck: a white Isuzu with a timber bar and four brass taps' },
  { k: 'Setting', t: 'parked at a Fremantle weekend market, late afternoon, people out of focus' },
  { k: 'Reference', t: 'match the two attached photos of the real truck exactly' },
  { k: 'Style', t: 'documentary photo, natural light, 35 mm lens, no filters' },
  { k: 'Limits', t: 'no text in the image, no faces, keep our logo as it is' },
];
const Pictures: Page = () => {
  const [on, setOn] = useState<boolean[]>([true, false, false, false, false]);
  const n = on.filter(Boolean).length;
  const verdict = ['', 'A generic truck. Could be anyone’s.', 'Somewhere real, still not your truck.', 'Your truck. This is the big jump.', 'Looks like a photo you took.', 'Usable for the website or a post.'][n];
  return (
    <Frame label="Pictures that don't look made up">
      <Head
        eb={eb('make', 'Making things · pictures and video')}
        title="Pictures that look like your business"
        sum="Most people have only seen bad AI images. The difference is a reference photo of the real thing, and a prompt with five parts. Click the parts on and off."
      />
      <PageNo />
      <div className="b4-parts" data-osd-interactive>
        {PARTS.map((p, i) => (
          <button
            key={p.k}
            type="button"
            className={on[i] ? 'on' : ''}
            onClick={() => setOn((o) => o.map((x, j) => (j === i ? !x : x)))}
          >
            <span className="dk-k">{p.k}</span>
            <span>{p.t}</span>
          </button>
        ))}
      </div>
      <div className="b4-prompt">
        <span className="dk-k">The prompt</span>
        <p>
          {PARTS.filter((_, i) => on[i])
            .map((p) => p.t)
            .join('. ') || '…'}
          .
        </p>
        <div className="meter">
          {PARTS.map((_, i) => (
            <i key={i} className={i < n ? 'f' : ''} />
          ))}
        </div>
        <span className="v">{verdict}</span>
      </div>
      <div className="b4-pic-apps">
        <div>
          <span className="dk-k">ChatGPT</span>
          <span>Makes images in the chat. Attach your reference photos, ask for four options, then change one thing at a time.</span>
        </div>
        <div>
          <span className="dk-k">Claude</span>
          <span>Doesn't draw images itself. Connect an image tool from the connector directory, or have Claude write the prompt.</span>
        </div>
      </div>
    </Frame>
  );
};

/* ---------- how this deck was made ---------- */
const MetaIntro: Page = () => (
  <Frame label="How this deck was made">
    <Pad>
      <PageNo />
      <div className="b4-meta">
        <span className="dk-k">Making things · 12 minutes, then the lab</span>
        <h1>
          How this deck was made
        </h1>
        <p>
          Every page you have seen today was built by an AI agent working from a brand file a few pages long. None of it looks like
          the plumber's site. Here is the setup, because you can copy it this afternoon in either app.
        </p>
        <div className="three">
          {[
            ['1', 'Brand as a file, not a vibe'],
            ['2', 'A checker that can count'],
            ['3', 'It looks before it hands over'],
          ].map(([n, t]) => (
            <div key={n}>
              <span className="dk-k">{n}</span>
              <b>{t}</b>
            </div>
          ))}
        </div>
      </div>
    </Pad>
  </Frame>
);

const BrandFile: Page = () => (
  <Frame label="Brand as a file">
    <Head eb={eb('make', 'How this deck was made · 1 of 3')} title="Brand as a file, not a vibe" />
    <PageNo />
    <div className="b4-bf">
      <div className="doc">
        <div className="fh">
          <span>themes/fieldwork.md</span>
          <span>3 pages</span>
        </div>
        <section>
          <span className="dk-k">Palette</span>
          <div className="sw">
            {[
              ['paper', '#f6f6f3', 'var(--paper)'],
              ['ink', '#141518', 'var(--ink)'],
              ['muted', '#6a6d74', 'var(--muted)'],
              ['staff yellow', '#ffc400', 'var(--accent)'],
              ['field notes', '#edf2e5', 'var(--fn-paper)'],
              ['red pencil', '#c0392b', 'var(--fn-red)'],
            ].map(([n, h, c]) => (
              <div key={n}>
                <i style={{ background: c }} />
                <b>{n}</b>
                <span>{h}</span>
              </div>
            ))}
          </div>
          <p className="rule">Yellow is a highlighter: a fill with ink on it, about 2% of a page. Never yellow text on paper.</p>
        </section>
        <section>
          <span className="dk-k">Type</span>
          <div className="ty">
            <span style={{ fontFamily: 'var(--f-sans)', fontWeight: 600 }}>Instrument Sans</span>
            <span style={{ fontFamily: 'var(--f-mono)' }}>IBM Plex Mono</span>
            <span style={{ fontFamily: 'var(--f-serif)' }}>Newsreader</span>
            <span style={{ fontFamily: 'var(--f-hand)', fontWeight: 700, color: 'var(--fn-red)' }}>Caveat</span>
          </div>
        </section>
      </div>
      <div className="doc">
        <section>
          <span className="dk-k">Never</span>
          <ul className="nv">
            <li>purple or blue gradients, glows</li>
            <li>sparkles, robots, brains, emoji as decoration</li>
            <li>stock photos, AI-made people</li>
            <li>cards inside cards</li>
            <li>“unlock”, “supercharge”, “10x”</li>
          </ul>
        </section>
        <section>
          <span className="dk-k">Voice</span>
          <ul className="nv vo">
            <li>Plain Australian English</li>
            <li>Real numbers, real (made-up) work</li>
            <li>One idea per page</li>
          </ul>
        </section>
      </div>
    </div>
    <div className="b4-bf-side">
      <p className="dk-body" style={{ fontSize: '1.5cqw' }}>
        Colours, fonts, five nevers, three voice rules. <Hl>Anyone can write this.</Hl> You will, in the lab.
      </p>
      <span className="dk-k">The real file is in the deck's repository</span>
    </div>
  </Frame>
);

const Checker: Page = () => {
  const active = useIsActivePage();
  const { beat, onBeat, pick, take } = useBeats(CHECK_BEATS);
  return (
    <Frame label="A checker that can count">
      <BeatSteps count={CHECK_BEATS - 1} onBeat={onBeat} />
      <Head
        eb={eb('make', 'How this deck was made · 2 of 3')}
        title="A checker that can count"
        sum="Before anything goes out, a small script checks every colour, font and banned word against the brand file. The judgement stays human. The counting doesn't."
      />
      <PageNo />
      <div className="b4-chk-stage">
        <CheckRun beat={beat} take={take} live={active} />
      </div>
      <div className="pbtns b4-chk-btns">
        <button className="rb primary" type="button" onClick={() => pick(1)}>
          Run the check
        </button>
        <button className="rb" type="button" disabled={beat < 1} onClick={() => pick(2)}>
          Fix and re-check
        </button>
      </div>
      <Src right>This deck has one too: node scripts/brand-check.mjs checks every page against the brand file.</Src>
    </Frame>
  );
};

const LOOP = ['Make it', 'Screenshot it', 'Critique it', 'Fix it'];
const LooksFirst: Page = () => {
  const active = useIsActivePage();
  const [i, setI] = useState(active ? 0 : LOOP.length * 3);
  useEffect(() => {
    if (!active) return;
    if (i >= LOOP.length * 3) return;
    const t = setTimeout(() => setI((x) => x + 1), 650);
    return () => clearTimeout(t);
  }, [active, i]);
  const done = i >= LOOP.length * 3;
  const pos = i % LOOP.length;
  return (
    <Frame label="It looks before it hands over">
      <Head
        eb={eb('make', 'How this deck was made · 3 of 3')}
        title="It looks before it hands over"
        sum="The agent renders the page, takes a screenshot, critiques it against the brand file, fixes the worst problem, and goes again. You only see the version that survived."
      />
      <PageNo />
      <div className="b4-loop">
        {LOOP.map((s, k) => (
          <div key={s} className={`lp ${!done && pos === k ? 'on' : ''}`}>
            <span className="dk-k">{String(k + 1).padStart(2, '0')}</span>
            <b>{s}</b>
          </div>
        ))}
        <div className={`out ${done ? 'on' : ''}`}>
          <span className="dk-k">Then</span>
          <b>Hand it to a human</b>
        </div>
      </div>
      <div className="b4-loop-count">
        <span className="dk-k">Pass</span>
        <b>{Math.min(3, Math.floor(i / LOOP.length) + 1)}</b>
        <span className="dk-muted">of 3</span>
        <button className="rb" type="button" onClick={() => setI(0)} style={{ marginLeft: '1.4cqw' }}>
          Replay
        </button>
      </div>
      <div className="b4-loop-you">
        <span className="dk-k">In your app, today</span>
        <p>
          After it makes something, say: <span className="dk-say">Look at what you made. What would a good designer change? Fix the top three.</span>
        </p>
      </div>
    </Frame>
  );
};

const SamePrompt: Page = () => (
  <Frame label="Same prompt, two results">
    <Head
      eb={eb('make', 'How this deck was made · the proof')}
      title="Same prompt, two results"
      sum={
        <>
          <span className="dk-say">Make a LinkedIn ad for a one-day AI course for small business owners in Perth.</span> Left: no brand
          file. Right: the same words, with the brand file loaded.
        </>
      }
    />
    <PageNo />
    <div className="b4-pair">
      <div>
        <span className="dk-k">Without the brand file</span>
        <div className="ad bad">
          <span className="pill">✦ AI MASTERCLASS ✦</span>
          <b>Unlock the Power of AI for Your Business</b>
          <span>Transform your workflow. Supercharge productivity. 10x your results.</span>
          <span className="cta">Register Now →</span>
        </div>
      </div>
      <div>
        <span className="dk-k">With the brand file</span>
        <div className="ad good">
          <div className="mk">
            <Mark size="3cqw" />
            <span>Fieldwork</span>
          </div>
          <b>
            A photo of your timesheet becomes a spreadsheet. <span className="hl">By 10:00.</span>
          </b>
          <span>One day in the Claude and ChatGPT desktop apps, on your own business. Perth, December. Twelve seats.</span>
          <span className="cta">Book a seat</span>
        </div>
      </div>
    </div>
    <p className="b4-pair-line">
      Taste comes from context. If you don't give the AI a point of view, <Hl>it gives you its own.</Hl>
    </p>
  </Frame>
);

const OneFile: Page = () => (
  <Frame label="One file, both apps">
    <Head
      eb={eb('make', 'How this deck was made · in your app')}
      title="One file, both apps"
      sum="You don't need an agent framework. Put the brand file where each app reads it first, and add one short skill that checks against it."
    />
    <PageNo />
    <Split
      top="15.4cqw"
      left={
        <>
          <SideLabel name="OpenAI · ChatGPT + Codex" sub="where it reads it" />
          <div className="b2-conn">
            {[
              ['Chat, Work', 'Project instructions, or the brand file in Project files'],
              ['Codex', 'AGENTS.md in the project folder'],
              ['The check', 'A “brand check” skill: “list every colour, font and word that breaks brand.md”'],
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
          <SideLabel name="Claude" sub="where it reads it" />
          <div className="b2-conn">
            {[
              ['Chat, Cowork', 'Project instructions, or the brand file in Project knowledge'],
              ['Code', 'CLAUDE.md in the project folder'],
              ['The check', 'The same skill. Skills work the same way in both apps.'],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="dk-k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="handnote" style={{ right: '3.4cqw', bottom: '2.4cqw' }}>
            this deck: one file, read by both
          </div>
        </>
      }
    />
  </Frame>
);

const Live = live({
  block: 'make',
  title: 'A website on your own domain, first draft to fifth',
  minutes: 6,
  backup: () => FirstToFifth,
  apps: [
    {
      who: 'openai',
      app: 'ChatGPT desktop',
      mode: 'Codex',
      steps: [
        'New folder “ridgeline-site” with about.md and the price list. “Make a one-page website for this business.”',
        'Open the preview. Read v1 out loud. Then the reference screenshots and message 3.',
      ],
    },
    {
      who: 'claude',
      app: 'Claude desktop',
      mode: 'Code',
      steps: [
        'Same folder, picking up from v3: “Screenshot it. Critique it like a designer. Fix the top three.”',
        '“Remove anything that isn’t helping someone book a survey.” Publish if the Wi-Fi is good.',
      ],
    },
  ],
});

const Lab3 = lab({
  id: 'lab3',
  n: 3,
  block: 'make',
  minutes: 20,
  title: 'One thing a customer will see, on brand',
  goal: 'Write a one-page brand file, then make one customer-facing thing with it: a price sheet, a one-pager or a social post.',
  done: 'You made it twice, without and with the brand file, and asked for a brand check on the second.',
  keep: 'brand.md, saved in your business Project.',
  openai: [
    <>
      In your Project, new chat: <span className="dk-say">Interview me to write a one-page brand file: colours, fonts, five nevers, three voice rules.</span>
    </>,
    'Save the answer as brand.md in the Project files.',
    'Ask for the asset. Then ask again in a chat outside the Project, and compare.',
    <>
      <span className="dk-say">Check this against brand.md. List every miss, then fix them.</span>
    </>,
  ],
  claude: [
    <>
      In your Project, new chat: <span className="dk-say">Interview me to write a one-page brand file: colours, fonts, five nevers, three voice rules.</span>
    </>,
    'Save the answer as brand.md in Project knowledge.',
    'Ask for the asset. Then ask again in a chat outside the Project, and compare.',
    <>
      <span className="dk-say">Check this against brand.md. List every miss, then fix them.</span>
    </>,
  ],
  hand: 'psst: that was your first skill',
});

export const pages: [Page, string][] = [
  [Open, '11:00 · Block 4 opener. Sixty minutes, the longest teaching block. Ends with a 20-minute lab, then lunch.'],
  [
    SpotTells,
    '5 min. Make it a game. The room calls out what looks AI-made; click the matching number. Eight to find. When they get stuck, click "Show all". The point: once you can name a tell, you can tell the AI to avoid it.',
  ],
  [
    FourMoves,
    '3 min. Four moves, one line each. Linger on 3, the critic loop: it is the single highest-value habit for anything visual.',
  ],
  [
    FirstToFifth,
    '4 min. Message 1 types and sends itself as the page opens. Click four times for messages 2 to 5 and read each one aloud while it types; the site on the right changes when the agent finishes. Message 4 pins the three problems it found before fixing them; message 5 marks what it removes. The chips jump to any version. v1 is what everyone gets. v5 is five plain messages later, no design skill needed. This page is also the backup if the live demo fails.',
  ],
  [
    WhatItMakes,
    '3 min. Both apps make real files. The handwritten note matters for Claude users: when you share an artifact that uses Claude, it runs on the viewer’s usage, not yours.',
  ],
  [
    RealTools,
    '2 min. Let the clips play. One sentence each: what the tool does, and the number. The point: these are small, one-business tools, made in the same apps they have. Skip this page if the block is running late.',
  ],
  [
    Live,
    '6 min. Have the ridgeline-site folder ready on the desktop with about.md, prices and three reference screenshots. Codex for v1 to v3, Claude Code for v4 and v5, so both get airtime. Only publish to a real domain if the connection is solid; the preview is enough.',
  ],
  [
    Pictures,
    '4 min. Start with only "Subject" on, read the verdict, then add parts one at a time. The jump is "Reference": attach a photo of the real thing. Be straight about the apps: ChatGPT makes images itself; Claude needs a connected tool.',
  ],
  [
    MetaIntro,
    '1 min. The reveal. Say it plainly: an AI agent built every page today, from a brand file. That is why it does not look like the plumber site.',
  ],
  [
    BrandFile,
    '3 min. Walk the four sections: palette, type, never, voice. It is short on purpose. Everyone writes one of these in the lab.',
  ],
  [
    Checker,
    '3 min. Open on the first draft and let the room spot what is wrong with it. Click once: the check is typed and run, and each problem it reports is pinned on the tile as it lands. Click again: the agent fixes the five and the check runs clean. The buttons do the same if you are not using the clicker. The real script is in the repo (node scripts/brand-check.mjs) and runs over this deck.',
  ],
  [
    LooksFirst,
    '2 min. The loop runs three passes by itself. Point at the sentence at the bottom: that one sentence gets most of the benefit in either app.',
  ],
  [
    SamePrompt,
    '2 min. Same words, two results. Read the takeaway line and stop talking for a second.',
  ],
  [
    OneFile,
    '2 min. Where the brand file goes in each app. Mention that this deck’s own brand file is read by both Claude and Codex in the same folder.',
  ],
  [
    Lab3,
    '20 min. Start the timer. People who finish early: run the same brand file on a second asset. Lunch at 12:00; tell them their work is saved in the Project.',
  ],
];
