import Link from 'next/link';
import { Footer, Header, Seats } from '@/components/Chrome';
import { listCohorts } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { formatMoney, formatRange } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cohorts = await listCohorts(getSql(), { publicOnly: true });
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 56 }}>
        <p className="eyebrow">One day · in person · Perth</p>
        <h1 style={{ marginTop: 12, maxWidth: '16ch' }}>
          Hand real work to <span className="hl">AI</span>, and check it.
        </h1>
        <p className="lede">
          A hands-on day for small business owners, using the Claude and ChatGPT desktop apps side by side on tasks from your own week.
        </p>

        <section style={{ marginTop: 56 }} className="stack">
          <h2>Upcoming days</h2>
          {cohorts.length === 0 && <p className="muted">No dates are open yet.</p>}
          {cohorts.map((c) => {
            const full = c.seats_left <= 0;
            return (
              <article key={c.id} className="card">
                <div className="spread">
                  <div>
                    <h3>{c.title}</h3>
                    <p className="muted small" style={{ margin: '4px 0 0' }}>
                      {formatRange(c.starts_at, c.ends_at)}
                      {c.venue_name ? ` · ${c.venue_name}` : ''}
                    </p>
                  </div>
                  <div className="row">
                    <span className="num">{formatMoney(c.price_cents, c.currency)}</span>
                    <Link className={`btn ${full || c.status !== 'open' ? '' : 'primary'}`} href={`/book/${c.slug}`}>
                      {c.status !== 'open' ? 'Join the waitlist' : full ? 'Full: join the waitlist' : 'Book a seat'}
                    </Link>
                  </div>
                </div>
                <Seats capacity={c.capacity} taken={c.seats_taken} held={c.seats_held} />
                <p className="mono" style={{ margin: '8px 0 0' }}>
                  {full ? 'No seats left' : `${c.seats_left} of ${c.capacity} seats left`}
                </p>
              </article>
            );
          })}
        </section>
      </main>
      <Footer />
    </>
  );
}
