import { isAdmin } from '@/lib/auth';
import { getCohortById, listBookings } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { formatAbn } from '@/lib/abn';

export const dynamic = 'force-dynamic';

function cell(v: unknown): string {
  let s = v == null ? '' : String(v);
  // Stop spreadsheet apps treating a value as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response('unauthorised', { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('not found', { status: 404 });
  const sql = getSql();
  const cohort = await getCohortById(sql, id);
  if (!cohort) return new Response('not found', { status: 404 });
  const rows = (await listBookings(sql, id)).filter((b) => b.status === 'paid' || b.status === 'comp');
  const header = ['Name', 'Email', 'Phone', 'Company', 'ABN', 'Dietary', 'Status', 'Amount', 'Notes'];
  const lines = [
    header.join(','),
    ...rows.map((b) =>
      [
        b.name,
        b.email,
        b.phone,
        b.company,
        b.abn ? formatAbn(b.abn) : '',
        b.dietary,
        b.status,
        b.amount_total_cents != null ? (b.amount_total_cents / 100).toFixed(2) : '',
        b.admin_notes,
      ]
        .map(cell)
        .join(','),
    ),
  ];
  return new Response(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${cohort.slug}-roster.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
