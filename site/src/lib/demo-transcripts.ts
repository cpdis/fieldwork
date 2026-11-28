/**
 * Prompts and replies shown on the home page. Every reply here is copied word for
 * word from a real run in the app named, on the date in `captured`. Never write or
 * edit a reply by hand: run the prompt again and paste what comes back. A reply
 * left as null shows the prompt only.
 *
 * The businesses and figures in the prompts are made up. Claude runs were in an
 * incognito chat. ChatGPT runs of 28 Nov 2026 were in a temporary chat set to
 * Unpersonalized, so no memory or custom instructions shaped them (a temporary chat
 * is Personalized by default).
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
  ChatGPT: {
    app: 'ChatGPT',
    model: 'Thinking · Extra High',
    captured: '2026-11-28',
    replies: [
      "| Supplier | Conduit (40 m) | Delivery | Total delivered | Lead time | Exclusions |\n| --- | --- | --- | --- | --- | --- |\n| A – Northline | $272 | $85 | $357 | 2 days | Couplings; bends unspecified |\n| B – Coastal | $248 | $140 | $388 | 5 days | Bends unspecified |\n| **C – Harbour** | **$284** | **FREE** | **$284** | **Next day** | Couplings and bends |\n\n**Advice:** Choose Quote C — it's $73 cheaper than A and $104 cheaper than B, but confirm fitting costs and whether GST is included before ordering.",
      "14 couplings × $3.50 = **$49**.\n\n| Supplier | Conduit | Delivery | Couplings | Total delivered |\n| --- | --- | --- | --- | --- |\n| A – Northline | $272 | $85 | $49 | $406 |\n| B – Coastal | $248 | $140 | Included | $388 |\n| **C – Harbour** | **$284** | **Free** | **$49** | **$333** |\n\n**Advice:** Quote C is still cheapest, saving $55 over B and $73 over A, with next-day delivery. Bends are excluded from C and unspecified in A and B; GST remains unconfirmed.",
      "Compare the supplier quotes below for 40 m of 50 mm conduit, delivered to a site in Malaga, WA.\n\n- Include the full cost of conduit and delivery.\n- Allow for 14 couplings at $3.50 each ($49 total) where couplings are not included in the quote.\n- Apply any free delivery thresholds where applicable.\n- Identify all exclusions, including couplings, bends and other fittings.\n- Flag anything unspecified, including GST. Do not assume unspecified items are included.\n- Show the delivery lead time for each supplier.\n- Identify the cheapest total delivered price and the savings compared with the other quotes.\n\nPresent the results in a short table with columns for supplier, conduit cost, delivery, additional coupling cost, total delivered cost, lead time and exclusions.\n\nBold the cheapest quote and finish with one line of practical purchasing advice. Keep it concise.\n\n**Quotes:**\n\nJust paste your new quotes underneath. The quantities, coupling allowance and delivery location are already built into the instruction.",
    ],
  },
  Claude: {
    app: 'Claude',
    model: 'Opus 5.5 · Extra',
    captured: '2026-11-24',
    replies: [
      "| Quote | Pipe (40 m) | Delivery | **Total delivered** | Lead time | Leaves out |\n| --- | --- | --- | --- | --- | --- |\n| C – Harbour Trade | $284.00 | $0 (order is over $250) | **$284.00** | Next day | Couplings and bends |\n| A – Northline | $272.00 | $85 | $357.00 | 2 days | Couplings |\n| B – Coastal | $248.00 | $140 | $388.00 | 5 days | Nothing listed (couplings included) |\n\nC is cheapest unless its couplings and bends cost more than $73 (to lose to A) or $104 (to lose to B), so ask Harbour to price your fitting count, and check that all three quotes are GST-inclusive and for the same duty grade before ordering.",
      "| Quote | Pipe + delivery | Couplings (14 × $3.50) | **Total delivered** | Still excludes |\n| --- | --- | --- | --- | --- |\n| C – Harbour Trade | $284.00 | $49.00 | **$333.00** | Bends |\n| B – Coastal | $388.00 | Included | $388.00 | Nothing stated |\n| A – Northline | $357.00 | $49.00 | $406.00 | Nothing stated |\n\nWith couplings priced in, B now beats A. C is still cheapest by $55. That lead only disappears if bends cost more than $55 and B actually includes them. B and A don’t mention bends at all, so check that with them before you treat them as included.",
      "```\nCompare these supplier quotes and tell me which is cheapest delivered.\n\nJob: [quantity + item, e.g. 40 m of 50 mm conduit]\nSite: [suburb]\nFittings needed: [e.g. 14 couplings at $3.50 each; bends: count/price if known]\n\nQuotes:\n[paste quotes here]\n\nHow to work it out:\n1. Total delivered = quantity × unit price + delivery. Apply any free-delivery threshold to the material subtotal, and say if it's unclear whether the threshold counts fittings or GST.\n2. Where a quote excludes fittings I've priced above, add them at my price. Where it includes them, add nothing.\n3. Where a quote excludes something I haven't priced, don't guess a cost. Give the break-even instead: how much that item would have to cost before the quote stops being cheapest.\n4. Keep two kinds of gap separate: what a quote explicitly excludes, and what it simply doesn't mention. Never treat silence as included.\n5. Flag anything that would make the quotes not like-for-like: GST inclusion, product grade/spec, lead time.\n\nOutput: one short table, ranked cheapest first, with columns for material, delivery, fittings, total delivered, lead time, and what's still excluded or unstated. Then one line of advice saying what to confirm before ordering.\n```",
    ],
  },
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
    model: 'Thinking · Extra High',
    captured: '2026-11-28',
    prompt:
      'Draft a reminder for invoice 1042 to Harbour Fitouts: $2,140 incl. GST, issued 14 October, due 28 October. They didn’t reply to the first reminder on 4 November. Polite, short, Australian English. Don’t send it.',
    replies: ["**Second payment reminder – Invoice 1042**\n\nHi Harbour Fitouts team,\n\nJust following up on invoice 1042 for $2,140 (incl. GST), issued on 14 October and due on 28 October.\n\nWe haven’t received a response to our previous reminder sent on 4 November. Could you please confirm when we can expect payment?\n\nIf payment has already been made, please disregard this reminder.\n\nKind regards,\n[Your name]\n\nDraft only — nothing has been sent."],
  },
  {
    label: 'Whiteboard to job list',
    app: 'Claude',
    model: 'Opus 5.5 · Extra',
    captured: '2026-11-24',
    prompt: `Turn this morning's whiteboard into a job list: job, who, when. Flag anything with no owner.

Lot 14 Baldivis set-out — Sam — Tue
Re-peg boundary, Kelmscott (client called twice!)
Feature survey Midland — Priya + Jo — Thu/Fri
Order pegs + paint
Invoice Harbour Fitouts — chase again
Drone batteries — Jo`,
    replies: ["| Job | Who | When |\n| --- | --- | --- |\n| Lot 14 Baldivis set-out | Sam | Tue 24 Nov (today) |\n| Re-peg boundary, Kelmscott (client has called twice) | ⚠️ **No owner** | Not set |\n| Feature survey, Midland | Priya, Jo | Thu 26 / Fri 27 Nov |\n| Order pegs + paint | ⚠️ **No owner** | Not set |\n| Chase Harbour Fitouts invoice (again) | ⚠️ **No owner** | Not set |\n| Drone batteries | Jo | Not set |\n\n**Unowned (3):** Kelmscott re-peg, pegs + paint order, Harbour Fitouts invoice chase.\n\nA few dependencies worth assigning around:\n\n- **Kelmscott** is the most urgent unowned job, since the client is already chasing. It probably needs the pegs + paint order to land first.\n- **Drone batteries** have no date. If they’re for the Midland survey, they’re effectively due Wednesday."],
  },
];
