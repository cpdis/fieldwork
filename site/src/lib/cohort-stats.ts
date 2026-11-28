import type { Sql } from './db';
import type { CohortStatus } from './types';

export interface CohortStat {
  id: string;
  slug: string;
  title: string;
  status: CohortStatus;
  starts_at: Date;
  capacity: number;
  price_cents: number;
  currency: string;
  seats: number;
  revenue_cents: number;
  dropped: number;
  waitlist: number;
  responses: number;
  useful_avg: number | null;
  recommend_yes: number | null;
  /** Days before the start that each seat was taken (paid or comped), earliest first. */
  booked_days_before: number[];
}

/** One row per cohort: fill, money, waitlist and feedback, plus when the seats went. */
export async function cohortStats(sql: Sql): Promise<CohortStat[]> {
  return sql<CohortStat[]>`
    select c.id, c.slug, c.title, c.status, c.starts_at, c.capacity, c.price_cents, c.currency,
      count(b.id) filter (where b.status in ('paid', 'comp'))::int as seats,
      coalesce(sum(b.amount_total_cents) filter (where b.status = 'paid'), 0)::int as revenue_cents,
      count(b.id) filter (where b.status in ('cancelled', 'refunded'))::int as dropped,
      (select count(*) from waitlist w where w.cohort_id = c.id and w.removed_at is null)::int as waitlist,
      (select count(*) from feedback f where f.cohort_id = c.id)::int as responses,
      (select round(avg(useful)::numeric, 1)::float from feedback f where f.cohort_id = c.id) as useful_avg,
      (select (count(*) filter (where recommend = 'Yes'))::float / nullif(count(recommend), 0) from feedback f where f.cohort_id = c.id) as recommend_yes,
      coalesce(
        array_agg(greatest(0, floor(extract(epoch from (c.starts_at - coalesce(b.paid_at, b.created_at))) / 86400))::int
                  order by coalesce(b.paid_at, b.created_at))
          filter (where b.status in ('paid', 'comp')),
        '{}'
      ) as booked_days_before
    from cohorts c
    left join bookings b on b.cohort_id = c.id
    group by c.id
    order by c.starts_at desc
  `;
}

export interface WeekCount {
  week: Date;
  general: number;
  waitlist: number;
}

/** People asking to hear about a day, per week (Monday, Perth time), for the last `weeks` weeks. */
export async function interestByWeek(sql: Sql, weeks = 12): Promise<WeekCount[]> {
  return sql<WeekCount[]>`
    with w as (
      select generate_series(
        date_trunc('week', (now() at time zone 'Australia/Perth')) - make_interval(weeks => ${weeks - 1}),
        date_trunc('week', (now() at time zone 'Australia/Perth')),
        interval '1 week'
      ) as week
    )
    select w.week,
      (select count(*) from waitlist x where x.cohort_id is null and date_trunc('week', x.created_at at time zone 'Australia/Perth') = w.week)::int as general,
      (select count(*) from waitlist x where x.cohort_id is not null and date_trunc('week', x.created_at at time zone 'Australia/Perth') = w.week)::int as waitlist
    from w order by w.week
  `;
}

export async function revenueTotals(sql: Sql): Promise<{ paid_cents: number; seats: number; refunded_cents: number }> {
  const [row] = await sql<{ paid_cents: number; seats: number; refunded_cents: number }[]>`
    select
      coalesce(sum(amount_total_cents) filter (where status = 'paid'), 0)::int as paid_cents,
      count(*) filter (where status in ('paid', 'comp'))::int as seats,
      coalesce(sum(amount_total_cents) filter (where status = 'refunded'), 0)::int as refunded_cents
    from bookings
  `;
  return row;
}
