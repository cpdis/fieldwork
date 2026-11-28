import type { Sql } from './db';
import type { Rendered } from './email-templates';
import { FALLBACK_DAYS } from './site-content';

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
    await addGeneral(sql, input, note);
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
  if (!rows.length) {
    // A day shown from FALLBACK_DAYS (no dated cohort in the admin yet) has no row to
    // attach to, so the request goes on the general list with the day named in the note.
    const fallback = FALLBACK_DAYS.find((d) => d.slug === input.day);
    if (!fallback) return { ok: false, error: 'not_found', message: 'That day is no longer listed. Pick another, or the next public day.' };
    await addGeneral(sql, input, [`Asked for a seat on: ${fallback.title}`, note].filter(Boolean).join('\n'));
  }
  return { ok: true, message: 'Thanks. Your request is in, and Colin will email you about a seat.' };
}

/** One general-list row per email (no cohort); asking again updates it. */
async function addGeneral(sql: Sql, input: InterestInput, note: string | null) {
  const { name, email, company, uses } = input;
  await sql`
    insert into waitlist (cohort_id, name, email, company, uses, note)
    values (null, ${name}, ${email}, ${company}, ${uses}, ${note || null})
    on conflict (lower(email)) where cohort_id is null do update
      set name = excluded.name,
          company = coalesce(excluded.company, waitlist.company),
          uses = coalesce(excluded.uses, waitlist.uses),
          note = coalesce(excluded.note, waitlist.note),
          removed_at = null
  `;
}

/**
 * The note Colin gets for each new request, so one never sits unseen in the
 * database. Plain text; the request is also in the admin and its CSV export.
 */
export function renderInterestAlert(input: InterestInput, dayLabel: string): Rendered {
  const lines = [
    `Day: ${dayLabel}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.company ? `Business: ${input.company}` : null,
    input.uses ? `Pays for: ${input.uses}` : null,
    input.note ? `Note: ${input.note}` : null,
  ].filter(Boolean) as string[];
  const text = lines.join('\n');
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return {
    subject: `Seat request: ${input.name} (${dayLabel})`,
    text,
    html: `<pre style="font:14px/1.5 ui-monospace,monospace">${esc(text)}</pre>`,
  };
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
