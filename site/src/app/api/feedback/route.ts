import { hasAnswers, readFeedback, renderFeedback } from '@/lib/feedback';
import { deliver } from '@/lib/mail';
import { CONTACT_EMAIL } from '@/lib/site-content';

/**
 * The feedback form posts here (a plain form post, no JavaScript needed) and is
 * sent back to /feedback with ?sent=1 or ?error=… . Answers are emailed to Colin.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const f = readFeedback((k) => form.get(k));
  const back = (q: string) => Response.redirect(new URL(`/feedback?${q}`, req.url), 303);
  if (f.website) return back('sent=1');
  if (!hasAnswers(f)) return back('error=empty');
  const to = process.env.INTEREST_ALERT_TO || CONTACT_EMAIL;
  try {
    if (to) await deliver(to, renderFeedback(f), `feedback:${Date.now()}:${Math.random().toString(36).slice(2)}`);
    else console.info('[feedback] no recipient set', renderFeedback(f).text);
  } catch (err) {
    console.error('[feedback] send failed', err);
    return back('error=server');
  }
  return back('sent=1');
}
