import Link from 'next/link';
import { StatusTag } from '@/components/AdminBits';
import { listCohorts } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { listGeneralInterest } from '@/lib/interest';
import { formatMoney, formatShortDate, formatStamp } from '@/lib/time';
import { moveInterestToCohort, removeFromWaitlist } from '../actions';

const USES: Record<string, string> = { chatgpt: 'ChatGPT', claude: 'Claude', both: 'Both', neither: 'Neither yet' };

export const metadata = { title: 'Cohorts' };

export default async function AdminHome() {
  const sql = getSql();
  const [cohorts, interest] = await Promise.all([listCohorts(sql), listGeneralInterest(sql)]);
  const movable = cohorts.filter((c) => c.status === 'open' || c.status === 'closed');
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

      <section className="stack" style={{ marginTop: 48 }}>
        <div className="spread">
          <div>
            <h3>Next public day list</h3>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              People who asked on the home page to hear about the next public day. Move someone onto a cohort&rsquo;s waitlist to send them a seat offer from there.
            </p>
          </div>
          {interest.length > 0 && (
            <a className="btn small quiet" href="/admin/interest.csv">
              Download CSV
            </a>
          )}
        </div>
        {interest.length === 0 ? (
          <p className="muted">Nobody yet.</p>
        ) : (
          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Uses</th>
                  <th>Note</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {interest.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.name}</strong>
                      <div className="small">
                        <a href={`mailto:${w.email}`}>{w.email}</a>
                      </div>
                    </td>
                    <td>{w.company}</td>
                    <td className="small">{w.uses ? USES[w.uses] : ''}</td>
                    <td className="small" style={{ maxWidth: 280 }}>
                      {w.note}
                    </td>
                    <td className="num small">{formatStamp(w.created_at)}</td>
                    <td className="actions">
                      {movable.length > 0 && (
                        <form action={moveInterestToCohort.bind(null, w.id)} className="row" style={{ gap: 6, display: 'inline-flex' }}>
                          <select name="cohort_id" aria-label="Cohort" style={{ width: 'auto', margin: 0, padding: '4px 8px', fontSize: 13 }}>
                            {movable.map((c) => (
                              <option key={c.id} value={c.id}>
                                {formatShortDate(c.starts_at)}
                              </option>
                            ))}
                          </select>
                          <button className="btn small">Move</button>
                        </form>
                      )}{' '}
                      <form action={removeFromWaitlist.bind(null, w.id, null)}>
                        <button className="btn small quiet">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
