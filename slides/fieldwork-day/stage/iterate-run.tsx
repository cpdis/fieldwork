/*
 * Block 4 "First draft to fifth": five messages to an agent, and the site it builds,
 * staged with the Stageshow kit (vendor/, MIT, Benji Taylor).
 *
 * Beat n types message n + 1 into the composer, sends it, and the browser on the right
 * changes to what that message produced. Message 4 screenshots the page and pins the three
 * problems it fixes; message 5 marks what it takes away. Drawn at scale 1 (see staged.tsx),
 * so every size here is cqw. The Ridgeline site mocks are styled in mocks.css.
 */
import { Fragment } from 'react';
import { Browser } from '../kit';
import type { Script } from './vendor/kit/act';
import { Collapse } from './vendor/kit/motion/Collapse';
import { States } from './vendor/kit/motion/States';
import { Check } from './vendor/kit/parts/Check';
import { Staged } from './staged';
import './iterate-run.css';

export const VERSIONS: { p: string; why: string; reply: string[] }[] = [
  {
    p: 'Make a website for my surveying business.',
    why: 'The average of every website. Slogans, stock picture, three cards.',
    reply: ['Made a one-page site: a welcome banner, a stock photo and three feature cards.'],
  },
  {
    p: 'Here is our about.md and price list. Use our real services and prices. No slogans.',
    why: 'Context first: now it says something true.',
    reply: ['Rebuilt it from about.md and the price list: your real services and prices, no slogans.'],
  },
  {
    p: 'Make it calmer, like these three sites (screenshots attached). Left-aligned. Our green.',
    why: 'References give it a point of view.',
    reply: ['Matched the three references: left-aligned, more space, your green.'],
  },
  {
    p: 'Screenshot it. Critique it like a designer. Fix the top three problems.',
    why: 'The critic loop: hierarchy, phone number, one clear action.',
    reply: [
      'Took a screenshot. Three problems:',
      '1. The headline says who you are, not what the customer gets.',
      '2. No phone number anywhere.',
      '3. “Get a quote” is vague. One clear action: book a survey.',
      'Fixed all three.',
    ],
  },
  {
    p: 'Remove anything that isn’t helping someone book a survey.',
    why: 'Taking things away is the step most people skip.',
    reply: ['Removed the photo, the service blurbs, and the Testimonials, Our team and News links.'],
  },
];
export const BEAT_COUNT = VERSIONS.length;

/** The site mock each message produces (mock 3 is unused: it was a halfway step). */
const SITE = [0, 1, 2, 4, 5];

type S = {
  /** what is in the composer */
  draft: string;
  /** messages sent, replies finished */
  sent: number;
  replied: number;
  busy: boolean;
  /** reply lines shown while the agent is still working */
  lines: number;
  /** index into SITE, or -1 for the empty folder */
  site: number;
  flash: boolean;
  pins: number;
  /** 1: marked for removal, 2: fading out */
  cut: number;
};

const W = 1776;
const H = 756;

const BASE: S = { draft: '', sent: 0, replied: 0, busy: false, lines: 0, site: -1, flash: false, pins: 0, cut: 0 };
const END: S[] = VERSIONS.map((_, i) => ({ ...BASE, sent: i + 1, replied: i + 1, site: i }));

type Act = Parameters<Script<S>>[0];

/** Type the message, send it, and start working. */
const ask = async (a: Act, i: number) => {
  await a.wait(400);
  await a.type('draft', VERSIONS[i].p, { interval: 17 });
  await a.wait(300);
  await a.set({ draft: '', sent: i + 1 });
  await a.wait(380);
  await a.set({ busy: true });
};
const finish = (a: Act, i: number) => a.set({ busy: false, lines: 0, site: i, replied: i + 1, pins: 0, cut: 0 });

const plain =
  (i: number): Script<S> =>
  async (a) => {
    await ask(a, i);
    await a.wait(1500);
    await finish(a, i);
  };

