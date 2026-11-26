import { isAdmin } from '@/lib/auth';
import { getSql } from '@/lib/db';
import { listGeneralInterest } from '@/lib/interest';

export const dynamic = 'force-dynamic';

function cell(v: unknown): string {
  let s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAdmin())) return new Response('unauthorised', { status: 401 });
  const rows = await listGeneralInterest(getSql());
  const lines = [
    ['Name', 'Email', 'Company', 'Uses', 'Note', 'Joined'].join(','),
    ...rows.map((r) => [r.name, r.email, r.company, r.uses, r.note, r.created_at].map(cell).join(',')),
  ];
  return new Response(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="next-public-day-list.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
