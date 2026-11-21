/* Block 1 · 9:00 · Why now. */
import type { Page } from '@open-slide/core';
import { useIsActivePage, Step, Steps } from '@open-slide/core';
import { useEffect, useState } from 'react';
import { Frame, Hl, Pad } from '@assets/fieldwork/brand';
import { CountUp, Head, PageNo, RoomTimer, Shot, Src, eb, opener, usePlay } from '../kit';

const Open = opener(
  'why',
  'Models now finish work that took a person hours. Most businesses still use them like a search box. That gap is your head start.',
);

/* ---------- real owners, real jobs ----------
 * Four cases, large enough to read from the back: two on ChatGPT, two on Claude, two of them from
 * Australia and New Zealand. The other verified cases live on the companion page under "More cases".
 */
type Owner = {
  id?: string;
  quote?: string;
  biz: string;
  where: string;
  tool: string;
  did: string;
  got: string;
  src: string;
  kind: string;
  pos?: string;
};
const OWNERS: Owner[] = [
  {
    id: 'oakcreek',
    pos: 'left top',
    biz: 'Oak Creek Plumbing & Remodeling',
    where: 'Plumbing · about 20 plumbers · US',
    tool: 'ChatGPT',
    did: 'A tablet in every home visit: photos of the broken heater in, options, invoice and proposal out.',
    got: '“Some of our older guys have learned to ask ChatGPT the right questions.”',
    src: 'CNN, Oct 2025',
    kind: 'Press',
  },
  {
    quote: '“I’ve got a PhD in my pocket.”',
    biz: 'Matthew Zonderop',
    where: 'Dairy, 370 cows · Te Poi, NZ',
    tool: 'ChatGPT',
    did: 'Uploads his herd’s genomic spreadsheets and soil tests. Grazing plans and feed budgets are done with AI.',
    got: 'A sharemilker, not a programmer, doing his own analysis.',
    src: 'Farmers Weekly NZ, Nov 2024',
    kind: 'Press',
  },
  {
    id: 'sportsfit',
    biz: 'SportsFit Health and Rehab',
    where: 'Physiotherapy · Australia',
    tool: 'Claude',
    did: 'Sorts incoming email and sends it to the right treating physio.',
    got: 'About seven to eight hours a week back.',
    src: 'NAB, Aug 2026',
    kind: 'Bank',
  },
  {
    id: 'hireeffect',
    biz: 'HireEffect',
    where: 'Bookkeeping and payroll · Dallas, US',
    tool: 'Claude',
    did: 'Found the 16 transactions behind a US$13,000 gap in 2.5 years of PayPal data.',
    got: 'A two-hour monthly check now takes ten seconds.',
    src: 'Anthropic, Sep 2026',
    kind: 'Vendor',
  },
];

