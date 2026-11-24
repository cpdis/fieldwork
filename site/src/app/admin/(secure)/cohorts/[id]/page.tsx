import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusTag } from '@/components/AdminBits';
import { Seats } from '@/components/Chrome';
import {
  addManualBooking,
  cancelBooking,
  offerSeat,
  reinstateBooking,
  removeFromWaitlist,
  sendEmailNow,
  sendPreCourseToAll,
  updateBooking,
} from '@/app/admin/actions';
import { formatAbn } from '@/lib/abn';
import { getCohortById, listBookings, listEmailLog, listWaitlist } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { formatMoney, formatRange, formatStamp } from '@/lib/time';
import type { Booking, EmailLogRow } from '@/lib/types';
import { AddAttendee } from './AddAttendee';

export const metadata = { title: 'Cohort' };

const KIND_LABEL: Record<string, string> = {
  confirmation: 'Confirmed',
  pre_course: 'Pre-course',
  follow_up: 'Follow-up',
  seat_offer: 'Seat offer',
};

function EmailTicks({ log }: { log: EmailLogRow[] }) {
  if (!log.length) return <span className="muted">none</span>;
  return (
    <>
      {log.map((e) => (
        <div key={e.id} className="small" title={e.error ?? undefined}>
          <span className={`tag ${e.status === 'failed' ? 'bad' : e.status === 'sending' ? 'warn' : 'mute'}`}>
            {KIND_LABEL[e.kind]}
            {e.status === 'logged' ? ' (dev)' : e.status === 'failed' ? ' failed' : ''}
          </span>
        </div>
      ))}
    </>
  );
}

function BookingRow({ b, cohortId, log }: { b: Booking; cohortId: string; log: EmailLogRow[] }) {
  const live = b.status === 'paid' || b.status === 'comp';
  return (
    <tr>
      <td>
        <strong>{b.name ?? <span className="muted">Paying now…</span>}</strong>
        <div className="small">{b.email}</div>
        {b.phone && <div className="small muted">{b.phone}</div>}
      </td>
      <td>
        {b.company}
        {b.abn && (
          <div className="small num">
            {formatAbn(b.abn)} {b.abn_valid === false && <span className="tag bad">check ABN</span>}
          </div>
        )}
      </td>
      <td>{b.dietary ?? <span className="muted">none</span>}</td>
      <td>
        <StatusTag status={b.status} />
        <div className="small muted">
          {b.source === 'manual' ? 'added by hand' : b.amount_total_cents != null ? formatMoney(b.amount_total_cents, b.currency ?? 'aud') : ''}
        </div>
        {b.admin_notes && <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{b.admin_notes}</div>}
      </td>
      <td>
        <EmailTicks log={log} />
      </td>
      <td className="actions">
        <details>
          <summary className="small">Manage</summary>
          <div className="stack" style={{ marginTop: 8, minWidth: 260 }}>
            {live && b.email && (
              <div className="row">
                <form action={sendEmailNow.bind(null, b.id, cohortId, 'confirmation')}>
                  <button className="btn small quiet">Resend confirmation</button>
                </form>
                <form action={sendEmailNow.bind(null, b.id, cohortId, 'pre_course')}>
                  <button className="btn small quiet">Send pre-course</button>
                </form>
                <form action={sendEmailNow.bind(null, b.id, cohortId, 'follow_up')}>
                  <button className="btn small quiet">Send follow-up</button>
                </form>
              </div>
            )}
            <form action={updateBooking.bind(null, b.id, cohortId)} className="stack">
              <label className="small">
                Name <input name="name" defaultValue={b.name ?? ''} />
              </label>
              <label className="small">
                Email <input name="email" type="email" defaultValue={b.email ?? ''} />
              </label>
              <label className="small">
                Company <input name="company" defaultValue={b.company ?? ''} />
              </label>
              <label className="small">
                ABN <input name="abn" defaultValue={b.abn ?? ''} />
              </label>
              <label className="small">
                Dietary <input name="dietary" defaultValue={b.dietary ?? ''} />
              </label>
              <label className="small">
                Notes <textarea name="admin_notes" defaultValue={b.admin_notes ?? ''} />
              </label>
              <div>
                <button className="btn small">Save</button>
              </div>
            </form>
            {live || b.status === 'pending' ? (
              <form action={cancelBooking.bind(null, b.id, cohortId)}>
                <button className="btn small quiet" style={{ color: 'var(--bad)' }}>
                  Cancel booking (frees the seat)
                </button>
                {b.source === 'stripe' && b.status === 'paid' && (
                  <p className="small muted">Refund in the Stripe dashboard. The booking then shows as refunded.</p>
                )}
              </form>
            ) : b.status === 'cancelled' ? (
              <form action={reinstateBooking.bind(null, b.id, cohortId)}>
                <button className="btn small quiet">Reinstate</button>
              </form>
            ) : null}
          </div>
        </details>
      </td>
    </tr>
  );
}

