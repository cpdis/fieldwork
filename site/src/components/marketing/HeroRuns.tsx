/**
 * The hero's chat window: a prompt is typed, sent, and the app's real reply
 * arrives (src/lib/demo-transcripts.ts), then the next run, alternating apps.
 * public/site.js drives it by setting attributes only. Without JavaScript the
 * first run shows complete.
 */
import { HERO_RUNS } from '@/lib/demo-transcripts';
import { Md } from './Md';

export function HeroRuns() {
  return (
    <div className="hr" data-hero>
      <div className="hr-win">
        <div className="hr-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          {HERO_RUNS.map((r, i) => (
            <span key={i} className="hr-app" data-i={i}>
              {r.app}
              {r.model ? ` · ${r.model}` : ''}
            </span>
          ))}
        </div>
        <div className="hr-chat">
          {HERO_RUNS.map((r, i) => (
            <article key={i} className="hr-run" data-i={i} data-state="reply">
              <div className="me">{r.prompt}</div>
              <div className="think" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              {r.replies[0] ? (
                <div className="ai">
                  <Md text={r.replies[0]} />
                </div>
              ) : (
                <p className="ai pending mono">Reply not captured yet</p>
              )}
            </article>
          ))}
        </div>
        <div className="composer">
          <p className="composer-text">
            <span className="typed" data-text="" />
            <span className="caret" aria-hidden="true" />
          </p>
          <span className="send" aria-hidden="true">
            ↑
          </span>
        </div>
      </div>
      <ol className="hr-list">
        {HERO_RUNS.map((r, i) => (
          <li key={i}>
            <button type="button" data-i={i} aria-current={i === 0 ? 'true' : undefined}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <span>{r.label}</span>
              <span className="mono">{r.app}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="hr-foot small muted">Real replies, copied word for word. The businesses are made up.</p>
    </div>
  );
}