const Owners: Page = () => {
  const active = useIsActivePage();
  const [hot, setHot] = useState(-1);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setHot((h) => (h + 1) % OWNERS.length), 3200);
    return () => clearInterval(id);
  }, [active]);
  return (
    <Frame label="Real owners, real jobs">
      <Head eb={eb('why', 'Why now · the proof')} title="Four businesses. None of them writes software" />
      <PageNo />
      <div className="b1-four">
        {OWNERS.map((o, i) => (
          <div key={o.biz} className={`dk-tile ${i === hot ? 'lit' : ''}`}>
            {o.id ? (
              <Shot id={o.id} className="pic sm" pos={o.pos ?? 'center top'} style={{ height: '100%' }} />
            ) : (
              <div className="qt">{o.quote}</div>
            )}
            <div className="tx">
              <div className="who">
                <span className="dk-k">{o.where}</span>
                <span className="tl">{o.tool}</span>
              </div>
              <b>{o.biz}</b>
              <span className="d">{o.did}</span>
              <span className="g">{o.got}</span>
              <span className="sr">
                <span className="kd">{o.kind}</span>
                {o.src}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="b1-reel-cap">
        Same apps you have. Plain requests. <Hl>One job changed first.</Hl>
      </div>
      <Src right>
        Results as each business reported them. Press: independent journalism. Bank and vendor: published by a company with something to
        sell. The HireEffect clip is the vendor’s demo of this workflow on a sample company, not HireEffect’s own screen.
      </Src>
    </Frame>
  );
};

/* ---------- two minutes, before any teaching ---------- */
const TryOne: Page = () => (
  <Frame label="Try one thing">
    <Head
      eb={eb('why', 'Why now · two minutes, hands on')}
      title="Type one thing you assume it can’t do"
      sum="Before we teach anything. Open the app you pay for, pick something from your own week, and ask for it in plain words. Two minutes."
    />
    <PageNo />
    <RoomTimer id="try0" minutes={2} />
    <div className="b1-try">
      {[
        ['If you are stuck for an idea', 'Photograph something handwritten on your desk and ask for it as a table.'],
        ['Or', 'Paste the last long email you received and ask what it wants from you, and by when.'],
        ['Or', 'Describe a job you quoted last week and ask what you forgot to price.'],
      ].map(([k, v]) => (
        <div key={v}>
          <span className="dk-k">{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
    <div className="b1-try-foot">
      <p>
        It worked? <Hl>That is the day in one line.</Hl>
      </p>
      <p>
        It fell short? Write the ask down. That is the first line of your <b>try-again list</b>, and we come back to it at 15:30.
      </p>
      <p className="dk-muted">App will not open, or you cannot sign in? Hand up now. This is the moment to fix it.</p>
    </div>
  </Frame>
);

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
        sum="Longest task a model can finish about half the time, measured in how long the task takes a skilled person. Two published readings, joined by a straight line."
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
        Source: METR task-length measurements, via Ethan Mollick, “30 months on the exponential”, One Useful Thing, 2026. The source
        gives the first reading as 2024, with no month. Right-hand labels are for scale only.
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
            Investors call this “the diffusion gap”. If the biggest companies have not closed it, a small business that measures one job is
            already ahead.
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
          Small businesses can move faster than any of them. You will leave today with <b>a number to beat</b>: what one job costs you now, and what you
          expect it to cost in 30 days.
        </p>
      </div>
      <Src>
        Sources: a16z, “State of Markets II” (S&amp;P 500 reporting), 2026. “The diffusion gap”: Pat Grady, Sequoia, Sep 2026. Dots
        are per 100 companies; the 2 are drawn inside the 30 for simplicity.
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
  const firstShut = flip.indexOf(false);
  return (
    <Frame label="The models are already enough">
      <Head
        eb={eb('why', 'Why now · the one idea for today')}
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
            <span className="b">{flip[i] ? b : i === firstShut ? 'Click to reframe' : ''}</span>
          </button>
        ))}
      </div>
      <div className="b1-reflex-side">
        <p>
          Be a little bold. Ask for the thing you assume it can’t do. More often than not, you will be <Hl>surprised</Hl>.
        </p>
        <p className="dk-body">If it falls short today, write the ask down and try it again on the next model. Each one moves the line.</p>
        <blockquote className="b1-lock">
          “99% of my prompts were ‘Add X and Y’ or ‘This looks weird, make it better’.”
          <span className="dk-attr">Dan Greenheck, on building a 3D game in eight hours · X, Sep 2026</span>
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

/* ---------- a farmer's own software ---------- */
const Farmer: Page = () => (
  <Frame label="A farmer's own software">
    <Head
      eb={eb('why', 'Why now · built by an owner')}
      title="A row-crop farmer built thirty tools for his farm this year"
      sum="Travis Senter grows cotton, rice, soybeans and corn in Osceola, Arkansas. His bio reads “Farmer, Fabricator.” His latest tool reads public lidar data to show where rain will drain across any field."
    />
    <PageNo />
    <div className="b1-farm">
      <Shot id="cutsheetrx" chrome="browser" className="vid" style={{ height: '27cqw' }} />
      <Shot id="cutsheetrx-phone" className="ph" fit="cover" style={{ height: '27cqw' }} />
      <div className="side">
        <blockquote>
          <p className="dk-quote">“Quite possibly the best app I’ve created yet.”</p>
          <span className="dk-attr">Travis Senter, on X · Nov 2026</span>
        </blockquote>
        <div className="b1-farm-list">
          {[
            ['Draw a field', 'Drainage paths and rainfall flow from the elevation.'],
            ['Draw a line', 'An elevation profile, saved as a spreadsheet.'],
            ['On his site', '“Thirty things built this year”: dashboards, maps, budgets, planners. All of it runs in a browser.'],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="dk-k">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
        <p className="dk-body" style={{ fontSize: '1.35cqw' }}>
          He knows his fields better than any software company does. <Hl>That is the advantage.</Hl>
        </p>
      </div>
    </div>
    <Src>
      Travis Senter on X, 5 Nov 2026 · senterfarms.com/programs · Farm Journal, Moving Iron 2026 speaker bio. He has not said which AI tools
      he used.
    </Src>
  </Frame>
);

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
  [Open, '9:00 · Block 1 opener. Thirty minutes, with one two-minute exercise. The job of this block: make them want the rest of the day.'],
  [
    AlreadyEnough,
    '3 min. The thesis of the day, and it comes first, so say it plainly: the models are not the bottleneck; the habit of asking is. Read each old reflex aloud, ask who has said it this month, then click to reframe. Do not argue about which company is ahead; both apps are already more capable than anyone here will use today. Point at the quote: a man built a whole game with prompts that plain. End on: if it fails, write it down and try again on the next model. This line comes back on every lab page and at the close.',
  ],
  [
    TryOne,
    '3 min: 1 to set up, 2 on the timer. The thesis in action, forty minutes earlier than the first lab. Start the timer and walk the room. You are looking for two things: anyone who cannot open or sign in to an app (fix it now, or pair them up), and one good surprise to quote back. When the timer ends, ask for one that worked and one that fell short. Tell the second person to write it down: that is the try-again list, and it comes back in the 30-day plan.',
  ],
  [
    Owners,
    '2 min. The tiles light up in turn. Four real businesses, two on each app, none of them software companies. Do not read all four. Pick the two closest to the room (trades rooms: the plumber and the dairy farmer) and tell those in one breath each. Then point at the caption: each one changed one job first. Point at the tags: press, bank, vendor. Most hard numbers come from someone with something to sell, and that is worth saying out loud. More cases are on the companion page.',
  ],
  [
    Farmer,
    '2 min. Let the field clip run: draw the field, see the cut and fill, then the water. The point: a working farmer, not a programmer, built thirty tools this year because he knows his own land. Do not name the AI tool he used; he has not said publicly. If asked: his public posts and a 2024 AgWeb interview show he already used ChatGPT on his farm data.',
  ],
  [
    TaskLength,
    '3 min. Wait for the line to draw. Be straight that it is two published readings with a line between them. Then read the right-hand labels: four minutes was an email reply; seventeen hours is two working days. Stress "about half the time": it still fails, which is why the afternoon is about checking.',
  ],
  [
    Cheaper,
    '2 min. Press → for the second number. Message: price is not the reason to wait, and loyalty to one product is a mistake. That is why both apps get equal time today.',
  ],
  [
    Shallow,
    '2 min. Let the dots fill. The punchline is the yellow two: almost nobody measures. These are the biggest companies in America, so keep it short and turn it round: a small business that measures one job is ahead of most of them. Promise: everyone here leaves with a number to beat on one real job, and measures it properly on day 30.',
  ],
  [
    Overhang,
    '2 min. Read the big quote slowly. Mollick studies how people actually use AI; Levie runs a large software company. Both are saying the same thing: the tools are ahead of us. Then the small one: his father set up a new laptop by asking Codex to do it. If a retiree can, so can a business owner.',
  ],
  [UseThem, '30 sec. Read the quote, pause, move on. Transition straight into the map of the apps.'],
];
