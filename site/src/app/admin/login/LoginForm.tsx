'use client';

import { useActionState } from 'react';
import { login, type FormState } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState | null, FormData>(login, null);
  return (
    <form action={action} className="stack" style={{ marginTop: 24 }}>
      <label>
        Password <input name="password" type="password" autoComplete="current-password" required autoFocus />
      </label>
      {state?.error && <p className="notice bad">{state.error}</p>}
      <button className="btn ink" disabled={pending}>
        {pending ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  );
}
