import type { BookingStatus, CohortStatus } from '@/lib/types';

const COHORT: Record<CohortStatus, string> = { draft: 'mute', open: 'ok', closed: 'warn', cancelled: 'bad' };
const BOOKING: Record<BookingStatus, string> = {
  paid: 'ok',
  comp: 'ok',
  pending: 'warn',
  cancelled: 'bad',
  refunded: 'mute',
  expired: 'mute',
};

export function StatusTag({ status }: { status: CohortStatus | BookingStatus }) {
  const tone = (COHORT as Record<string, string>)[status] ?? (BOOKING as Record<string, string>)[status] ?? 'mute';
  return <span className={`tag ${tone}`}>{status}</span>;
}
