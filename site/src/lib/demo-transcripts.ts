/**
 * Prompts and replies shown on the home page. Every reply here is copied word for
 * word from a real run in the app named, on the date in `captured`. Never write or
 * edit a reply by hand: run the prompt again and paste what comes back. A reply
 * left as null shows the prompt only.
 *
 * The businesses and figures in the prompts are made up.
 */

export type App = 'ChatGPT' | 'Claude';

export interface Run {
  app: App;
  /** What the app showed as the model, if it showed one. */
  model: string | null;
  /** Date of the run, e.g. '2026-11-24'. Null until captured. */
  captured: string | null;
  /** One reply per prompt, in order. Markdown subset: paragraphs, - lists, 1. lists, | tables |, **bold**. */
  replies: (string | null)[];
}

/* ---------- Same job, both apps (three turns in one chat) ---------- */

export const BOTH_APPS_STEPS = [
  { k: 'Ask', t: 'Say the job and paste the real numbers.' },
  { k: 'Read it like a draft', t: 'Push back on the one thing it missed.' },
  { k: 'Keep it for next time', t: 'Ask it to write the instruction.' },
];

export const BOTH_APPS_PROMPTS = [
  `Three quotes for 40 m of 50 mm conduit, delivered to a site in Malaga. Which is cheapest delivered, and what does each one leave out? Short table, then one line of advice.

Quote A, Northline Supplies: $6.80/m, delivery $85, 2 days, couplings not included.
Quote B, Coastal Wholesale: $6.20/m, delivery $140, 5 days, couplings included.
Quote C, Harbour Trade Supply: $7.10/m, free delivery on orders over $250, next day, couplings and bends not included.`,
  `Couplings are $3.50 each and we need 14. Redo the totals with couplings in.`,
  `Write that up as an instruction I can paste next time, so I only have to add the quotes.`,
];

export const BOTH_APPS_RUNS: Record<App, Run> = {
  ChatGPT: { app: 'ChatGPT', model: null, captured: null, replies: [null, null, null] },
  Claude: { app: 'Claude', model: null, captured: null, replies: [null, null, null] },
};

/* ---------- Hero: one ask and its reply, alternating apps ---------- */

export interface HeroRun extends Run {
  label: string;
  prompt: string;
}

export const HERO_RUNS: HeroRun[] = [
  {
    label: 'Chase an invoice',
    app: 'ChatGPT',
    model: null,
    captured: null,
    prompt:
      'Draft a reminder for invoice 1042 to Harbour Fitouts: $2,140 incl. GST, issued 14 October, due 28 October. They didn’t reply to the first reminder on 4 November. Polite, short, Australian English. Don’t send it.',
    replies: [null],
  },
  {
    label: 'Whiteboard to job list',
    app: 'Claude',
    model: null,
    captured: null,
    prompt: `Turn this morning's whiteboard into a job list: job, who, when. Flag anything with no owner.

Lot 14 Baldivis set-out — Sam — Tue
Re-peg boundary, Kelmscott (client called twice!)
Feature survey Midland — Priya + Jo — Thu/Fri
Order pegs + paint
Invoice Harbour Fitouts — chase again
Drone batteries — Jo`,
    replies: [null],
  },
];
