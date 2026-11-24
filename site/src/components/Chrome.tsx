import Link from 'next/link';

/**
 * The mark: an abstract levelling staff (alternate ink and paper blocks) with a
 * yellow reading against it, the same device as the timetable's staff.
 */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6.75" y="1.75" width="6.5" height="20.5" fill="var(--white, #fff)" stroke="var(--ink)" strokeWidth="1.5" />
      <rect x="6.75" y="1.75" width="6.5" height="5.125" fill="var(--ink)" />
      <rect x="6.75" y="12" width="6.5" height="5.125" fill="var(--ink)" />
      <rect x="13.25" y="8.25" width="8.5" height="4" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1.5" />
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
