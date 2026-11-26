import { listCohorts } from './cohorts';
import { getSql } from './db';
import { FALLBACK_DAYS, type PublicDay } from './site-content';

/**
 * The days shown on the home page: open and closed cohorts from the admin, or
 * FALLBACK_DAYS when there is no database (a preview build) or nothing listed yet.
 */
export async function getPublicDays(): Promise<PublicDay[]> {
  if (!process.env.DATABASE_URL) return FALLBACK_DAYS;
  try {
    const cohorts = await listCohorts(getSql(), { publicOnly: true });
    if (!cohorts.length) return FALLBACK_DAYS;
    const now = new Date();
    return cohorts.map((c) => ({
      slug: c.slug,
      title: c.title.replace(/^Fieldwork:\s*/i, ''),
      starts_at: c.starts_at.toISOString(),
      ends_at: c.ends_at.toISOString(),
      venue: c.venue_name,
      capacity: c.capacity,
      price_cents: c.price_cents,
      mode:
        c.status === 'open' && c.price_cents > 0 && c.starts_at > now
          ? c.seats_left > 0
            ? 'open'
            : 'full'
          : 'request',
      seats_left: c.seats_left,
      seats_taken: c.seats_taken,
      seats_held: c.seats_held,
    }));
  } catch (err) {
    console.error('[home] cohorts unavailable, showing fallback days', err);
    return FALLBACK_DAYS;
  }
}
