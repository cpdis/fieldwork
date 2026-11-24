import Link from 'next/link';
import { StatusTag } from '@/components/AdminBits';
import { listCohorts } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { formatMoney, formatShortDate } from '@/lib/time';

export const metadata = { title: 'Cohorts' };

export default async function AdminHome() {
  const cohorts = await listCohorts(getSql());
  return (
    <div className="stack">
      <div className="spread">
        <div>
          <p className="eyebrow">Admin</p>
          <h2 style={{ marginTop: 6 }}>Cohorts</h2>
        </div>
        <Link href="/admin/cohorts/new" className="btn ink">
          New cohort
        </Link>
      </div>
      {cohorts.length === 0 ? (
        <p className="muted">No cohorts yet. Create the first one.</p>
      ) : (
        <div className="tablebox">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Cohort</th>
                <th>Status</th>
                <th>Booked</th>
                <th>Left</th>
                <th>Waitlist</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.id}>
                  <td className="num">{formatShortDate(c.starts_at)}</td>
                  <td>
                    <Link href={`/admin/cohorts/${c.id}`}>{c.title}</Link>
                    <div className="mono">/{c.slug}</div>
                  </td>
                  <td>
                    <StatusTag status={c.status} />
                  </td>
                  <td className="num">
                    {c.seats_taken} / {c.capacity}
                    {c.seats_held > 0 && <div className="muted small">+{c.seats_held} paying now</div>}
                  </td>
                  <td className="num">{c.seats_left < 0 ? <span className="tag bad">over by {-c.seats_left}</span> : c.seats_left}</td>
                  <td className="num">{c.waitlist_count}</td>
                  <td className="num">{formatMoney(c.price_cents, c.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
