import { getSql } from '@/lib/db';
import { hasAnswers, readFeedback, saveFeedback } from '@/lib/feedback';

/**
 * The feedback form posts here (a plain form post, no JavaScript needed) and is
 * sent back to /feedback with ?sent=1 or ?error=… . Answers are stored per cohort.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const f = readFeedback((k) => form.get(k));
  const back = (q: string) => {
    const url = new URL('/feedback', req.url);
    if (f.day) url.searchParams.set('day', f.day);
    for (const [k, v] of new URLSearchParams(q)) url.searchParams.set(k, v);
    return Response.redirect(url, 303);
  };
  if (f.website) return back('sent=1');
  if (!hasAnswers(f)) return back('error=empty');
  try {
    await saveFeedback(getSql(), f);
  } catch (err) {
    console.error('[feedback] save failed', err);
    return back('error=server');
  }
  return back('sent=1');
}
