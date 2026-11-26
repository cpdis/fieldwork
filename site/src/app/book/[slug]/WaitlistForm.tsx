'use client';

import { useActionState } from 'react';
import { joinWaitlist, type WaitlistState } from '../actions';

export function WaitlistForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<WaitlistState | null, FormData>(joinWaitlist, null);
  if (state?.ok) return <p className="notice">{state.message}</p>;
  return (
    <form action={action} className="stack">
      <input type="hidden" name="slug" value={slug} />
      <div style={{ position: 'absolute', left: -9999 }} aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid2">
        <label>
          Name <input name="name" required autoComplete="name" />
        </label>
        <label>
          Email <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>
      <label>
        Company <span className="muted">(optional)</span> <input name="company" autoComplete="organization" />
      </label>
      {state && !state.ok && <p className="notice bad">{state.message}</p>}
      <button className="btn ink" disabled={pending}>
        {pending ? 'Adding you…' : 'Join the waitlist'}
      </button>
    </form>
  );
}