export default async function CohortPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ show?: string }> }) {
  const { id } = await params;
  const { show } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sql = getSql();
  const cohort = await getCohortById(sql, id);
  if (!cohort) notFound();
  const [bookings, waitlist, emails] = await Promise.all([listBookings(sql, id), listWaitlist(sql, id), listEmailLog(sql, id)]);

  const attending = bookings.filter((b) => b.status === 'paid' || b.status === 'comp');
  const now = new Date();
  const paying = bookings.filter((b) => b.status === 'pending' && b.hold_expires_at && b.hold_expires_at > now);
  const other = bookings.filter((b) => !attending.includes(b) && !paying.includes(b));
  const shown = show === 'all' ? [...attending, ...paying, ...other] : [...attending, ...paying];
  const dietary = attending.filter((b) => b.dietary);
  const byBooking = new Map<string, EmailLogRow[]>();
  for (const e of emails) if (e.booking_id) byBooking.set(e.booking_id, [...(byBooking.get(e.booking_id) ?? []), e]);
  const lastOffer = new Map<string, EmailLogRow>();
  for (const e of emails) if (e.waitlist_id && !lastOffer.has(e.waitlist_id)) lastOffer.set(e.waitlist_id, e);
  const failed = emails.filter((e) => e.status === 'failed');

  return (
    <div className="stack loose">
      <div className="spread">
        <div>
          <p className="eyebrow">
            <StatusTag status={cohort.status} /> &nbsp;/book/{cohort.slug}
          </p>
          <h2 style={{ marginTop: 8 }}>{cohort.title}</h2>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            {formatRange(cohort.starts_at, cohort.ends_at)}
            {cohort.venue_name ? ` · ${cohort.venue_name}` : ''}
          </p>
        </div>
        <div className="row">
          <Link className="btn quiet small" href={`/book/${cohort.slug}`} target="_blank">
            Booking page
          </Link>
          <a className="btn quiet small" href={`/admin/cohorts/${cohort.id}/roster.csv`}>
            Roster CSV
          </a>
          <Link className="btn small" href={`/admin/cohorts/${cohort.id}/edit`}>
            Edit
          </Link>
        </div>
      </div>

      <section className="stats">
        <div className="card stat">
          <div className="v">
            {cohort.seats_taken}/{cohort.capacity}
          </div>
          <div className="k">Booked</div>
        </div>
        <div className="card stat">
          <div className="v" style={cohort.seats_left < 0 ? { color: 'var(--bad)' } : undefined}>
            {cohort.seats_left}
          </div>
          <div className="k">Seats left</div>
        </div>
        <div className="card stat">
          <div className="v">{cohort.seats_held}</div>
          <div className="k">Paying now</div>
        </div>
        <div className="card stat">
          <div className="v">{cohort.waitlist_count}</div>
          <div className="k">Waitlist</div>
        </div>
        <div className="card stat">
          <div className="v">{dietary.length}</div>
          <div className="k">Dietary notes</div>
        </div>
      </section>
      <Seats capacity={cohort.capacity} taken={cohort.seats_taken} held={cohort.seats_held} />

      {failed.length > 0 && (
        <p className="notice bad">
          {failed.length} email{failed.length > 1 ? 's' : ''} failed to send. Hover the red tag for the reason, then use Manage to resend.
        </p>
      )}

      <section className="stack">
        <div className="spread">
          <h3>Roster</h3>
          <div className="row">
            <Link className="small" href={show === 'all' ? `?` : `?show=all`}>
              {show === 'all' ? 'Hide cancelled and expired' : `Show cancelled and expired (${other.length})`}
            </Link>
            {attending.length > 0 && (
              <form action={sendPreCourseToAll.bind(null, cohort.id)}>
                <button className="btn small quiet">Send pre-course to everyone not yet sent</button>
              </form>
            )}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="muted">No bookings yet.</p>
        ) : (
          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Company · ABN</th>
                  <th>Dietary</th>
                  <th>Booking</th>
                  <th>Emails</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((b) => (
                  <BookingRow key={b.id} b={b} cohortId={cohort.id} log={byBooking.get(b.id) ?? []} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="small muted">
          Pre-course emails go out automatically {cohort.pre_course_days} day{cohort.pre_course_days === 1 ? '' : 's'} before, and follow-ups{' '}
          {cohort.follow_up_days} day{cohort.follow_up_days === 1 ? '' : 's'} after, at 8am Perth time.
        </p>
      </section>

      <section className="stack">
        <h3>For the caterer</h3>
        <div className="card">
          <p style={{ margin: 0 }}>
            <strong className="num">{attending.length}</strong> {attending.length === 1 ? 'person' : 'people'}
            {dietary.length ? `, ${dietary.length} with dietary needs:` : ', no dietary needs recorded.'}
          </p>
          {dietary.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {dietary.map((b) => (
                <li key={b.id}>
                  {b.dietary} <span className="muted">({b.name})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="stack">
        <h3>Waitlist</h3>
        {waitlist.length === 0 ? (
          <p className="muted">Nobody waiting.</p>
        ) : (
          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Joined</th>
                  <th>Offer</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {waitlist.map((w, i) => {
                  const offer = lastOffer.get(w.id);
                  return (
                    <tr key={w.id}>
                      <td className="num">{i + 1}</td>
                      <td>
                        <strong>{w.name}</strong>
                        <div className="small">{w.email}</div>
                      </td>
                      <td>{w.company}</td>
                      <td className="num small">{formatStamp(w.created_at)}</td>
                      <td className="small">
                        {w.offered_at ? `Sent ${formatStamp(w.offered_at)}` : <span className="muted">not yet</span>}
                        {offer?.status === 'failed' && <span className="tag bad">failed</span>}
                      </td>
                      <td className="actions">
                        <form action={offerSeat.bind(null, w.id, cohort.id)}>
                          <button className="btn small" disabled={cohort.seats_left <= 0} title={cohort.seats_left <= 0 ? 'No seat free yet' : undefined}>
                            Email seat offer
                          </button>
                        </form>{' '}
                        <form action={removeFromWaitlist.bind(null, w.id, cohort.id)}>
                          <button className="btn small quiet">Remove</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stack">
        <h3>Add someone by hand</h3>
        <p className="small muted" style={{ margin: 0 }}>
          For pilot guests, invoiced company bookings, or anyone who paid another way. They count toward the seats.
        </p>
        <div className="card">
          <AddAttendee action={addManualBooking.bind(null, cohort.id)} />
        </div>
      </section>
    </div>
  );
}
