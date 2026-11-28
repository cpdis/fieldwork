import type { Sql } from './db';
import { formatDate, formatShortDate } from './time';

/** One thing on the admin overview that needs Colin, most urgent first. */
export interface Todo {
  key: string;
  title: string;
  detail: string;
  href: string;
  action: string;
  /** The main thing to do now: shown as the dark button. */
  primary?: boolean;
}

interface NextDay {
  id: string;
  title: string;
  slug: string;
  status: string;
  starts_at: Date;
  ends_at: Date;
  venue_name: string | null;
  pre_course_days: number;
  capacity: number;
  seats: number;
  held: number;
  waitlist: number;
  offered: number;
}

/**
 * Builds the list from what's in the database. Each rule is a plain query; nothing is stored,
 * so a to-do disappears as soon as the thing is done.
 */
export async function listTodos(sql: Sql, now = new Date()): Promise<Todo[]> {
  const todos: Todo[] = [];

  const days = await sql<NextDay[]>`
    select c.id, c.title, c.slug, c.status, c.starts_at, c.ends_at, c.venue_name, c.pre_course_days, c.capacity,
      count(b.id) filter (where b.status in ('paid', 'comp'))::int as seats,
      count(b.id) filter (where b.status = 'pending' and b.hold_expires_at > ${now})::int as held,
      (select count(*) from waitlist w where w.cohort_id = c.id and w.removed_at is null)::int as waitlist,
      (select count(*) from waitlist w where w.cohort_id = c.id and w.removed_at is null and w.offered_at is not null)::int as offered
    from cohorts c left join bookings b on b.cohort_id = c.id
    where c.status in ('open', 'closed') and c.ends_at > ${now} and c.starts_at < ${now}::timestamptz + interval '60 days'
    group by c.id
    order by c.starts_at
  `;

  for (const d of days) {
    const when = formatShortDate(d.starts_at);
    const preCourse = new Date(d.starts_at.getTime() - d.pre_course_days * 86_400_000);
    const soon = preCourse.getTime() - now.getTime() < 3 * 86_400_000;
    if (!d.venue_name) {
      todos.push({
        key: `venue:${d.id}`,
        title: `Set the venue for ${when}`,
        detail:
          preCourse > now && soon
            ? `The pre-course email goes ${formatDate(preCourse)} and says “venue to be announced” until you do.`
            : `${d.title} has no venue yet. The pre-course email uses it.`,
        href: `/admin/cohorts/${d.id}/edit`,
        action: 'Edit day',
        primary: true,
      });
    }
    const left = d.capacity - d.seats - d.held;
    const waiting = d.waitlist - d.offered;
    if (left > 0 && waiting > 0) {
      todos.push({
        key: `seats:${d.id}`,
        title: `${left} ${left === 1 ? 'seat' : 'seats'} open, ${waiting} on the waitlist`,
        detail: `Send a seat offer from ${d.title} (${when}).`,
        href: `/admin/cohorts/${d.id}#waitlist`,
        action: 'Offer seats',
      });
    }
  }

  const [notes] = await sql<{ n: number; links: string[] | null; mine: number }[]>`
    select count(*)::int as n,
      array_agg(distinct l.name) filter (where l.name is not null) as links,
      count(*) filter (where n.link_id is null)::int as mine
    from deck_notes n left join deck_links l on l.id = n.link_id
    where n.done_at is null
  `;
  if (notes.n > 0) {
    const from = [...(notes.links ?? []), ...(notes.mine > 0 ? ['you'] : [])];
    todos.push({
      key: 'notes',
      title: `${notes.n} ${notes.n === 1 ? 'note' : 'notes'} on the deck`,
      detail: `From ${joinNames(from)}.`,
      href: '/admin/deck#notes',
      action: 'Read',
    });
  }

  const unopened = await sql<{ id: string; name: string; created_at: Date; expires_at: Date | null }[]>`
    select id, name, created_at, expires_at from deck_links
    where revoked_at is null and (expires_at is null or expires_at > ${now}) and open_count = 0
      and created_at < ${now}::timestamptz - interval '2 days'
    order by created_at limit 3
  `;
  for (const l of unopened) {
    const days = Math.floor((now.getTime() - l.created_at.getTime()) / 86_400_000);
    todos.push({
      key: `link:${l.id}`,
      title: `${l.name} hasn’t opened their link`,
      detail: `Made ${days} days ago${l.expires_at ? `, works until ${formatShortDate(l.expires_at)}` : ''}.`,
      href: '/admin/deck#links',
      action: 'Copy link',
    });
  }

  const unsummarised = await sql<{ id: string; title: string; n: number }[]>`
    select c.id, c.title, count(f.id)::int as n from cohorts c join feedback f on f.cohort_id = c.id
    where c.ends_at < ${now}
    group by c.id
    having count(f.id) > coalesce((select max(response_count) from feedback_summaries s where s.cohort_id = c.id), 0)
    order by max(f.created_at) desc limit 2
  `;
  for (const c of unsummarised) {
    todos.push({
      key: `summary:${c.id}`,
      title: `Summarise the feedback from ${c.title}`,
      detail: `${c.n} ${c.n === 1 ? 'answer' : 'answers'} in, not yet read by Claude.`,
      href: `/admin/cohorts/${c.id}#feedback`,
      action: 'Open',
    });
  }

  const drafts = await sql<{ id: string; slug: string; n: number }[]>`
    select c.id, c.slug, count(b.id)::int as n from cohorts c join bookings b on b.cohort_id = c.id
    where c.status = 'draft' and b.status in ('paid', 'comp')
    group by c.id order by c.created_at limit 2
  `;
  for (const d of drafts) {
    todos.push({
      key: `draft:${d.id}`,
      title: `Tidy up the draft day ${d.slug}`,
      detail: `It’s a draft with ${d.n} paid ${d.n === 1 ? 'booking' : 'bookings'}. Delete it if it was a test.`,
      href: `/admin/cohorts/${d.id}`,
      action: 'Open',
    });
  }

  return todos;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? 'nobody';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
