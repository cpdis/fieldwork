import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { LOOK_COOKIE, verifyLookCookie } from '@/lib/deck';

/**
 * Gate for the built deck. Its files sit in public/ (so the CDN serves them, video ranges and
 * all), and this runs before public/ is served:
 *   /admin/deck/{assets,s,api}/…  needs the admin session
 *   /look/{assets,s,api}/…        needs a share-link cookie, set by /look/<token>
 * The cookie checks here are signature and expiry only; the entry page and the API routes also
 * check the database, so revoking a link takes effect on the next page load or check-in.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, top, second, third] = pathname.split('/');

  if (top === 'admin') {
    if (second !== 'deck' || !['assets', 's', 'api'].includes(third)) return NextResponse.next();
    if (verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
    return deny(req, '/admin/login');
  }

  // /look/<token> is the way in, checked by its route handler.
  if (!['assets', 's', 'api'].includes(second)) return NextResponse.next();
  if (verifyLookCookie(req.cookies.get(LOOK_COOKIE)?.value)) return NextResponse.next();
  return deny(req, '/look');
}

function deny(req: NextRequest, to: string) {
  const wantsPage = req.method === 'GET' && (req.headers.get('accept') ?? '').includes('text/html');
  if (wantsPage) return NextResponse.redirect(new URL(to, req.url));
  return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export const config = {
  matcher: ['/admin/deck/:path+', '/look/:path+'],
};
