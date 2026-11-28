import type { Rendered } from './email-templates';

/**
 * The end-of-day feedback form: five questions, no database. Each answer is
 * emailed to Colin, so the form needs no table or migration.
 */
export const APPS = ['ChatGPT', 'Claude', 'Both'] as const;
export const RECOMMEND = ['Yes', 'Maybe', 'No'] as const;

export interface FeedbackInput {
  app: string | null;
  useful: number | null;
  keep: string;
  change: string;
  recommend: string | null;
  name: string;
  email: string;
  /** Honeypot. */
  website: string;
}

export function readFeedback(get: (k: string) => unknown): FeedbackInput {
  const str = (k: string, max: number) => String(get(k) ?? '').trim().slice(0, max);
  const pick = (k: string, list: readonly string[]) => (list.includes(str(k, 20)) ? str(k, 20) : null);
  const useful = Number(str('useful', 2));
  return {
    app: pick('app', APPS),
    useful: Number.isInteger(useful) && useful >= 1 && useful <= 5 ? useful : null,
    keep: str('keep', 1500),
    change: str('change', 1500),
    recommend: pick('recommend', RECOMMEND),
    name: str('name', 120),
    email: str('email', 200).toLowerCase(),
    website: str('website', 200),
  };
}

/** True when at least one question has an answer worth sending. */
export const hasAnswers = (f: FeedbackInput) => Boolean(f.app || f.useful || f.keep || f.change || f.recommend);

export function renderFeedback(f: FeedbackInput): Rendered {
  const lines = [
    `App used: ${f.app ?? '-'}`,
    `How useful (1 to 5): ${f.useful ?? '-'}`,
    `Will use this week: ${f.keep || '-'}`,
    `Should change: ${f.change || '-'}`,
    `Would recommend: ${f.recommend ?? '-'}`,
    f.name || f.email ? `From: ${[f.name, f.email].filter(Boolean).join(' · ')}` : 'From: anonymous',
  ];
  const text = lines.join('\n');
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return {
    subject: `Fieldwork feedback${f.useful ? `: ${f.useful}/5` : ''}${f.name ? ` from ${f.name}` : ''}`,
    text,
    html: `<pre style="font:14px/1.5 ui-monospace,monospace;white-space:pre-wrap">${esc(text)}</pre>`,
  };
}
