/**
 * "Same job, both apps": one job stepped through ChatGPT (left, Instrument) and
 * Claude (right, Field notes) at once. The replies are real, copied from each app
 * (src/lib/demo-transcripts.ts), so the two sides differ the way the apps do.
 * The chips set data-step on the panel and CSS shows that step; public/site.js
 * wires the chips. Without JavaScript every step shows, stacked. Equal widths,
 * and the Claude half never takes the yellow accent.
 */
import { type App, BOTH_APPS_PROMPTS, BOTH_APPS_RUNS, BOTH_APPS_STEPS } from '@/lib/demo-transcripts';
import { Md } from './Md';

const NOTES: [string, string][] = [
  ['Paste the real numbers', 'real numbers in'],
  ['Push back on one thing', 'one nudge, not a restart'],
  ['Next time is one line', 'now it’s reusable'],
];

function firstLine(p: string) {
  const [head, ...rest] = p.split('\n\n');
  return { head, rest: rest.join('\n\n') };
}

function Half({ app }: { app: App }) {
  const run = BOTH_APPS_RUNS[app];
  const isIn = app === 'ChatGPT';
  return (
    <div className={`ba-half ${isIn ? 'in' : 'fn'}`}>
      <div className="ba-label">
        <span className="nm">{app}</span>
        <span className="sub">{isIn ? 'Chat · Work · Codex' : 'Chat · Cowork · Code'}</span>
      </div>
      <div className="ba-win">
        <div className="ba-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span>{app}</span>
          {run.model && <span className="ba-model">{run.model}</span>}
        </div>
        <div className="ba-body">
          {BOTH_APPS_PROMPTS.map((p, i) => {
            const { head, rest } = firstLine(p);
            const reply = run.replies[i];
            return (
              <div key={i} className={`ba-step s${i + 1}`}>
                <div className="me">
                  <p>{head}</p>
                  {rest && <pre className="paste">{rest}</pre>}
                </div>
                {reply ? (
                  <div className="ai">
                    <Md text={reply} />
                  </div>
                ) : (
                  <p className="ai pending mono">Reply not captured yet</p>
                )}
              </div>
            );
          })}
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
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  const dates = [...new Set([BOTH_APPS_RUNS.ChatGPT.captured, BOTH_APPS_RUNS.Claude.captured].filter((d): d is string => Boolean(d)))].sort();
  return (
    <div className="ba" data-demo data-step="1">
      <div className="ba-chips" role="tablist" aria-label="Steps">
        {BOTH_APPS_STEPS.map((s, i) => (
          <button key={i} type="button" role="tab" className="ba-chip" data-go={i + 1} aria-selected={i === 0}>
            <i>{i + 1}</i>
            <span>
              <b>{s.k}</b>
              <span className="muted">{s.t}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="ba-split">
        <Half app="ChatGPT" />
        <Half app="Claude" />
      </div>
      <p className="ba-foot small muted">
        Same prompts in both apps
        {dates.length ? `, replies copied word for word on ${dates.map(fmt).join(' and ')}` : ''}
        . The suppliers and prices are made up. The window frames are simplified; on the day you use the real apps.
      </p>
    </div>
  );
}