const BEATS: Script<S>[] = [
  plain(0),
  plain(1),
  plain(2),
  async (a) => {
    await ask(a, 3);
    await a.wait(700);
    await a.set({ flash: true });
    await a.wait(140);
    await a.set({ flash: false, lines: 1 });
    for (let p = 1; p <= 3; p++) {
      await a.wait(p === 1 ? 650 : 900);
      await a.set({ pins: p, lines: p + 1 });
    }
    await a.wait(1500);
    await finish(a, 3);
  },
  async (a) => {
    await ask(a, 4);
    await a.wait(800);
    await a.set({ cut: 1 });
    await a.wait(1700);
    await a.set({ cut: 2 });
    await a.wait(650);
    await finish(a, 4);
  },
];

/* ---------- the Ridgeline site, five ways (moved from b4-make.tsx) ---------- */
const RidgelineSite = ({ v }: { v: number }) => {
  if (v === 0)
    return (
      <div className="b4-r0">
        <div className="nav">
          <b>Ridgeline Surveying</b>
          <span>Home · About · Services · Contact</span>
        </div>
        <div className="hero">
          <h1>Welcome to Ridgeline Surveying</h1>
          <p>Your trusted partner for all your surveying needs. Precision. Excellence. Integrity.</p>
          <span className="btn">Get Started</span>
        </div>
        <div className="img">[ stock photo: man with tripod at sunset ]</div>
        <div className="cards">
          {['Accuracy', 'Reliability', 'Experience'].map((c) => (
            <div key={c}>
              <i />
              <b>{c}</b>
              <span>We deliver {c.toLowerCase()} on every project, every time.</span>
            </div>
          ))}
        </div>
      </div>
    );
  if (v === 1)
    return (
      <div className="b4-r0 b4-r1">
        <div className="nav">
          <b>Ridgeline Surveying</b>
          <span>Home · Services · Prices · Contact</span>
        </div>
        <div className="hero">
          <h1>Licensed land surveyors in Perth and Peel</h1>
          <p>Boundary, feature and subdivision surveys for homeowners, builders and developers. Six staff, since 2011.</p>
          <span className="btn">Get a quote</span>
        </div>
        <div className="cards">
          {[
            ['Boundary re-establishment', 'from $1,450 + GST'],
            ['Feature and level survey', 'from $1,900 + GST'],
            ['Subdivision', 'quoted per lot'],
          ].map(([c, p]) => (
            <div key={c}>
              <i />
              <b>{c}</b>
              <span>{p}</span>
            </div>
          ))}
        </div>
      </div>
    );
  return (
    <div className={`b4-rg v${v}`}>
      <div className="nav">
        <b>
          <span className="mk" />
          Ridgeline
        </b>
        <span className="links">
          <span>Services</span>
          <span>Prices</span>
          {v >= 3 && <span className="ph">(08) 5550 0142</span>}
        </span>
      </div>
      <div className="hero">
        <div>
          <h1>{v >= 3 ? 'Know exactly where your boundary is.' : 'Licensed land surveyors in Perth and Peel'}</h1>
          <p>
            {v >= 3
              ? 'Licensed surveyors for Perth and Peel homeowners and builders. Most boundary surveys done within 7 working days.'
              : 'Boundary, feature and subdivision surveys for homeowners, builders and developers. Six staff, since 2011.'}
          </p>
          <div className="act">
            <span className="btn">{v >= 3 ? 'Book a survey' : 'Get a quote'}</span>
            {v === 3 && <span className="btn2">See prices</span>}
          </div>
        </div>
        {v < 5 && <div className="photo">{v >= 3 ? 'photo: a real job, a real peg' : 'photo'}</div>}
      </div>
      <div className="svc">
        {[
          ['Boundary re-establishment', '$1,450', 'Pegs back in, fence questions answered.'],
          ['Feature and level survey', '$1,900', 'What your designer needs before plans.'],
          ['Subdivision', 'Quoted', 'Per lot, from first sketch to new titles.'],
        ].map(([t, p, d]) => (
          <div key={t}>
            <span className="p">{p}</span>
            <b>{t}</b>
            {v !== 5 && <span>{d}</span>}
          </div>
        ))}
      </div>
      {v === 4 && (
        <div className="how">
          <span>1 · Book online</span>
          <span>2 · We survey</span>
          <span>3 · Plan and report in 7 days</span>
          <span className="x">Testimonials</span>
          <span className="x">Our team</span>
          <span className="x">News</span>
        </div>
      )}
      {v === 5 && (
        <div className="how">
          <span>1 · Book online</span>
          <span>2 · We survey</span>
          <span>3 · Plan and report in 7 days</span>
        </div>
      )}
    </div>
  );
};

