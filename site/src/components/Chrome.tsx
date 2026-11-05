import Link from 'next/link';

/** The benchmark mark: a yellow bar over a tripod. */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="5" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M12 8v4M12 12l-6 9M12 12l6 9M12 12v9" stroke="var(--ink)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="wrap">
      <div className="top">
        <Link href="/" className="brand">
          <Mark /> Fieldwork
        </Link>
        <div className="row">{right}</div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="wrap foot">
      <div className="spread small muted">
        <span>Fieldwork · Perth, Western Australia</span>
        <span className="mono">Claude and ChatGPT, side by side</span>
      </div>
    </footer>
  );
}

export function Seats({ capacity, taken, held }: { capacity: number; taken: number; held: number }) {
  return (
    <div className="seats" aria-label={`${taken} of ${capacity} seats booked`}>
      {Array.from({ length: Math.max(capacity, taken + held) }, (_, i) => (
        <i key={i} className={i < taken ? 'taken' : i < taken + held ? 'held' : undefined} />
      ))}
    </div>
  );
}
