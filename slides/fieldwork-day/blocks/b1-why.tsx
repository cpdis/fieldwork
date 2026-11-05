/* Block 1 · 9:00 · Why now. */
import type { Page } from '@open-slide/core';
import { useIsActivePage, Step, Steps } from '@open-slide/core';
import { useEffect, useState } from 'react';
import { Frame, Hl, Pad } from '@assets/fieldwork/brand';
import { CountUp, Head, PageNo, Shot, Src, eb, opener, usePlay } from '../kit';

const Open = opener(
  'why',
  'Models now finish work that took a person hours. Most businesses still use them like a search box. That gap is your head start.',
);

/* ---------- real owners, real jobs ---------- */
type Owner = { id: string; biz: string; where: string; tool: string; did: string; got: string; pos?: string };
const OWNERS: Owner[] = [
  {
    id: 'wcd-1',
    pos: 'center 60%',
    biz: 'West Coast Deck',
    where: 'Deck builder · US',
    tool: 'ChatGPT',
    did: 'Records every site visit. The recap email goes out five minutes later.',
    got: 'A few hundred thousand dollars of new sales in 4–6 weeks.',
  },
  {
    id: 'oakcreek',
    pos: 'left top',
    biz: 'Oak Creek Plumbing & Remodeling',
    where: 'Plumbing · about 20 plumbers',
    tool: 'ChatGPT',
    did: 'A tablet in every home visit: photos of the broken heater in, options, invoice and proposal out.',
    got: '“Some of our older guys have learned to ask ChatGPT the right questions.”',
  },
  {
    id: 'mothership',
    biz: 'Mothership Coffee Roasters',
    where: 'Six cafés · Las Vegas',
    tool: 'Claude',
    did: 'A Monday brief from the tills, the books, Slack and email.',
    got: 'In-store margins up to 22%, partly from tighter ordering and rosters.',
  },
  {
    id: 'hireeffect',
    biz: 'HireEffect',
    where: 'Bookkeeping and payroll · Dallas',
    tool: 'Claude',
    did: 'Found the 16 transactions behind a $13,000 gap in 2.5 years of PayPal data.',
    got: 'A two-hour monthly check now takes ten seconds.',
  },
  {
    id: 'sportsfit',
    biz: 'SportsFit Health and Rehab',
    where: 'Physiotherapy · Australia',
    tool: 'Claude',
    did: 'Sorts incoming email and sends it to the right treating physio.',
    got: 'About seven to eight hours a week back.',
  },
  {
    id: 'bella',
    biz: 'Bella Manufacturing',
    where: 'Food-truck fit-outs · Australia',
    tool: 'Tool not named',
    did: 'Had AI read and compare the insurance quotes.',
    got: 'Saved several thousand dollars and found a gap in the cover.',
  },
];

const Owners: Page = () => {
  const active = useIsActivePage();
  const [hot, setHot] = useState(-1);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setHot((h) => (h + 1) % OWNERS.length), 2600);
    return () => clearInterval(id);
  }, [active]);
  return (
    <Frame label="Real owners, real jobs">
      <Head eb={eb('why', 'Why now · proof first')} title="Six businesses. None of them writes software" />
      <PageNo />
      <div className="b1-reel">
        {OWNERS.map((o, i) => (
          <div key={o.id} className={`dk-tile ${i === hot ? 'lit' : ''}`}>
            <Shot id={o.id} className="pic sm" pos={o.pos ?? 'center top'} style={{ height: '8.4cqw' }} />
            <div className="who">
              <span className="dk-k">{o.where}</span>
              <span className="tl">{o.tool}</span>
            </div>
            <b>{o.biz}</b>
            <span className="d">{o.did}</span>
            <span className="g">{o.got}</span>
          </div>
        ))}
      </div>
      <div className="b1-reel-cap">
        Same apps you have. Plain requests. <Hl>One job changed first.</Hl>
      </div>
      <Src>
        Sources: Jameson Haslam on X, Oct 2026 · CNN, Oct 2025 · Anthropic, Sep 2026 · NAB, Apr and Aug 2026. Results as each
        business reported them. Clips marked “demo” are Anthropic’s own demos of the same workflow.
      </Src>
    </Frame>
  );
};