const Send = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Chat = ({ s }: { s: S }) => (
  <div className="ff-chat">
    <div className="ff-bar">
      <span className="ff-dots">
        <i />
        <i />
        <i />
      </span>
      <span>ridgeline-site</span>
      <span className="ff-files">about.md · prices.csv</span>
    </div>
    <div className="ff-thread">
      {VERSIONS.map((v, i) => {
        const working = i === s.sent - 1 && i >= s.replied;
        return (
          <Fragment key={v.p}>
            <Collapse open={i < s.sent} reveal="drop" from="below">
              <div className="ff-me">
                <p>{v.p}</p>
              </div>
            </Collapse>
            <Collapse open={i < s.replied || (working && s.busy)} reveal="drop" from="below">
              <div className="ff-ai">
                {v.reply.map((t, j) => (
                  <Collapse key={t} open={i < s.replied || (working && j < s.lines)} reveal="clip">
                    <p className={/^\d\./.test(t) ? 'ff-li' : undefined}>{t}</p>
                  </Collapse>
                ))}
                <Collapse open={working && s.busy} reveal="clip">
                  <span className="ff-st">
                    <Check on={false} pending size={17} />
                    Working
                  </span>
                </Collapse>
                <Collapse open={i < s.replied} reveal="clip">
                  <span className="ff-st">
                    <Check on size={17} />
                    Updated index.html
                  </span>
                </Collapse>
              </div>
            </Collapse>
          </Fragment>
        );
      })}
    </div>
    <div className="ff-compose" data-on={s.draft ? true : undefined}>
      <span className="ff-input">
        {s.draft ? (
          <>
            {s.draft}
            <i className="ff-caret" />
          </>
        ) : (
          <span className="ff-ph">Ask for a change</span>
        )}
      </span>
      <span className="ff-send">
        <Send />
      </span>
    </div>
  </div>
);

const Site = ({ s }: { s: S }) => (
  <Browser url="localhost:3000" style={{ height: '100%' }}>
    <div className="ff-sites" data-pins={s.pins || undefined} data-cut={s.cut || undefined}>
      <div className="ff-site ff-empty" data-on={s.site < 0 || undefined}>
        <span className="dk-k">Nothing here yet</span>
      </div>
      {SITE.map((v, i) => (
        <div key={v} className="ff-site" data-v={v} data-on={i === s.site || undefined}>
          <RidgelineSite v={v} />
        </div>
      ))}
      <i className="ff-load" data-on={s.busy || undefined} />
      <i className="ff-flash" data-on={s.flash || undefined} />
    </div>
  </Browser>
);

export const IterateRun = ({ beat, take, live }: { beat: number; take: number; live: boolean }) => (
  <div className="ff">
    <Staged<S> beat={beat} take={take} live={live} base={BASE} ends={END} beats={BEATS} width={W} height={H}>
      {(s) => (
        <div className="ff-scene">
          <Chat s={s} />
          <div className="ff-why" data-empty={s.replied === 0 || undefined}>
            <States
              value={String(s.replied - 1)}
              align="start"
              states={Object.fromEntries([['-1', <span key="-1" />], ...VERSIONS.map((v, i) => [String(i), <span key={i}>{v.why}</span>])])}
            />
          </div>
          <div className="ff-browser">
            <Site s={s} />
          </div>
        </div>
      )}
    </Staged>
  </div>
);
