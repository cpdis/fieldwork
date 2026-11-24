/**
 * "Same job, both apps": one job stepped through ChatGPT (left, Instrument) and
 * Claude (right, Field notes) at once. The chips set data-step on the panel and
 * CSS shows that step; public/site.js wires the chips. Without JavaScript every
 * step shows, stacked. Equal widths, equal content, and the Claude half never
 * takes the yellow accent (the red pencil marks things there).
 */

const STEPS = [
  { n: 1, k: 'Ask', t: 'Say the job, attach the file.' },
  { n: 2, k: 'Read it like a draft', t: 'Check the numbers. Say what is off.' },
  { n: 3, k: 'Ask again next model', t: 'The thing it got wrong last month.' },
];

const NOTES: [string, string][] = [
  ['Fast, and mostly right', 'P3 looks wrong'],
  ['Say what is off', 'fixed in one ask'],
  ['It flags what it can’t read', 'it asked first. good.'],
];

const ROWS = [
  ['P1', '391 204.6', '6 465 118.2', '14.82'],
  ['P2', '391 212.0', '6 465 121.9', '14.67'],
  ['P3', '391 219.3', '6 465 125.4', '14.32'],
  ['P4', '391 226.8', '6 465 129.0', '14.11'],
];

function Table({ side, fix }: { side: 'in' | 'fn'; fix?: boolean }) {
  return (
    <div className="ba-tbl" role="table" aria-label="Survey points">
      {['Point', 'Easting', 'Northing', 'Level'].map((h) => (
        <span key={h} className="h" role="columnheader">
          {h}
        </span>
      ))}
      {ROWS.map((r) => {
        const flagged = r[0] === 'P3';
        return r.map((c, i) => (
          <span key={r[0] + i} role="cell" className={flagged && i === 3 ? (fix ? 'fixed' : 'flag') : undefined}>
            {flagged && i === 3 && fix ? '14.82' : c}
            {flagged && i === 3 && !fix && side === 'fn' && <i className="circle" aria-hidden="true" />}
          </span>
        ));
      })}
    </div>
  );
}

function Half({ side }: { side: 'in' | 'fn' }) {
  const isIn = side === 'in';
  return (
    <div className={`ba-half ${side}`}>
      <div className="ba-label">
        <span className="nm">{isIn ? 'ChatGPT' : 'Claude'}</span>
        <span className="sub">{isIn ? 'Chat · Work · Codex' : 'Chat · Cowork · Code'}</span>
      </div>
      <div className="ba-win">
        <div className="ba-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span>{isIn ? 'ChatGPT' : 'Claude'}</span>
        </div>
        <div className="ba-body">
          <div className="ba-step s1">
            <p className="me">
              <span className="att">field-book-p14.jpg</span>
              Make this page of the field book a table: point, easting, northing, level.
            </p>
            <Table side={side} />
          </div>
          <div className="ba-step s2">
            <p className="me">P3&rsquo;s level looks low against P2. Check it against the photo.</p>
            <p className="ai">You&rsquo;re right. I read 14.82 as 14.32. Fixed, and the other three match the photo.</p>
            <Table side={side} fix />
          </div>
          <div className="ba-step s3">
            <p className="me">
              <span className="att">field-book-p14.jpg</span>
              Same page, a month later, on the newer model.
            </p>
            <p className="ai">All four points read. P3&rsquo;s last digit is smudged: 14.82 or 14.87? Confirm before I file it.</p>
          </div>
        </div>
      </div>
      <div className="ba-notes" aria-hidden="true">
        {NOTES.map((n, i) => (
          <p key={i} className={`ba-note s${i + 1}`}>
            {isIn ? <span className="tagnote">{n[0]}</span> : <span className="hand">{n[1]}</span>}
          </p>
        ))}
      </div>
    </div>
  );
}

export function BothApps() {
  return (
    <div className="ba" data-demo data-step="1">
      <div className="ba-chips" role="tablist" aria-label="Steps">
        {STEPS.map((s) => (
          <button key={s.n} type="button" role="tab" className="ba-chip" data-go={s.n} aria-selected={s.n === 1}>
            <i>{s.n}</i>
            <span>
              <b>{s.k}</b>
              <span className="muted">{s.t}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="ba-split">
        <Half side="in" />
        <Half side="fn" />
      </div>
      <p className="ba-foot small muted">
        A made-up survey business. The windows are simplified stand-ins for the desktop apps, which change often. On the day you use the real ones.
      </p>
    </div>
  );
}
