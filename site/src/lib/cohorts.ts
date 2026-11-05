import type { Sql } from './db';
import type { Booking, Cohort, CohortWithCounts, WaitlistEntry, EmailLogRow } from './types';

function withLeft(rows: Omit<CohortWithCounts, 'seats_left'>[]): CohortWithCounts[] {
  return rows.map((r) => ({ ...r, seats_left: r.capacity - r.seats_taken - r.seats_held }));
}

export async function listCohorts(sql: Sql, opts: { publicOnly?: boolean } = {}): Promise<CohortWithCounts[]> {
  const rows = await sql<Omit<CohortWithCounts, 'seats_left'>[]>`
    select c.*,
      coalesce(sum(case when b.status in ('paid','comp') then 1 else 0 end), 0)::int as seats_taken,
      coalesce(sum(case when b.status = 'pending' and b.hold_expires_at > now() then 1 else 0 end), 0)::int as seats_held,
      (select count(*) from waitlist w where w.cohort_id = c.id and w.removed_at is null)::int as waitlist_count
    from cohorts c
    left join bookings b on b.cohort_id = c.id
    ${opts.publicOnly ? sql`where c.status in ('open','closed') and c.ends_at > now()` : sql``}
    group by c.id
    order by c.starts_at ${opts.publicOnly ? sql`asc` : sql`desc`}
  `;
  return withLeft(rows);
}

export async function getCohortBySlug(sql: Sql, slug: string): Promise<CohortWithCounts | null> {
  const rows = await listCohortsWhere(sql, sql`c.slug = ${slug}`);
  return rows[0] ?? null;
}

export async function getCohortById(sql: Sql, id: string): Promise<CohortWithCounts | null> {
  const rows = await listCohortsWhere(sql, sql`c.id = ${id}`);
  return rows[0] ?? null;
}

async function listCohortsWhere(sql: Sql, where: ReturnType<Sql>) {
  const rows = await sql<Omit<CohortWithCounts, 'seats_left'>[]>`
    select c.*,
      coalesce(sum(case when b.status in ('paid','comp') then 1 else 0 end), 0)::int as seats_taken,
      coalesce(sum(case when b.status = 'pending' and b.hold_expires_at > now() then 1 else 0 end), 0)::int as seats_held,
      (select count(*) from waitlist w where w.cohort_id = c.id and w.removed_at is null)::int as waitlist_count
    from cohorts c
    left join bookings b on b.cohort_id = c.id
    where ${where}
    group by c.id
  `;
  return withLeft(rows);
}

export async function listBookings(sql: Sql, cohortId: string): Promise<Booking[]> {
  return sql<Booking[]>`
    select * from bookings
    where cohort_id = ${cohortId}
    order by
      case status when 'paid' then 0 when 'comp' then 0 when 'pending' then 1 else 2 end,
      coalesce(paid_at, created_at)
  `;
}

export async function listWaitlist(sql: Sql, cohortId: string): Promise<WaitlistEntry[]> {
  return sql<WaitlistEntry[]>`
    select * from waitlist where cohort_id = ${cohortId} and removed_at is null order by created_at
  `;
}

export async function listEmailLog(sql: Sql, cohortId: string): Promise<EmailLogRow[]> {
  return sql<EmailLogRow[]>`
    select e.* from email_log e
    left join bookings b on b.id = e.booking_id
    left join waitlist w on w.id = e.waitlist_id
    where b.cohort_id = ${cohortId} or w.cohort_id = ${cohortId}
    order by e.created_at desc
  `;
}

export type CohortInput = Pick<
  Cohort,
  | 'slug'
  | 'title'
  | 'starts_at'
  | 'ends_at'
  | 'venue_name'
  | 'venue_address'
  | 'joining_notes'
  | 'capacity'
  | 'price_cents'
  | 'status'
  | 'pre_course_days'
  | 'follow_up_days'
>;

export async function insertCohort(sql: Sql, input: CohortInput): Promise<Cohort> {
  const [row] = await sql<Cohort[]>`insert into cohorts ${sql(input)} returning *`;
  return row;
}

export async function updateCohort(sql: Sql, id: string, input: CohortInput): Promise<Cohort> {
  const [row] = await sql<Cohort[]>`update cohorts set ${sql(input)} where id = ${id} returning *`;
  return row;
}
