import { getSql } from '@/lib/db';
import { addInterest, readInterest } from '@/lib/interest';

/**
 * The marketing page's form posts here. With JavaScript the page sends
 * `Accept: application/json` and shows the answer in place; without it the
 * browser follows a 303 back to the form.
 */
export async function POST(req: Request) {
  const wantsJson = (req.headers.get('accept') ?? '').includes('application/json');
  let input;
  try {
    const type = req.headers.get('content-type') ?? '';
    if (type.includes('application/json')) {
      const body = (await req.json()) as Record<string, unknown>;
      input = readInterest((k) => body[k]);
    } else {
      const form = await req.formData();
      input = readInterest((k) => form.get(k));
    }
  } catch {
    return reply(wantsJson, req, { ok: false, error: 'invalid', message: 'Please give your name and a valid email.' }, 400);
  }

  try {
    const result = await addInterest(getSql(), input);
    return reply(wantsJson, req, result, result.ok ? 200 : result.error === 'invalid' ? 400 : 404);
  } catch (err) {
    console.error('[interest] failed', err);
    return reply(wantsJson, req, { ok: false, error: 'server', message: 'That didn’t go through. Please try again in a minute.' }, 500);
  }
}

function reply(json: boolean, req: Request, body: { ok: boolean; message: string; error?: string }, status: number) {
  if (json) return Response.json(body, { status });
  const url = new URL('/', req.url);
  url.searchParams.set(body.ok ? 'sent' : 'error', body.ok ? '1' : (body.error ?? 'server'));
  url.hash = 'book';
  return Response.redirect(url, 303);
}
