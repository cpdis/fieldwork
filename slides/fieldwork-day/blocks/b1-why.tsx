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
type Owner = { id: string; biz: string; where: string; tool: string; did: string; got: string };
const OWNERS: Owner[] = [
  {
    id: 'wcd-1',
    biz: 'West Coast Deck',
    where: 'Deck builder · US',
    tool: 'ChatGPT',
    did: 'Records every site visit. The recap email goes out five minutes later.',
    got: 'A few hundred thousand dollars of new sales in 4–6 weeks.',
  },
  {
    id: 'oakcreek',
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
          <div key={o.id} className={`dk-tile ${i === hot ? 'hot' : ''}`}>
            <Shot id={o.id} className="pic sm" style={{ height: '8.4cqw' }} />
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
        business reported them.
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
  [UseThem, '30 sec. Read the quote, pause, move on. Transition straight into the map of the apps.'],
];
