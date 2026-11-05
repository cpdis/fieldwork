import { siteUrl } from './config';
import { formatDate, formatRange, formatTime } from './time';
import type { Booking, Cohort, EmailKind, WaitlistEntry } from './types';

export interface Rendered {
  subject: string;
  text: string;
  html: string;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function firstName(name: string | null): string {
  const n = name?.trim().split(/\s+/)[0];
  return n ? n : 'there';
}

/** Paragraphs separated by blank lines; a line starting with "- " becomes a bullet. */
function toHtml(body: string): string {
  const blocks = body.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => l.startsWith('- '))) {
      return `<ul style="margin:0 0 16px;padding-left:20px">${lines.map((l) => `<li style="margin:0 0 6px">${linkify(esc(l.slice(2)))}</li>`).join('')}</ul>`;
    }
    return `<p style="margin:0 0 16px">${lines.map((l) => linkify(esc(l))).join('<br>')}</p>`;
  });
  return `<!doctype html><html><body style="margin:0;background:#f6f6f3">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font:16px/1.55 'Instrument Sans',Helvetica,Arial,sans-serif;color:#141518">
<div style="font:500 12px/1 'IBM Plex Mono',Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;color:#6a6d74;margin-bottom:24px">Fieldwork</div>
${blocks.join('\n')}
</div></body></html>`;
}

function linkify(s: string): string {
  return s.replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" style="color:#141518">${u}</a>`);
}

function render(subject: string, body: string): Rendered {
  return { subject, text: body, html: toHtml(body) };
}

function where(c: Cohort): string {
  return [c.venue_name, c.venue_address].filter(Boolean).join(', ') || 'Venue to be confirmed. I will email you the address.';
}

const SETUP = [
  '- A laptop (Mac or Windows) with its charger.',
  '- The Claude desktop app and the ChatGPT desktop app installed and signed in.',
  '- A paid plan on each: Claude Pro and ChatGPT Plus are enough. Bring the logins if you use a work account.',
  '- One real task from your week that you would happily hand to an assistant.',
].join('\n');

const SIGN_OFF = 'Colin\nFieldwork';

export function renderBookingEmail(kind: Exclude<EmailKind, 'seat_offer'>, c: Cohort, b: Booking): Rendered {
  const hi = `Hi ${firstName(b.name)},`;
  const notes = c.joining_notes?.trim() ? `\n\n${c.joining_notes.trim()}` : '';

  switch (kind) {
    case 'confirmation':
      return render(
        `You're booked: ${c.title}, ${formatDate(c.starts_at)}`,
        `${hi}

Your seat at ${c.title} is confirmed. Stripe sends your receipt separately.

When: ${formatRange(c.starts_at, c.ends_at)}
Where: ${where(c)}${notes}

I'll email again a few days before with a short setup checklist. If you have a question before then, reply to this email.

${SIGN_OFF}`,
      );

    case 'pre_course':
      return render(
        `${c.title} is on ${formatDate(c.starts_at)}: what to bring`,
        `${hi}

See you on ${formatDate(c.starts_at)}. We start at ${formatTime(c.starts_at)} sharp and finish by ${formatTime(c.ends_at)}.

Where: ${where(c)}${notes}

Please bring:
${SETUP}

Installing and signing in at home saves about twenty minutes on the day. If anything won't install, reply and I'll help before the day.

${SIGN_OFF}`,
      );

    case 'follow_up': {
      const feedback = process.env.FEEDBACK_URL;
      return render(
        `Thanks for coming to ${c.title}`,
        `${hi}

Thanks for spending the day at ${c.title}.${
          feedback ? `\n\nIf you have two minutes, tell me what worked and what didn't: ${feedback}` : '\n\nIf you have two minutes, reply and tell me what worked and what didn\'t.'
        }

The thing that sticks is using it on real work this week. Pick the task you brought and run it again on Monday.

${SIGN_OFF}`,
      );
    }
  }
}

export function renderSeatOffer(c: Cohort, w: WaitlistEntry): Rendered {
  return render(
    `A seat opened up: ${c.title}, ${formatDate(c.starts_at)}`,
    `Hi ${firstName(w.name)},

You're on the waitlist for ${c.title} on ${formatDate(c.starts_at)}, and a seat has opened up. It goes to whoever books first, so if you want it, book here:

${siteUrl()}/book/${c.slug}

If your plans have changed, no need to reply.

${SIGN_OFF}`,
  );
}
