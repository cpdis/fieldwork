import Link from 'next/link';
import { Mark, Seats } from '@/components/Chrome';
import { BothApps } from '@/components/marketing/BothApps';
import { Enhance } from '@/components/marketing/Enhance';
import { NEXT_DAY } from '@/lib/interest';
import { getPublicDays } from '@/lib/public-days';
import { CONTACT_EMAIL, DAY, FAQ, PRICE_NOTES, PRICES, type PublicDay } from '@/lib/site-content';
import { formatDate, formatMoney, formatTime } from '@/lib/time';
import './marketing.css';

export const dynamic = 'force-dynamic';

const PROMPTS = [
  'Here’s a photo of the whiteboard from this morning. Turn it into a job list with who and when.',
  'Read these three supplier quotes and tell me which is cheapest delivered, and what each one leaves out.',
  'Chase every invoice older than 30 days. Draft the emails, don’t send them.',
  'Make our price list look like it came from the same business as our website.',
  'Every Monday at 7, read the weekend’s enquiries and put the ones worth a call at the top.',
];

type Search = Promise<Record<string, string | undefined>>;

const ERRORS: Record<string, string> = {
  invalid: 'Please give your name and a valid email.',
  not_found: 'That day is no longer listed. Pick another, or the next public day.',
  server: 'That didn’t go through. Please try again in a minute.',
};

function dayLine(d: PublicDay) {
  const s = new Date(d.starts_at);
  const e = new Date(d.ends_at);
  return `${formatDate(s)} · ${formatTime(s)} to ${formatTime(e)}`;
}

function DayCard({ d }: { d: PublicDay }) {
  const price = d.price_cents > 0 ? formatMoney(d.price_cents) : 'By invitation';
  return (
    <article className="day">
      <div className="day-h">
        <span className="eyebrow">{d.title}</span>
        <span className="num">{price}</span>
      </div>
      <p className="day-date">{dayLine(d)}</p>
      <p className="day-venue">{d.venue ? d.venue : <span className="tba">Venue to be announced</span>}</p>
      {d.seats_left !== null && d.mode !== 'request' ? (
        <>
          <Seats capacity={d.capacity} taken={d.seats_taken} held={d.seats_held} />
          <p className="mono" style={{ margin: '8px 0 0' }}>
            {d.seats_left > 0 ? `${d.seats_left} of ${d.capacity} seats left` : 'Full · waitlist open'}
          </p>
        </>
      ) : (
        <p className="mono" style={{ margin: '8px 0 0' }}>
          {d.capacity} seats
        </p>
      )}
      <div className="day-cta">
        {d.mode === 'open' ? (
          <Link className="btn ink" href={`/book/${d.slug}`}>
            Book and pay
          </Link>
        ) : (
          <a className="btn ink" href="#book" data-pick={d.slug}>
            {d.mode === 'full' ? 'Join the waitlist' : 'Ask for a seat'}
          </a>
        )}
      </div>
    </article>
  );
}

