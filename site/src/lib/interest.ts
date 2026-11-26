import type { Sql } from './db';

export const USES = ['chatgpt', 'claude', 'both', 'neither'] as const;
export type Uses = (typeof USES)[number];

/** The form's value for "the next public day": a waitlist row with no cohort. */
export const NEXT_DAY = 'next';

export interface InterestInput {
  day: string;
  name: string;
  email: string;
  company: string | null;
  uses: Uses | null;
  note: string | null;
  /** Honeypot. */
  website: string;
}

export type InterestResult =
  | { ok: true; message: string }
  | { ok: false; error: 'invalid' | 'not_found'; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readInterest(get: (k: string) => unknown): InterestInput {
  const str = (k: string, max: number) => String(get(k) ?? '').trim().slice(0, max);
  const uses = str('uses', 20);
  return {
    day: str('day', 80) || NEXT_DAY,
    name: str('name', 120),
    email: str('email', 200).toLowerCase(),
    company: str('company', 120) || null,
    uses: (USES as readonly string[]).includes(uses) ? (uses as Uses) : null,
    note: str('note', 800) || null,
    website: str('website', 200),
  };
}

/**
 * Adds someone to a listed day's waitlist, or to the general list for the next
 * public day. Asking twice updates the row rather than failing.
 */
export async function addInterest(sql: Sql, input: InterestInput): Promise<InterestResult> {
  if (input.website) return { ok: true, message: 'Thanks. You are on the list.' };
  if (!input.name || !EMAIL.test(input.email)) {
    return { ok: false, error: 'invalid', message: 'Please give your name and a valid email.' };
  }
  const { name, email, company, uses, note } = input;

  if (input.day === NEXT_DAY) {
    await sql`
      insert into waitlist (cohort_id, name, email, company, uses, note)
      values (null, ${name}, ${email}, ${company}, ${uses}, ${note})
      on conflict (lower(email)) where cohort_id is null do update
        set name = excluded.name,
            company = coalesce(excluded.company, waitlist.company),
            uses = coalesce(excluded.uses, waitlist.uses),
            note = coalesce(excluded.note, waitlist.note),
            removed_at = null
    `;
    return { ok: true, message: 'Thanks. You are on the list, and you will hear about the next public day before anyone else.' };
  }

  const rows = await sql`
    insert into waitlist (cohort_id, name, email, company, uses, note)
    select id, ${name}, ${email}, ${company}, ${uses}, ${note}
    from cohorts where slug = ${input.day} and status in ('open', 'closed') and ends_at > now()
    on conflict (cohort_id, lower(email)) do update
      set name = excluded.name,
          company = coalesce(excluded.company, waitlist.company),
          uses = coalesce(excluded.uses, waitlist.uses),
          note = coalesce(excluded.note, waitlist.note),
          removed_at = null
    returning id
  `;
  if (!rows.length) return { ok: false, error: 'not_found', message: 'That day is no longer listed. Pick another, or the next public day.' };
  return { ok: true, message: 'Thanks. Your request is in, and Colin will email you about a seat.' };
}

export interface GeneralInterest {
  id: string;
  name: string;
  email: string;
  company: string | null;
  uses: Uses | null;
  note: string | null;
  created_at: Date;
}

export async function listGeneralInterest(sql: Sql): Promise<GeneralInterest[]> {
  return sql<GeneralInterest[]>`
    select id, name, email, company, uses, note, created_at
    from waitlist where cohort_id is null and removed_at is null order by created_at desc
  `;
}
