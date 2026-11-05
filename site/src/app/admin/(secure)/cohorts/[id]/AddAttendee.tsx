'use client';

import { useActionState, useEffect, useRef } from 'react';
import type { FormState } from '@/app/admin/actions';

export function AddAttendee({ action }: { action: (prev: FormState | null, f: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state && !state.error) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="stack">
      <div className="grid2">
        <label>
          Name <input name="name" required />
        </label>
        <label>
          Email <input name="email" type="email" />
        </label>
        <label>
          Company <input name="company" />
        </label>
        <label>
          ABN <input name="abn" inputMode="numeric" />
        </label>
        <label>
          Dietary needs <input name="dietary" />
        </label>
        <label>
          Paid outside Stripe, A$ <span className="muted">(blank if free)</span>
          <input name="amount" type="number" min={0} step="0.01" />
        </label>
      </div>
      <label>
        Notes <input name="admin_notes" placeholder="e.g. invoiced, pilot guest" />
      </label>
      <label className="small">
        <input type="checkbox" name="send_confirmation" defaultChecked /> Send the confirmation email
      </label>
      {state?.error && <p className="notice bad">{state.error}</p>}
      <div>
        <button className="btn ink" disabled={pending}>
          {pending ? 'Adding…' : 'Add attendee'}
        </button>
      </div>
    </form>
  );
}
