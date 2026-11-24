import Link from 'next/link';
import { Footer, Header } from '@/components/Chrome';
import { getSql } from '@/lib/db';
import { formatRange } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Booked' };

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function Success({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const sql = getSql();
  const [row] = session_id?.startsWith('cs_')
    ? await sql<{ status: string; title: string; starts_at: Date; ends_at: Date; email: string | null }[]>`
        select b.status, b.email, c.title, c.starts_at, c.ends_at
        from bookings b join cohorts c on c.id = b.cohort_id
        where b.stripe_checkout_session_id = ${session_id}
      `
    : [];

  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 48, maxWidth: 720 }}>
        <p className="eyebrow">{row?.status === 'paid' ? 'Confirmed' : 'Payment received'}</p>
        <h1 style={{ marginTop: 12 }}>You&rsquo;re in.</h1>
        {row ? (
          <p className="lede">
            {row.title}, {formatRange(row.starts_at, row.ends_at)}.
            {row.email ? ` A confirmation is on its way to ${row.email}.` : ' A confirmation email is on its way.'}
          </p>
        ) : (
          <p className="lede">A confirmation email is on its way. Stripe sends your receipt separately.</p>
        )}
        <p style={{ marginTop: 32 }}>
          <Link href="/" className="btn quiet">
            Back to Fieldwork
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