/* ---------- task length keeps doubling ---------- */
const TaskLength: Page = () => {
  const on = usePlay(150);
  // Log scale: 1 minute .. a 40-hour working week. Two published points, nothing invented between them.
  const W = 1000;
  const H = 440;
  const y = (min: number) => H - (Math.log10(min) / Math.log10(2400)) * H;
  const x0 = 120;
  const x1 = 860;
  const ticks: [number, string, string][] = [
    [1, '1 min', ''],
    [4, '4 min', 'reply to an email'],
    [60, '1 hr', 'a first-draft quote'],
    [480, '8 hrs', 'a day of admin'],
    [1020, '17 hrs', 'two working days'],
    [2400, '40 hrs', 'a working week'],
  ];
  return (
    <Frame label="Task length keeps doubling">
      <Head
        eb={eb('why', 'Why now · the exponential')}
        title={
          <>
            The length of job it can finish <Hl>doubles every few months</Hl>
          </>
        }
        sum="Longest task a model can finish about half the time, measured in how long the task takes a skilled person."
      />
      <PageNo />
      <div className={`b1-chart ${on ? '' : 'pre'}`}>
        <svg viewBox={`0 0 ${W} ${H + 40}`} preserveAspectRatio="xMinYMin meet" aria-hidden="true">
          {ticks.map(([m, l, e]) => (
            <g key={l}>
              <line x1="0" x2={W} y1={y(m)} y2={y(m)} stroke="var(--rule)" strokeWidth="1.5" />
              <text x="0" y={y(m) - 8} className="tk">
                {l}
              </text>
              {e && (
                <text x={W} y={y(m) - 8} className="tk e" textAnchor="end">
                  {e}
                </text>
              )}
            </g>
          ))}
          <line className="draw" x1={x0} y1={y(4)} x2={x1} y2={y(1020)} stroke="var(--ink)" strokeWidth="4" pathLength={1} />
          <circle cx={x0} cy={y(4)} r="11" fill="var(--ink)" />
          <circle className="end" cx={x1} cy={y(1020)} r="13" fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" />
          <text x={x0} y={H + 34} className="ax" textAnchor="middle">
            2024
          </text>
          <text x={x1} y={H + 34} className="ax" textAnchor="middle">
            Apr 2026
          </text>
        </svg>
        <div className="lab a">
          <b>4 min</b>
          <span>2024</span>
        </div>
        <div className="lab b">
          <b>17 hrs</b>
          <span>April 2026 · about 8 doublings later</span>
        </div>
      </div>
      <Src>
        Source: METR task-length measurements, via Ethan Mollick, “30 months on the exponential”, One Useful Thing, 2026. Right-hand
        labels are for scale only.
      </Src>
    </Frame>
  );
};

/* ---------- cheaper and crowded ---------- */
const Cheaper: Page = () => (
  <Frame label="Cheaper, and nobody stays on top">
    <Head eb={eb('why', 'Why now · cost')} title="Cheaper every month, and nobody stays on top" />
    <PageNo />
    <div className="b1-two">
      <Steps>
        <div className="dk-stat">
          <b>
            <CountUp to={750} ms={1400} />×
          </b>
          <span className="dk-k">cheaper per correct answer</span>
          <p className="dk-body">The same hard question now costs a sliver of what it did when these tools arrived. Price is no longer the reason to wait.</p>
        </div>
        <Step duration={260}>
          <div className="dk-stat">
            <b>20</b>
            <span className="dk-k">different models have held the lead</span>
            <p className="dk-body">
              So learn the habits, not one product. Everything today works the same way in ChatGPT and in Claude.
            </p>
          </div>
        </Step>
      </Steps>
    </div>
    <Src>Source: Ethan Mollick, “30 months on the exponential”, One Useful Thing, 2026. Figures are approximate.</Src>
  </Frame>
);

