import { siteUrl } from './config';
import { formatDate, formatRange, formatTime } from './time';
import type { Booking, Cohort, EmailKind, WaitlistEntry } from './types';

export interface Rendered {
  subject: string;
  text: string;
  html: string;
}

/**
 * Emails follow the site's Instrument direction: warm paper, ink, hairline rules,
 * mono labels, and one small yellow highlighter fill with ink on it. Mail clients
 * ignore most CSS, so the markup is tables with inline styles. Instrument Sans and
 * IBM Plex Mono load where the client allows web fonts (Apple Mail, iOS); Gmail and
 * Outlook fall back to Helvetica/Arial and Menlo/Consolas.
 */
const C = {
  paper: '#f6f6f3',
  ink: '#141518',
  muted: '#6a6d74',
  accent: '#ffc400',
  white: '#ffffff',
  rule: '#e1e2dc',
  alu: '#d6d8d1',
};
const SANS = "'Instrument Sans',Helvetica,Arial,sans-serif";
const MONO = "'IBM Plex Mono',Menlo,Consolas,monospace";

/** One email, described once and rendered to both HTML and plain text. */
interface Email {
  subject: string;
  /** Mono label above the heading, set on the yellow highlighter. */
  label: string;
  heading: string;
  greeting: string;
  /** Paragraphs. A paragraph whose lines all start with "- " becomes a list. */
  intro: string[];
  /** Label/value rows under a ruled top edge, like the facts row on the home page. */
  facts?: [string, string][];
  /** A titled list, e.g. what to bring. */
  list?: { title: string; items: string[] };
  cta?: { label: string; href: string };
  outro?: string[];
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function linkify(s: string): string {
  return s.replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:${C.ink};text-decoration:underline">${u}</a>`);
}

const inline = (s: string) => s.split('\n').map((l) => linkify(esc(l))).join('<br>');

function firstName(name: string | null): string {
  const n = name?.trim().split(/\s+/)[0];
  return n ? n : 'there';
}

function para(p: string): string {
  const lines = p.split('\n');
  if (lines.every((l) => l.startsWith('- '))) return bullets(lines.map((l) => l.slice(2)));
  return `<p style="margin:0 0 16px">${inline(p)}</p>`;
}

/** Square ink bullets, like the levelling-staff ticks on the site. */
function bullets(items: string[]): string {
  const rows = items
    .map(
      (i) => `<tr><td width="18" valign="top" style="padding:9px 0 0"><div style="width:6px;height:6px;background:${C.ink};font-size:0;line-height:0">&nbsp;</div></td>
<td style="padding:0 0 8px;font:15px/1.55 ${SANS};color:${C.ink}">${inline(i)}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px">${rows}</table>`;
}

const monoLabel = (s: string) =>
  `<div style="font:500 11px/1.4 ${MONO};letter-spacing:.06em;text-transform:uppercase;color:${C.muted}">${esc(s)}</div>`;

function factsBlock(facts: [string, string][]): string {
  const rows = facts
    .map(
      ([k, v], i) => `<tr><td style="padding:12px 16px 12px 0;${i ? `border-top:1px solid ${C.rule};` : ''}width:96px" valign="top">${monoLabel(k)}</td>
<td style="padding:11px 0;${i ? `border-top:1px solid ${C.rule};` : ''}font:500 15px/1.45 ${SANS};color:${C.ink}" valign="top">${inline(v)}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.ink};margin:8px 0 24px">${rows}</table>`;
}

function listBlock(list: NonNullable<Email['list']>): string {
  return `<div style="background:${C.white};border:1px solid ${C.alu};border-radius:10px;padding:18px 20px 4px;margin:0 0 24px">
<div style="margin:0 0 12px">${monoLabel(list.title)}</div>
${bullets(list.items)}</div>`;
}

function button(cta: NonNullable<Email['cta']>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px"><tr>
<td style="background:${C.ink};border-radius:6px"><a href="${esc(cta.href)}" style="display:inline-block;padding:13px 20px;font:500 15px/1 ${SANS};color:${C.paper};text-decoration:none">${esc(cta.label)}&nbsp;&nbsp;&rarr;</a></td>
</tr></table>`;
}

function toHtml(e: Email): string {
  const site = siteUrl();
  const host = site.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `<!doctype html>
<html lang="en-AU"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(e.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&amp;family=Instrument+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(e.intro[0] ?? '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper}"><tr><td align="center" style="padding:0 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

<tr><td style="padding:28px 0 18px;border-bottom:1px solid ${C.rule}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle"><a href="${site}" style="text-decoration:none;color:${C.ink}"><img src="${site}/email/mark.png" width="24" height="24" alt="" style="display:inline-block;vertical-align:middle;border:0"><span style="display:inline-block;vertical-align:middle;margin-left:10px;font:600 17px/1 ${SANS};letter-spacing:-.02em;color:${C.ink}">Fieldwork</span></a></td>
<td align="right" valign="middle" style="font:500 11px/1 ${MONO};letter-spacing:.06em;text-transform:uppercase;color:${C.muted}">Perth</td>
</tr></table>
</td></tr>

<tr><td style="padding:40px 0 8px;font:16px/1.55 ${SANS};color:${C.ink}">
<div style="margin:0 0 16px"><span style="background:${C.accent};color:${C.ink};font:500 11px/1 ${MONO};letter-spacing:.06em;text-transform:uppercase;padding:5px 7px;display:inline-block">${esc(e.label)}</span></div>
<h1 style="margin:0 0 24px;font:600 32px/1.1 ${SANS};letter-spacing:-.035em;color:${C.ink}">${esc(e.heading)}</h1>
<p style="margin:0 0 16px">${esc(e.greeting)}</p>
${e.intro.map(para).join('\n')}
${e.facts ? factsBlock(e.facts) : ''}
${e.list ? listBlock(e.list) : ''}
${e.cta ? button(e.cta) : ''}
${(e.outro ?? []).map(para).join('\n')}
<p style="margin:24px 0 0">Colin<br><span style="color:${C.muted}">Fieldwork</span></p>
</td></tr>

<tr><td style="padding:40px 0 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.rule}"><tr>
<td style="padding-top:14px;font:13px/1.5 ${SANS};color:${C.muted}">Fieldwork &middot; Perth, Western Australia<br><a href="${site}" style="color:${C.muted};text-decoration:underline">${esc(host)}</a></td>
<td align="right" valign="top" style="padding-top:16px;font:500 11px/1.4 ${MONO};letter-spacing:.04em;text-transform:uppercase;color:${C.muted}">ChatGPT and Claude,<br>side by side</td>
</tr></table>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

function toText(e: Email): string {
  const parts: string[] = [e.greeting, ...e.intro];
  if (e.facts) parts.push(e.facts.map(([k, v]) => `${k}: ${v}`).join('\n'));
  if (e.list) parts.push(`${e.list.title}:\n${e.list.items.map((i) => `- ${i}`).join('\n')}`);
  if (e.cta) parts.push(`${e.cta.label}: ${e.cta.href}`);
  parts.push(...(e.outro ?? []), 'Colin\nFieldwork');
  return parts.join('\n\n');
}

function render(e: Email): Rendered {
  return { subject: e.subject, text: toText(e), html: toHtml(e) };
}

function where(c: Cohort): string {
  return [c.venue_name, c.venue_address].filter(Boolean).join(', ') || 'Venue to be confirmed. I will email you the address.';
}

function notes(c: Cohort): string[] {
  return c.joining_notes?.trim() ? [c.joining_notes.trim()] : [];
}

const SETUP = [
  'A laptop (Mac or Windows) with its charger.',
  'The ChatGPT or Claude desktop app installed and signed in: whichever one you already pay for.',
  'A paid plan on that app: ChatGPT Plus or Claude Pro is enough. Bring the login if you use a work account.',
  'One real task from your week that you would happily hand to an assistant.',
];

export function renderBookingEmail(kind: Exclude<EmailKind, 'seat_offer'>, c: Cohort, b: Booking): Rendered {
  const greeting = `Hi ${firstName(b.name)},`;

  switch (kind) {
    case 'confirmation':
      return render({
        subject: `You're booked: ${c.title}, ${formatDate(c.starts_at)}`,
        label: 'Booking confirmed',
        heading: "You're booked.",
        greeting,
        intro: [`Your seat at ${c.title} is confirmed. Stripe sends your receipt separately.`],
        facts: [
          ['When', formatRange(c.starts_at, c.ends_at)],
          ['Where', where(c)],
          ...notes(c).map((n): [string, string] => ['Notes', n]),
        ],
        outro: ["I'll email again a few days before with a short setup checklist. If you have a question before then, reply to this email."],
      });

    case 'pre_course':
      return render({
        subject: `${c.title} is on ${formatDate(c.starts_at)}: what to bring`,
        label: 'A few days to go',
        heading: 'See you soon.',
        greeting,
        intro: [`We start at ${formatTime(c.starts_at)} sharp and finish by ${formatTime(c.ends_at)}. Here's what to bring.`],
        facts: [
          ['When', formatRange(c.starts_at, c.ends_at)],
          ['Where', where(c)],
          ...notes(c).map((n): [string, string] => ['Notes', n]),
        ],
        list: { title: 'Please bring', items: SETUP },
        outro: ["Installing and signing in at home saves about twenty minutes on the day. If anything won't install, reply and I'll help before the day."],
      });

    case 'follow_up': {
      // The site's own form unless FEEDBACK_URL points somewhere else.
      const feedback = process.env.FEEDBACK_URL || `${siteUrl()}/feedback?day=${encodeURIComponent(c.slug)}`;
      return render({
        subject: `Thanks for coming to ${c.title}`,
        label: 'Thank you',
        heading: 'Thanks for coming.',
        greeting,
        intro: [`Thanks for spending the day at ${c.title}.`],
        cta: feedback ? { label: 'Tell me what worked', href: feedback } : undefined,
        outro: [
          ...(feedback ? [] : ["If you have two minutes, reply and tell me what worked and what didn't."]),
          'The thing that sticks is using it on real work this week. Pick the task you brought and run it again on Monday.',
        ],
      });
    }
  }
}

export function renderSeatOffer(c: Cohort, w: WaitlistEntry): Rendered {
  return render({
    subject: `A seat opened up: ${c.title}, ${formatDate(c.starts_at)}`,
    label: 'Seat available',
    heading: 'A seat opened up.',
    greeting: `Hi ${firstName(w.name)},`,
    intro: [
      `You're on the waitlist for ${c.title} on ${formatDate(c.starts_at)}, and a seat has opened up. It goes to whoever books first.`,
    ],
    facts: [
      ['When', formatRange(c.starts_at, c.ends_at)],
      ['Where', where(c)],
    ],
    cta: { label: 'Book this seat', href: `${siteUrl()}/book/${c.slug}` },
    outro: ['If your plans have changed, no need to reply.'],
  });
}
