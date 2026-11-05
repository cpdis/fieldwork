'use client';

import { useActionState } from 'react';
import type { FormState } from '../actions';

export interface CohortDefaults {
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  venue_address: string;
  joining_notes: string;
  capacity: number;
  price: string;
  status: string;
  pre_course_days: number;
  follow_up_days: number;
}

export function CohortForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState | null, f: FormData) => Promise<FormState>;
  defaults: CohortDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="stack card" style={{ maxWidth: 760 }}>
      <div className="grid2">
        <label>
          Title <input name="title" defaultValue={defaults.title} required />
        </label>
        <label>
          URL name <input name="slug" defaultValue={defaults.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
          <span className="muted small">The booking page is /book/this-name</span>
        </label>
        <label>
          Starts (Perth time) <input name="starts_at" type="datetime-local" defaultValue={defaults.starts_at} required />
        </label>
        <label>
          Ends (Perth time) <input name="ends_at" type="datetime-local" defaultValue={defaults.ends_at} required />
        </label>
        <label>
          Venue <input name="venue_name" defaultValue={defaults.venue_name} />
        </label>
        <label>
          Address <input name="venue_address" defaultValue={defaults.venue_address} />
        </label>
        <label>
          Seats <input name="capacity" type="number" min={1} defaultValue={defaults.capacity} required />
        </label>
        <label>
          Price (A$, per seat) <input name="price" type="number" min={0} step="0.01" defaultValue={defaults.price} required />
        </label>
        <label>
          Status
          <select name="status" defaultValue={defaults.status}>
            <option value="draft">Draft: hidden</option>
            <option value="open">Open: taking bookings</option>
            <option value="closed">Closed: listed, waitlist only</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <div className="grid2">
          <label>
            Pre-course email, days before
            <input name="pre_course_days" type="number" min={0} max={60} defaultValue={defaults.pre_course_days} />
          </label>
          <label>
            Follow-up email, days after
            <input name="follow_up_days" type="number" min={0} max={60} defaultValue={defaults.follow_up_days} />
          </label>
        </div>
      </div>
      <label>
        Joining notes <span className="muted">(added to the confirmation and pre-course emails: parking, food, entry)</span>
        <textarea name="joining_notes" defaultValue={defaults.joining_notes} />
      </label>
      {state?.error && <p className="notice bad">{state.error}</p>}
      <div>
        <button className="btn ink" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
