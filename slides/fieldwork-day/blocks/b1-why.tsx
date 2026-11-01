/* Block 1 · 9:00 · Why now. */
import type { Page } from '@open-slide/core';
import { useIsActivePage, Step, Steps } from '@open-slide/core';
import { useEffect, useState } from 'react';
import { Frame, Hl, Pad } from '@assets/fieldwork/brand';
import { CountUp, Head, PageNo, Src, eb, opener, usePlay } from '../kit';

const Open = opener(
  'why',
  'Models now finish work that took a person hours. Most businesses still use them like a search box. That gap is your head start.',
);

/* ---------- six months of evenings: the reel ---------- */
const Tiny = ({ k }: { k: number }) => {
  // Small abstract pictures of each project. No real data, no client names.
  switch (k) {
    case 0:
      return (
        <svg viewBox="0 0 200 90" aria-hidden="true">
          {[0, 1, 2].map((s) => (
            <polyline
              key={s}
              fill="none"
              stroke={s === 1 ? 'var(--ink)' : 'var(--alu)'}
              strokeWidth={s === 1 ? 2.2 : 1.6}
              points={Array.from({ length: 41 }, (_, i) => {
                const y = 45 + Math.sin(i * 0.45 + s * 1.7) * (14 + s * 4) + Math.sin(i * 1.9 + s) * 5;
                return `${i * 5},${y.toFixed(1)}`;
              }).join(' ')}
            />
          ))}
          <rect x="128" y="8" width="22" height="74" fill="var(--accent)" opacity=".55" />
        </svg>
      );
    case 1:
      return (
        <svg viewBox="0 0 200 90" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => {
            const h = 70 * Math.exp(-(((i - 11) / 4.6) ** 2));
            return <rect key={i} x={8 + i * 7.8} y={84 - h} width={6} height={h} fill={i === 15 ? 'var(--accent)' : 'var(--ink)'} />;
          })}
          <line x1="125" y1="4" x2="125" y2="86" stroke="var(--ink)" strokeDasharray="3 3" />
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 200 90" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => {
            const booked = [3, 4, 9, 10, 11, 16, 17, 23, 24].includes(i);
            return (
              <rect
                key={i}
                x={10 + (i % 7) * 26}
                y={6 + Math.floor(i / 7) * 21}
                width={22}
                height={17}
                fill={booked ? 'var(--ink)' : 'none'}
                stroke="var(--ink)"
                strokeWidth="1.2"
              />
            );
          })}
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 200 90" aria-hidden="true">
          {[0, 1, 2].map((p) => (
            <g key={p} transform={`translate(${34 + p * 50} 6)`}>
              <rect width="34" height="78" rx="7" fill="none" stroke="var(--ink)" strokeWidth="1.6" />
              <rect x="5" y="12" width="24" height={10 + p * 6} fill={p === 1 ? 'var(--accent)' : 'var(--alu)'} />
              <rect x="5" y="44" width="24" height="3" fill="var(--alu)" />
              <rect x="5" y="51" width="16" height="3" fill="var(--alu)" />
            </g>
          ))}
        </svg>
      );
    case 4:
      return (
        <svg viewBox="0 0 200 90" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i} transform={`translate(8 ${6 + i * 14})`}>
              <rect width="9" height="9" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
              <rect x="18" y="3" width={90 + ((i * 37) % 60)} height="3" fill="var(--alu)" />
              <rect
                x="160"
                y="0"
                width="30"
                height="9"
                fill="none"
                stroke={i === 2 || i === 4 ? 'var(--bad)' : 'var(--ok)'}
                strokeWidth="1.2"
              />
            </g>
          ))}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 90" aria-hidden="true">
          <rect x="40" y="4" width="120" height="82" fill="var(--white)" stroke="var(--ink)" strokeWidth="1.4" />
          <rect x="50" y="14" width="60" height="6" fill="var(--ink)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="50" y={30 + i * 10} width={96 - (i % 2) * 22} height="3" fill="var(--alu)" />
          ))}
          <rect x="50" y="29" width="40" height="5" fill="var(--accent)" />
        </svg>
      );
  }
};

const REEL = [
  { t: 'An explorer for 105 million sensor readings', w: 'At work', d: 'Flags the bad readings instead of hiding them.' },
  { t: 'A schedule planner that runs 10,000 what-ifs', w: 'At work', d: '“How likely are we to finish by the 30th?”' },
  { t: 'A booking system for a tap-truck hire business', w: 'At home', d: 'Enquiry to quote to booking. Built in three days.' },
  { t: 'Three iPhone apps, in TestFlight', w: 'At home', d: 'Small, personal tools. No app-developer training.' },
  { t: 'Document reviews with 100+ page-referenced findings', w: 'At work', d: 'Every finding points at a page you can check.' },
  { t: 'A morning brief that writes itself at 6:30', w: 'At work', d: 'Email, calendar and chat, read before I wake up.' },
];

const Reel: Page = () => {
  const active = useIsActivePage();
  const [hot, setHot] = useState(-1);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setHot((h) => (h + 1) % REEL.length), 2200);
    return () => clearInterval(id);
  }, [active]);
  return (
    <Frame label="Six months of evenings">
      <Head eb={eb('why', 'Why now · proof first')} title="Six months of evenings and work hours" />
      <PageNo />
      <div className="b1-reel">
        {REEL.map((r, i) => (
          <div key={r.t} className={`dk-tile ${i === hot ? 'hot' : ''}`}>
            <div className="pic">
              <Tiny k={i} />
            </div>
            <span className="dk-k">{r.w}</span>
            <b>{r.t}</b>
            <span className="d">{r.d}</span>
          </div>
        ))}
      </div>
      <div className="b1-reel-cap">
        One engineer. No software team. <Hl>21 projects</Hl> since May.
      </div>
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
      <div className="nums3">
        {[
          ['8 hrs', 'to build a 3D island game'],
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
        <p className="dk-quote" style={{ fontSize: '3.2cqw' }}>
          “99% of my prompts were ‘Add X and Y’ or ‘This looks weird, make it better’.”
        </p>
        <span className="dk-attr">Dan Greenheck, on building Tidewater</span>
      </blockquote>
      <p className="dk-body" style={{ fontSize: '1.4cqw' }}>
        The prompts were plain. <Hl>The persistence was the skill.</Hl> Nobody needed a prompt course.
      </p>
    </div>
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
    Reel,
    '2 min. The tiles light up in turn. Proof before theory: this is what one non-software person built in six months. Do not explain each tile; let it run once, then say: "I am not a developer. I am an engineer with a day job." If you have the 60-second screen reel ready, play it here instead.',
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
    '2 min. The point is not the money. It is the quote: the prompts were plain English. Persistence beats clever wording. Be honest that big builds cost real money, and that today\'s work fits easily in a normal plan.',
  ],
  [UseThem, '30 sec. Read the quote, pause, move on. Transition straight into the map of the apps.'],
];