function Staff() {
  // A levelling staff, read in hours from 9:00. Alternate ink and paper blocks, one per half hour.
  return (
    <div className="staff" aria-hidden="true">
      <div className="staff-bar">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} className={i % 2 ? 'w' : 'k'} />
        ))}
      </div>
      <div className="staff-ticks">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} style={{ top: `${(i / 7) * 100}%` }}>
            {i + 9 > 12 ? i - 3 : i + 9}
          </span>
        ))}
      </div>
      <div className="staff-reading">
        <span className="rd-t" data-t="9:00" />
      </div>
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: Search }) {
  const q = await searchParams;
  const days = await getPublicDays();
  const first = days[0];
  const preview = process.env.SITE_PREVIEW === '1';
  const requestable = days.filter((d) => d.mode !== 'open');

  return (
    <div className="mk">
      <header className="mk-top">
        <div className="wrap mk-top-in">
          <a href="#top" className="brand">
            <Mark /> Fieldwork
          </a>
          <nav className="mk-nav" aria-label="Sections">
            <a href="#habit">The idea</a>
            <a href="#day">The day</a>
            <a href="#price">Price</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a className="btn small ink" href="#book">
            Ask for a seat
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="wrap hero">
          <div className="hero-copy">
            <p className="eyebrow">One day · in person · Perth</p>
            <h1>
              The models are already good enough. The gap is the habit of <span className="hl">asking</span>.
            </h1>
            <p className="lede">
              Fieldwork is one hands-on day for people who run a small business. ChatGPT and Claude side by side, on real work from your own week.
              You leave with things that already work, and the habit to keep going.
            </p>
            <div className="row hero-cta">
              <a className="btn primary" href="#book">
                Ask for a seat
              </a>
              <a className="btn quiet" href="#day">
                See the day
              </a>
            </div>
            {first && (
              <dl className="facts">
                <div>
                  <dt>{first.title}</dt>
                  <dd>{formatDate(new Date(first.starts_at)).replace(/ \d{4}$/, '')}</dd>
                </div>
                <div>
                  <dt>Where</dt>
                  <dd>{first.venue ?? 'Perth · venue TBA'}</dd>
                </div>
                <div>
                  <dt>Hours</dt>
                  <dd>9:00 to 16:00</dd>
                </div>
                <div>
                  <dt>Seats</dt>
                  <dd>{first.capacity}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="ask" data-ask={JSON.stringify(PROMPTS)}>
            <p className="eyebrow">Worth typing in this week</p>
            <div className="composer">
              <p className="composer-text">
                <span className="typed" data-text={PROMPTS[0]} />
                <span className="caret" aria-hidden="true" />
              </p>
              <div className="composer-bar">
                <span className="mono">Attach</span>
                <span className="send" aria-hidden="true">
                  ↑
                </span>
              </div>
            </div>
            <ol className="ask-list">
              {PROMPTS.map((p, i) => (
                <li key={i}>
                  <button type="button" data-i={i} aria-current={i === 0 ? 'true' : undefined}>
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{p}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The habit */}
        <section className="wrap sec" id="habit">
          <div className="sec-h">
            <p className="eyebrow">
              <span className="idx">01</span> The idea
            </p>
            <h2>Most people tried it once, got a so-so answer, and stopped asking.</h2>
            <p className="lede">The tools moved on. The habit didn&rsquo;t. The day is built around three moves you can keep doing on Monday.</p>
          </div>
          <ol className="moves">
            <li>
              <span className="num">01</span>
              <h3>Type it in</h3>
              <p>Not a search box. Say the job the way you&rsquo;d brief a new starter, and attach the file it needs.</p>
            </li>
            <li>
              <span className="num">02</span>
              <h3>Read it like a draft</h3>
              <p>It is fast and mostly right. Check the numbers and the names, then tell it what&rsquo;s off. Fixing is quicker than starting again.</p>
            </li>
            <li>
              <span className="num">03</span>
              <h3>Ask again next model</h3>
              <p>Keep a list of what it couldn&rsquo;t do. Try each one again when a new model ships. Most of the list goes.</p>
            </li>
          </ol>
          <BothApps />
        </section>

        {/* The day */}
        <section className="wrap sec" id="day">
          <div className="sec-h">
            <p className="eyebrow">
              <span className="idx">02</span> The day
            </p>
            <h2>Seven labs, all on your own business.</h2>
            <p className="lede">
              Each block is one idea, both apps doing it, then a lab on your own files. One app is live in each block and the other is open on the same job,
              finished. Equal time for both across the day.
            </p>
          </div>
          <div className="day-grid">
            <Staff />
            <ol className="blocks">
              {DAY.map((b) => (
                <li key={b.t} className={b.pause ? 'pause' : undefined} data-at={b.at} data-t={b.t} tabIndex={b.pause ? undefined : 0}>
                  <span className="t num">{b.t}</span>
                  <div className="b">
                    <h3>{b.name}</h3>
                    {b.does && <p>{b.does}</p>}
                  </div>
                  {b.leave ? (
                    <p className="leave">
                      <span className="mono">You leave with</span>
                      {b.leave}
                    </p>
                  ) : (
                    <span />
                  )}
                  {b.live ? <span className="live mono">{b.live} live</span> : <span />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Who runs it */}
        <section className="wrap sec who" id="who">
          <div className="sec-h">
            <p className="eyebrow">
              <span className="idx">03</span> Who runs it
            </p>
            <h2>A practitioner, not a guru.</h2>
          </div>
          <div className="who-grid">
            <div className="mono-badge" aria-hidden="true">
              CD
            </div>
            <div className="who-copy">
              <p>
                <strong>Colin Dismuke</strong> is an engineer and project manager in Perth. He uses these apps every working day, Codex at work and Claude at
                home, and in the last six months built 21 things for himself, including ten live websites and three iPhone apps.
              </p>
              <p className="muted">
                He works with one agent and a couple of helpers at a time, not hundreds. That is the scale a business owner can copy, and it is the scale the
                day teaches.
              </p>
            </div>
          </div>
        </section>

        {/* Price */}
        <section className="wrap sec" id="price">
          <div className="sec-h">
            <p className="eyebrow">
              <span className="idx">04</span> Price
            </p>
            <h2>One day, one price, lunch included.</h2>
          </div>
          <div className="prices">
            {PRICES.map((p) => (
              <div key={p.k} className={`price ${p.primary ? 'feat' : ''}`}>
                <p className="eyebrow">{p.k}</p>
                <p className="price-v">{p.v}</p>
                <p className="price-sub">{p.sub}</p>
                <ul>
                  {p.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <ul className="price-notes small muted">
            {PRICE_NOTES.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>

        {/* Book */}
        <section className="wrap sec" id="book">
          <div className="sec-h">
            <p className="eyebrow">
              <span className="idx">05</span> Dates
            </p>
            <h2>Ask for a seat.</h2>
            <p className="lede">Seats are few on purpose. Tell us which day, and you&rsquo;ll hear back by email.</p>
          </div>
          <div className="book-grid">
            <div className="days">
              {days.map((d) => (
                <DayCard key={d.slug} d={d} />
              ))}
              <article className="day ghost">
                <div className="day-h">
                  <span className="eyebrow">Next public day</span>
                  <span className="num">A$750 founding rate</span>
                </div>
                <p className="day-date">Early 2027 · date to come</p>
                <p className="day-venue muted">The list hears first.</p>
                <div className="day-cta">
                  <a className="btn quiet" href="#book" data-pick={NEXT_DAY}>
                    Put me on the list
                  </a>
                </div>
              </article>
            </div>

            <form className="ask-form" method="post" action="/api/interest" data-interest data-preview={preview ? '1' : undefined} noValidate>
              {q.sent ? (
                <p className="notice">Thanks. You&rsquo;re on the list.</p>
              ) : (
                q.error && ERRORS[q.error] && <p className="notice bad">{ERRORS[q.error]}</p>
              )}
              <div className="hp" aria-hidden="true">
                <label>
                  Website <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <fieldset className="pick">
                <legend>Which day?</legend>
                {requestable.map((d, i) => (
                  <label key={d.slug} className="opt">
                    <input type="radio" name="day" value={d.slug} defaultChecked={i === 0} />
                    <span>
                      <b>{d.title}</b>
                      <span className="muted small">{formatDate(new Date(d.starts_at))}</span>
                    </span>
                  </label>
                ))}
                <label className="opt">
                  <input type="radio" name="day" value={NEXT_DAY} defaultChecked={requestable.length === 0} />
                  <span>
                    <b>The next public day</b>
                    <span className="muted small">Early 2027</span>
                  </span>
                </label>
              </fieldset>
              <div className="grid2">
                <label>
                  Name <input name="name" required autoComplete="name" />
                </label>
                <label>
                  Email <input name="email" type="email" required autoComplete="email" />
                </label>
              </div>
              <label>
                Business <span className="muted">(optional)</span> <input name="company" autoComplete="organization" />
              </label>
              <fieldset className="pick inline">
                <legend>Which app do you pay for now?</legend>
                {[
                  ['chatgpt', 'ChatGPT'],
                  ['claude', 'Claude'],
                  ['both', 'Both'],
                  ['neither', 'Neither yet'],
                ].map(([v, l]) => (
                  <label key={v} className="opt chip">
                    <input type="radio" name="uses" value={v} />
                    <span>{l}</span>
                  </label>
                ))}
              </fieldset>
              <label>
                Anything we should know? <span className="muted">(optional)</span>
                <textarea name="note" placeholder="What you'd most like to hand over. Or: I'd like a day for my team." />
              </label>
              <p className="form-msg" role="status" aria-live="polite" />
              <div className="row">
                <button className="btn ink" type="submit">
                  Send
                </button>
                <span className="small muted">Your details go only to Colin. No newsletter, no sharing.</span>
              </div>
            </form>
          </div>
        </section>

        {/* FAQ */}
        <section className="wrap sec" id="faq">
          <div className="sec-h">
            <p className="eyebrow">
              <span className="idx">06</span> Questions
            </p>
            <h2>Before you ask.</h2>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="wrap mk-foot">
        <div className="mk-foot-in">
          <span className="brand">
            <Mark /> Fieldwork
          </span>
          <span className="small muted">Perth, Western Australia{CONTACT_EMAIL ? ' · ' : ''}{CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>}</span>
          <span className="mono">ChatGPT and Claude, side by side</span>
        </div>
        <p className="small muted fine">
          Fieldwork is independent. It is not made, endorsed or sponsored by OpenAI or Anthropic. ChatGPT and Codex are OpenAI products; Claude is an
          Anthropic product.
        </p>
      </footer>
      <Enhance />
    </div>
  );
}
