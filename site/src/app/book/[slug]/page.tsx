import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Footer, Header, Seats } from '@/components/Chrome';
import { getCohortBySlug } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { formatMoney, formatRange } from '@/lib/time';
import { CheckoutForm } from './CheckoutForm';
import { WaitlistForm } from './WaitlistForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

const ERRORS: Record<string, string> = {
  sold_out: 'Someone took the last seat a moment ago. Join the waitlist below and I will email you if one opens up.',
  closed: 'Bookings for this day have closed.',
  not_found: 'That date is no longer listed.',
  stripe: "Checkout didn't open. Nothing was charged. Please try again in a minute.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cohort = await getCohortBySlug(getSql(), (await params).slug);
  return { title: cohort?.title ?? 'Book' };
}

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const q = await searchParams;
  const cohort = await getCohortBySlug(getSql(), slug);
  if (!cohort || cohort.status === 'draft') notFound();

  const bookable = cohort.status === 'open' && cohort.seats_left > 0 && cohort.starts_at > new Date();

  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 48, maxWidth: 720 }}>
        <p className="eyebrow">{cohort.status === 'cancelled' ? 'Cancelled' : 'Book a seat'}</p>
        <h1 style={{ marginTop: 12 }}>{cohort.title}</h1>
        <p className="lede">{formatRange(cohort.starts_at, cohort.ends_at)}</p>
        {(cohort.venue_name || cohort.venue_address) && (
          <p className="muted" style={{ margin: '8px 0 0' }}>
            {[cohort.venue_name, cohort.venue_address].filter(Boolean).join(', ')}
          </p>
        )}

        {q.error && ERRORS[q.error] && (
          <p className="notice bad" style={{ marginTop: 24 }}>
            {ERRORS[q.error]}
          </p>
        )}
        {q.cancelled && (
          <p className="notice" style={{ marginTop: 24 }}>
            Checkout was cancelled and nothing was charged. Your seat is released.
          </p>
        )}

        <section className="card stack" style={{ marginTop: 32 }}>
          <div className="spread">
            <span className="num" style={{ fontSize: 28 }}>
              {formatMoney(cohort.price_cents, cohort.currency)}
            </span>
            <span className="mono">
              {cohort.seats_left > 0 ? `${cohort.seats_left} of ${cohort.capacity} seats left` : 'Full'}
            </span>
          </div>
          <Seats capacity={cohort.capacity} taken={cohort.seats_taken} held={cohort.seats_held} />

          {bookable ? (
            process.env.STRIPE_PUBLISHABLE_KEY ? (
              <CheckoutForm
                slug={cohort.slug}
                publishableKey={process.env.STRIPE_PUBLISHABLE_KEY}
                priceLabel={`${formatMoney(cohort.price_cents, cohort.currency)} for one seat`}
              />
            ) : (
              <p className="notice bad">Online booking isn&rsquo;t open yet. Email hello@fieldworkperth.com to book a seat.</p>
            )
          ) : (
            <div className="stack">
              <p className="small">
                {cohort.status === 'cancelled'
                  ? 'This day has been cancelled. Leave your details and I will tell you when the next one opens.'
                  : 'This day is full. Leave your details and I will email you if a seat opens up.'}
              </p>
              <WaitlistForm slug={cohort.slug} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
