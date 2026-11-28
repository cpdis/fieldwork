import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { LOOK_COOKIE, makeLookCookie, openLink, readManifest } from '@/lib/deck';

export const dynamic = 'force-dynamic';

// fieldworkperth.com/look/<token>: the link sent to a friend. Sets the share cookie and opens the deck.
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const link = await openLink(getSql(), token);
  if (!link) return NextResponse.redirect(new URL('/look', req.url), 303);
  const slide = (await readManifest())?.slide ?? 'fieldwork-day';
  const res = NextResponse.redirect(new URL(`/look/s/${slide}?p=1`, req.url), 303);
  const { value, maxAge } = makeLookCookie(link);
  res.cookies.set(LOOK_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/look',
    maxAge,
  });
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}