/* ---------- broad and shallow ---------- */
const Shallow: Page = () => {
  const on = usePlay(150);
  return (
    <Frame label="Broad and shallow">
      <Head
        eb={eb('why', 'Why now · the gap')}
        title="Everyone has it. Almost no one measures it"
        sum={
          <>
            Out of every 100 companies in the S&amp;P 500, about 30 say AI has had a measurable effect, and about 2 track a number.
            Investors call this “the diffusion gap”. It is the reason this room exists.
          </>
        }
      />
      <PageNo />
      <div className={`b1-dots ${on ? '' : 'pre'}`}>
        {Array.from({ length: 100 }, (_, i) => (
          <i key={i} className={i < 2 ? 'm' : i < 30 ? 'q' : ''} style={{ ['--i' as string]: i }} />
        ))}
      </div>
      <div className="b1-dots-key">
        <div>
          <i className="q" />
          <b>~30%</b>
          <span>report “quantifiable impact”</span>
        </div>
        <div>
          <i className="m" />
          <b>~2%</b>
          <span>track an actual metric</span>
        </div>
        <div>
          <i />
          <b>The rest</b>
          <span>have it switched on, and use it like search</span>
        </div>
        <p className="dk-body" style={{ marginTop: '1.4cqw', fontSize: '1.35cqw' }}>
          Small businesses can move faster than any of them. You will leave today with a <b>before and after number</b> of your own.
        </p>
      </div>
      <Src>
        Sources: a16z, “State of Markets II” (S&amp;P 500 reporting), 2026. “The diffusion gap”: Pat Grady, Sequoia, Sep 2026. Dots
        are per 100 companies.
      </Src>
    </Frame>
  );
};

