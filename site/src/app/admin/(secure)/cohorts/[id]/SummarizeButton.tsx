'use client';

import { useFormStatus } from 'react-dom';

/** The "Summarise with Claude" button. Claude takes about a minute, so it says so while it works. */
export function SummarizeButton({ again }: { again: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn small ink" disabled={pending} aria-busy={pending}>
      {pending ? 'Claude is reading the feedback… (about a minute)' : again ? 'Summarise again' : 'Summarise with Claude'}
    </button>
  );
}
