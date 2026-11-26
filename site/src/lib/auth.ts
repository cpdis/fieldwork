import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { required } from './config';

export const SESSION_COOKIE = 'fw_admin';
const SESSION_DAYS = 14;

function sign(payload: string): string {
  return createHmac('sha256', required('ADMIN_SESSION_SECRET')).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function makeSessionToken(now = Date.now()): string {
  const exp = String(now + SESSION_DAYS * 86_400_000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [exp, mac] = token.split('.');
  if (!exp || !mac || !/^\d+$/.test(exp)) return false;
  if (!safeEqual(mac, sign(exp))) return false;
  return Number(exp) > now;
}

export function checkPassword(attempt: string): boolean {
  // Compare HMACs so the comparison is constant-time whatever the lengths.
  return safeEqual(sign(`pw:${attempt}`), sign(`pw:${required('ADMIN_PASSWORD')}`));
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}

export async function startSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, makeSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete({ name: SESSION_COOKIE, path: '/admin' });
}