/* ---------- what a big job costs ---------- */
const BigJob: Page = () => (
  <Frame label="What a big job really costs">
    <Head eb={eb('why', 'Why now · a reality check')} title="What a big job really costs, and what it really took" />
    <PageNo />
    <div className="b1-cost">
      <Shot id="tidewater" className="vid" style={{ height: '28.7cqw' }} />
      <div className="side">
        <div className="nums3">
          {[
            ['8 hrs', 'to build this 3D island game'],
            ['US$1,874', 'of model time, at list prices'],
            ['59%', 'of one week on a US$200 plan'],
          ].map(([b, s]) => (
            <div key={b} className="num">
              <b>{b}</b>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <blockquote>
          <p className="dk-quote">“99% of my prompts were ‘Add X and Y’ or ‘This looks weird, make it better’.”</p>
          <span className="dk-attr">Dan Greenheck, on building Tidewater</span>
        </blockquote>
        <p className="dk-body" style={{ fontSize: '1.4cqw' }}>
          The prompts were plain. <Hl>The persistence was the skill.</Hl> Nobody needed a prompt course.
        </p>
      </div>
    </div>
    <Src>Dan Greenheck, “Tidewater”, video on X, Sep 2026. Hours and cost as reported in the post.</Src>
  </Frame>
);

/* ---------- close to home: Australia and New Zealand ---------- */
type Near = { biz: string; where: string; tool: string; did: string; got: string; src: string; kind: string };
const NEAR: Near[] = [
  {
    biz: 'Bundilla Pest Control',
    where: 'Pest control · Sunshine Coast',
    tool: 'Claude',
    did: 'Built a proposal engine in two weeks. Measurements in on site, then price, proposal, signature and deposit go out by themselves.',
    got: 'Proposals from up to 45 minutes to under one. 38 hours saved in the first fortnight.',
    src: 'SmartCompany, Aug 2026',
    kind: 'Sponsored',
  },
  {
    biz: 'Matthew Zonderop',
    where: 'Dairy, 370 cows · Te Poi, NZ',
    tool: 'ChatGPT',
    did: 'Uploads his herd’s genomic spreadsheets and soil tests. Grazing plans and feed budgets are done with AI.',
    got: '“I’ve got a PhD in my pocket.”',
    src: 'Farmers Weekly NZ, Nov 2024',
    kind: 'Press',
  },
  {
    biz: '“Dan”, a carpenter',
    where: 'Carpentry · Queensland',
    tool: 'Custom tool',
    did: 'A three-step form drafts each quote in his voice with supplier prices. He reviews it for two minutes.',
    got: '45 minutes a quote down to 8. Paid for itself in 7 weeks.',
    src: 'Batten Digital, Apr 2026',
    kind: 'Builder',
  },
  {
    biz: 'Willoughby Plumbing and Gas',
    where: 'Plumbing · New Zealand',
    tool: 'Call answering',
    did: 'Every missed call gets a reply in seconds. Urgent jobs ping straight through; a summary lands at lunch and at night.',
    got: '“I’m able to complete the job I’m on without worrying about the calls.”',
    src: 'Call Catcher, Oct 2026',
    kind: 'Vendor',
  },
  {
    biz: 'Tongariro Crossing Shuttles',
    where: 'Alpine shuttles · Tongariro, NZ',
    tool: 'Website chat',
    did: 'Answers routes, pick-ups and weather questions all night, for walkers in other time zones.',
    got: 'Up to 75 percent of enquiries handled end to end. About 37 staff hours saved in a month.',
    src: 'Yonder',
    kind: 'Vendor',
  },
  {
    biz: 'A dental practice',
    where: 'Dentistry · Darwin',
    tool: 'Voice receptionist',
    did: 'Picks up after a few rings, books into the practice system and hands over to a person when it should.',
    got: 'Zero missed calls in three months.',
    src: 'AI Adaptive, Mar 2026',
    kind: 'Self-published',
  },
];
const CloseToHome: Page = () => {
  const on = usePlay(120);
  return (
    <Frame label="Close to home">
      <Head
        eb={eb('why', 'Why now · close to home')}
        title="Closer to home: six businesses in Australia and New Zealand"
        sum="Trades, farms, clinics, tourism. Each tag says who published the story, so you know how much weight to give the numbers."
      />
      <PageNo />
      <div className={`b1-near ${on ? '' : 'pre'}`}>
        {NEAR.map((n, i) => (
          <div key={n.biz} className="dk-tile" style={{ ['--i' as string]: i }}>
            <div className="who">
              <span className="dk-k">{n.where}</span>
              <span className="tl">{n.tool}</span>
            </div>
            <b>{n.biz}</b>
            <span className="d">{n.did}</span>
            <span className="g">{n.got}</span>
            <span className="sr">
              <span className={`kd k-${n.kind.toLowerCase().replace(/[^a-z]/g, '')}`}>{n.kind}</span>
              {n.src}
            </span>
          </div>
        ))}
      </div>
      <Src>
        Press: independent journalism. Sponsored: paid content (Salesforce). Builder: the developer who built it. Vendor and self-published:
        the company selling the tool. Numbers as each source reported them.
      </Src>
    </Frame>
  );
};

/* ---------- the overhang ---------- */
const Overhang: Page = () => {
  const on = usePlay(120);
  return (
    <Frame label="The overhang">
      <Head eb={eb('why', 'Why now · the overhang')} title="If progress stopped today, we would still be catching up for years" />
      <PageNo />
      <div className={`b1-over ${on ? '' : 'pre'}`}>
        <blockquote className="main">
          <p>
            “Even if AI development stopped today, we’d have years of catching up to do. The gap between what current models can do and what
            almost anyone is using them for is <Hl>vast</Hl>.”
          </p>
          <span className="dk-attr">Ethan Mollick, Wharton professor, on X · Sep 2026</span>
        </blockquote>
        <blockquote className="side">
          <p>
            “Most of the world still thinks of AI as chatbots that will answer a question on demand but not yet do real work for them.”
          </p>
          <span className="dk-attr">Aaron Levie, CEO of Box, on X · Jan 2026</span>
        </blockquote>
        <blockquote className="side">
          <p>
            “He just told me that he took my advice to install Codex and just ask it to take over and solve his setup problems & install
            what he needed. Family IT support will never be the same.”
          </p>
          <span className="dk-attr">Ethan Mollick, on his father’s new MacBook · Aug 2026</span>
        </blockquote>
      </div>
      <Src>Posts on X: @emollick, 18 Sep 2026 and 18 Aug 2026; @levie, 13 Jan 2026. Quoted as posted.</Src>
    </Frame>
  );
};

/* ---------- the models are already enough ---------- */
const REFLEX: [string, string][] = [
  ['“It probably can’t do that.”', 'Type it in and see. It takes a minute to find out.'],
  ['“I’ll type the notes up tonight.”', 'Photograph them. Ask for the table.'],
  ['“We’d need software for that.”', 'Ask it to build the view you want.'],
  ['“It’s quicker to do it myself.”', 'Once, maybe. Every week, never.'],
  ['“I tried that. It didn’t work.”', 'Give it more context. Or try again when the next model ships.'],
];
const AlreadyEnough: Page = () => {
  const [flip, setFlip] = useState<boolean[]>(REFLEX.map(() => false));
  const all = flip.every(Boolean);
  return (
    <Frame label="The models are already enough">
      <Head
        eb={eb('why', 'Why now · the real gap')}
        title="The models are already good enough. The habit is what is missing."
        sum="This is not about which company is ahead. Either app in this room can already take hours off your week. What changes things is the moment you stop and ask: could this be done with AI in the loop?"
      />
      <PageNo />
      <div className="b1-reflex">
        <div className="hd">
          <span className="dk-k">The old reflex</span>
          <span className="dk-k">The new one</span>
        </div>
        {REFLEX.map(([a, b], i) => (
          <button
            key={a}
            type="button"
            className={`row ${flip[i] ? 'on' : ''}`}
            onClick={() => {
              const n = [...flip];
              n[i] = !n[i];
              setFlip(n);
            }}
          >
            <span className="a">{a}</span>
            <span className="b">{flip[i] ? b : 'Click to reframe'}</span>
          </button>
        ))}
      </div>
      <div className="b1-reflex-side">
        <p>
          Be a little bold. Ask for the thing you assume it can’t do. More often than not, you will be <Hl>surprised</Hl>.
        </p>
        <p className="dk-body">If it falls short today, write the ask down and try it again on the next model. Each one moves the line.</p>
        <blockquote className="b1-lock">
          “The penalty of locking into a ‘good enough’ solution based on today’s AI limits grows too.”
          <span className="dk-attr">Ethan Mollick, on X · Oct 2026</span>
        </blockquote>
        <div className="pbtns">
          <button className="rb" type="button" onClick={() => setFlip(REFLEX.map(() => !all))}>
            {all ? 'Reset' : 'Show all'}
          </button>
        </div>
      </div>
    </Frame>
  );
};

/* ---------- use them ---------- */
const UseThem: Page = () => (
  <Frame label="The only way to understand them">
    <Pad>
      <PageNo />
      <div className="b1-mod">
        <p className="dk-quote" style={{ fontSize: '5.6cqw' }}>
          “The only way to understand their power is to use them.”
        </p>
        <span className="dk-attr">Craig Mod, “Robot Blood”</span>{/* brand-check: ignore-line (essay title) */}
      </div>
      <div className="b1-mod-next">
        <span className="dk-k">Next</span>
        <span>Apps open. Ten minutes from now you will have done something useful with your own paperwork.</span>
      </div>
    </Pad>
  </Frame>
);

export const pages: [Page, string][] = [
  [Open, '9:00 · Block 1 opener. Thirty minutes, no lab. The job of this block: make them want the rest of the day.'],
  [
    Owners,
    '2 min. The tiles light up in turn. Proof before theory: six real businesses, none of them software companies. Do not read all six. Pick the two closest to the room (trades rooms: the deck builder and the plumber) and tell those in one breath each. Then point at the caption: each one changed one job first. Results are as the businesses reported them.',
  ],
  [
    CloseToHome,
    '2 min. The same idea, closer to home. Read two: the pest controller (a developer built their proposal engine with Claude in two weeks) and the Te Poi dairy farmer ("a PhD in my pocket"). Point at the source tags: most hard numbers come from the people selling the tool, and that is worth saying out loud.',
  ],
  [
    TaskLength,
    '3 min. Wait for the line to draw. Then read the right-hand labels: four minutes was an email reply; seventeen hours is two working days. Stress "about half the time": it still fails, which is why the afternoon is about checking.',
  ],
  [
    Cheaper,
    '2 min. Press → for the second number. Message: price is not the reason to wait, and loyalty to one product is a mistake. That is why both apps get equal time today.',
  ],
  [
    Shallow,
    '3 min. Let the dots fill. The punchline is the yellow two: almost nobody measures. Promise: everyone here leaves with a before and after number on one real task.',
  ],
  [
    BigJob,
    '2 min. Let the clip run while you talk. The point is not the money. It is the quote: the prompts were plain English. Persistence beats clever wording. Be honest that big builds cost real money, and that today\'s work fits easily in a normal plan.',
  ],
  [
    Overhang,
    '2 min. Read the big quote slowly. Mollick studies how people actually use AI; Levie runs a large software company. Both are saying the same thing: the tools are ahead of us. Then the small one: his father set up a new laptop by asking Codex to do it. If a retiree can, so can a business owner.',
  ],
  [
    AlreadyEnough,
    '3 min. The thesis of the day, so say it plainly: the models are not the bottleneck; the habit of asking is. Read each old reflex aloud, ask who has said it this month, then click to reframe. Do not argue about which company is ahead; both apps are already more capable than anyone here will use today. End on: if it fails, try again on the next model, and point at the Mollick line underneath: settling for today’s limits gets more expensive as the models improve. This line comes back on every lab page and at the close.',
  ],
  [UseThem, '30 sec. Read the quote, pause, move on. Transition straight into the map of the apps.'],
];
