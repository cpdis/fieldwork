/**
 * Copy and settings for the marketing page at /. Dated days come from the cohorts
 * table (the admin); FALLBACK_DAYS is shown only when the database is unreachable
 * or has no public cohorts yet, so the page never goes blank.
 */

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || '';

export interface PublicDay {
  slug: string;
  title: string;
  /** ISO string with the +08:00 offset, or null while the date is still to be announced. */
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  capacity: number;
  price_cents: number;
  /** open: book and pay. request: listed, people ask for a seat (cohort status "closed"). */
  mode: 'open' | 'request' | 'full';
  seats_left: number | null;
  seats_taken: number;
  seats_held: number;
  note?: string;
}

export const FALLBACK_DAYS: PublicDay[] = [
  {
    slug: 'pilot-tba',
    title: 'Pilot day',
    starts_at: null,
    ends_at: null,
    venue: null,
    capacity: 10,
    price_cents: 0,
    mode: 'request',
    seats_left: null,
    seats_taken: 0,
    seats_held: 0,
  },
];

/** Price cards. Change here; a cohort's own price in the admin is what Checkout charges. */
export const PRICES = [
  {
    k: 'Pilot day',
    v: 'By invitation',
    sub: 'Date TBA',
    lines: ['Ten people who run their own business', 'In return: honest feedback and a two-week follow-up', 'Ask below if you would like a seat'],
  },
  {
    k: 'Founding day',
    v: 'A$750',
    sub: 'The first public day, early 2027',
    lines: ['The full day, at the founding rate', 'In return: a quote and one before-and-after number', 'The waitlist hears first'],
    primary: true,
  },
  {
    k: 'Public days',
    v: 'A$1,000',
    sub: 'Per seat, from then on',
    lines: ['8 to 12 seats a day, never more', 'Lunch, coffee and the companion page', 'Team days for one business: ask'],
  },
];

export const PRICE_NOTES = [
  'Prices are per person, in Australian dollars, and include lunch. Fieldwork is not registered for GST, so no GST is charged.',
  'Bring a laptop with ChatGPT or Claude on a paid plan. The plan is not included.',
  'Full refund up to 14 days before the day. After that, move to a later day or send someone in your place.',
];

export interface Block {
  t: string;
  /** Hours from 9:00, for the staff reading. */
  at: number;
  name: string;
  does: string;
  leave?: string;
  live?: 'ChatGPT' | 'Claude';
  pause?: boolean;
}

export const DAY: Block[] = [
  { t: '9:00', at: 0, name: 'Why now', does: 'The models are already good enough. Hands on keyboards by 9:10 with one real task, then four owners who already work this way.' },
  { t: '9:30', at: 0.5, name: 'The map of the apps', does: 'Chat, Work and Codex. Chat, Cowork and Code. Which plan, what stays private, what never to paste.', leave: 'A photo of a messy page, turned into a table', live: 'ChatGPT' },
  { t: '10:00', at: 1, name: 'Context is everything', does: 'Why the same question gets a better answer with the right files behind it, and where those files live.', leave: 'A Project that knows your business', live: 'Claude' },
  { t: '10:45', at: 1.75, name: 'Break', does: '', pause: true },
  { t: '11:00', at: 2, name: 'Making things that look good', does: 'The tells of a first draft, and four moves past it. Brand as a file the apps can read.', leave: 'A brand file and one finished piece for a customer', live: 'ChatGPT' },
  { t: '12:00', at: 3, name: 'Lunch', does: '', pause: true },
  { t: '13:00', at: 4, name: 'Agents and computer use', does: 'From answers to actions. When to connect an app and when to let it use the screen. Choosing by what is at stake.', leave: 'An admin job done by an agent, start to finish', live: 'Claude' },
  { t: '14:00', at: 5, name: 'Make it repeatable', does: 'Most of the week is the same work again. Sort each step: delete it, make it a rule, hand it to an agent, or keep it.', leave: 'Your first skill, tested on new input', live: 'ChatGPT' },
  { t: '14:45', at: 5.75, name: 'Break', does: '', pause: true },
  { t: '15:00', at: 6, name: 'Background agents', does: 'Work that runs while you do something else. Write the rules first, then the schedule.', leave: 'One job on a schedule', live: 'Claude' },
  { t: '15:30', at: 6.5, name: 'Trust and next steps', does: 'A ticked box is not a checked edit. An email that gives orders. Three rules, a number to beat, and a 30-day plan.', leave: 'A number to beat and a 30-day plan' },
  { t: '16:00', at: 7, name: 'Close', does: '', pause: true },
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Who is it for?',
    a: 'People who own or run a small business in Perth: professional services, trades and field services, property, surveying, mining services. If you have opened ChatGPT or Claude once, you are ready. You do not need to be technical.',
  },
  {
    q: 'ChatGPT or Claude?',
    a: 'Both, side by side, with equal time. Bring whichever one you already pay for. Every lab has steps for each, and you will see the other one do the same job, so you can judge for yourself.',
  },
  {
    q: 'What do I bring?',
    a: 'A laptop with the ChatGPT or Claude desktop app installed and signed in on a paid plan, and a folder of your own material: a price list, a few emails, a template you use, a photo of a whiteboard. A few days before the day, you get an email that walks you through the setup.',
  },
  {
    q: 'Will my business data be safe?',
    a: 'The day covers what each plan does with your data and what never to paste. You choose what to bring. What you make stays in your own accounts.',
  },
  {
    q: 'Is it a lecture?',
    a: 'No. Each block is one idea, both apps doing it, then a lab on your own business. About half the day is your hands on your keyboard.',
  },
  {
    q: 'Can you run it for my team?',
    a: 'Yes. A team day for one business is priced per day, not per seat. Use the form and say so in the note.',
  },
  {
    q: 'What if I can’t make it?',
    a: 'Full refund up to 14 days before the day. After that you can move to a later day or send someone in your place.',
  },
];
