import { getSql } from '@/lib/db';
import { runScheduledEmails } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Vercel Cron calls this daily (see vercel.json) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('unauthorised', { status: 401 });
  }
  const results = await runScheduledEmails(getSql());
  return Response.json({ sent: results.length, results });
}
