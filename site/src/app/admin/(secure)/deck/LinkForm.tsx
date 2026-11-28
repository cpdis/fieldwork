'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CopyButton } from '@/components/admin/CopyButton';
import type { LinkFormState } from './actions';

export function LinkForm({ action, origin }: { action: (p: LinkFormState | null, f: FormData) => Promise<LinkFormState>; origin: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.created) ref.current?.reset();
  }, [state]);
  const url = state?.created ? `${origin}/look/${state.created.token}` : null;
  return (
    <form ref={ref} action={formAction} className="card stack">
      <div className="grid2">
        <label>
          Who it&rsquo;s for <input name="name" placeholder="Alex" required maxLength={80} autoComplete="off" />
        </label>
        <label className="input-bottom">
          Works for
          <select name="expires" defaultValue="14">
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="never">Until I turn it off</option>
          </select>
        </label>
      </div>
      <label>
        Note to self <span className="muted small">(optional, only you see it)</span>
        <input name="note" placeholder="Running group, wants the agents part" maxLength={500} autoComplete="off" />
      </label>
      <label style={{ fontWeight: 400 }}>
        <input type="checkbox" name="allow_notes" defaultChecked /> Let them leave notes on pages
      </label>
      <div className="row">
        <button className="btn ink" disabled={pending} aria-busy={pending || undefined}>
          {pending && <span className="spin" aria-hidden="true" />}
          Make a link
        </button>
        {state?.error && <span className="small" style={{ color: 'var(--bad)' }}>{state.error}</span>}
      </div>
      {url && state?.created && (
        <div className="notice" role="status">
          <div className="small">
            Link for <strong>{state.created.name}</strong>. Send it as it is; it opens the deck straight away.
          </div>
          <div className="copy" style={{ marginTop: 8 }}>
            <code>{url}</code>
            <CopyButton text={url} />
          </div>
        </div>
      )}
    </form>
  );
}
