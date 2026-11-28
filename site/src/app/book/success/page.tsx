import Link from 'next/link';
import { Footer, Header } from '@/components/Chrome';
import { getSql } from '@/lib/db';
import { formatRange } from '@/lib/time';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Booked', robots: { index: false } };

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

  const view = describe(row);

  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 48, maxWidth: 720 }}>
        <p className="eyebrow">{view.eyebrow}</p>
        <h1 style={{ marginTop: 12 }}>{view.title}</h1>
        {row && (row.status === 'paid' || row.status === 'comp' || row.status === 'pending') ? (
          <p className="lede">
            {row.title}, {formatRange(row.starts_at, row.ends_at)}. {view.body}
          </p>
        ) : (
          <p className="lede">{view.body}</p>
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

/**
 * What to say for each booking state. Only a paid (or comp) booking says "You're in";
 * pending means Stripe sent the buyer back before the webhook landed.
 */
function describe(row: { status: string; email: string | null } | undefined) {
  const to = row?.email ? ` to ${row.email}` : '';
  switch (row?.status) {
    case 'paid':
    case 'comp':
      return { eyebrow: 'Confirmed', title: 'You\u2019re in.', body: `A confirmation is on its way${to}. Stripe sends your receipt separately.` };
    case 'pending':
      return {
        eyebrow: 'Confirming',
        title: 'Payment received.',
        body: `Stripe is confirming it now. A confirmation email follows${to} within a few minutes.`,
      };
    case 'expired':
    case 'cancelled':
    case 'refunded':
      return { eyebrow: 'Not booked', title: 'That booking isn\u2019t active.', body: 'Nothing more will be charged. Pick a day on the home page to book again.' };
    default:
      return {
        eyebrow: 'Booking',
        title: 'Nothing to show here.',
        body: 'If you just paid, your confirmation email is on its way. If it has not arrived in ten minutes, reply to any Fieldwork email or use the contact address below.',
      };
  }
}
