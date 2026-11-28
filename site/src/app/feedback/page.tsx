import { Footer, Header } from '@/components/Chrome';
import { APPS, RECOMMEND } from '@/lib/feedback';
import '../marketing.css';
import './feedback.css';

export const metadata = { title: 'Feedback', robots: { index: false } };

type Props = { searchParams: Promise<{ sent?: string; error?: string; day?: string }> };

const ERRORS: Record<string, string> = {
  empty: 'Answer at least one question, then send.',
  server: 'That didn’t go through. Please try again in a minute.',
};

/** Five questions after the day, linked from the close page and the thank-you email. */
export default async function Feedback({ searchParams }: Props) {
  const q = await searchParams;
  return (
    <>
      <Header />
      <main className="wrap fb">
        <p className="eyebrow">Feedback</p>
        <h1>How was the day?</h1>
        {q.sent ? (
          <p className="lede">Thank you. Colin reads every answer, and the next day changes because of them.</p>
        ) : (
          <>
            <p className="lede">Take your time. There are no wrong answers, and every one shapes the next day.</p>
            <form method="post" action="/api/feedback" className="fb-form">
              {q.error && ERRORS[q.error] && <p className="notice bad">{ERRORS[q.error]}</p>}
              <input type="hidden" name="day" value={q.day ?? ''} />
              <div className="hp" aria-hidden="true">
                <label>
                  Website <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <fieldset className="fb-q pick inline">
                <legend>Which app did you use today?</legend>
                {APPS.map((a) => (
                  <label key={a} className="opt chip">
                    <input type="radio" name="app" value={a} /> <span>{a}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="fb-q pick inline">
                <legend>How useful was the day for your business?</legend>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="opt chip">
                    <input type="radio" name="useful" value={n} /> <span>{n}</span>
                  </label>
                ))}
                <p className="fb-hint">1 is not at all, 5 is very useful.</p>
              </fieldset>

              <label className="fb-q">
                What will you use this week?
                <textarea name="keep" rows={4} />
              </label>

              <label className="fb-q">
                What should change for the next day?
                <textarea name="change" rows={4} />
              </label>

              <fieldset className="fb-q pick inline">
                <legend>Would you recommend it to another business owner?</legend>
                {RECOMMEND.map((r) => (
                  <label key={r} className="opt chip">
                    <input type="radio" name="recommend" value={r} /> <span>{r}</span>
                  </label>
                ))}
              </fieldset>

              <div className="fb-q grid2">
                <label>
                  Name <span className="muted">(optional)</span> <input name="name" autoComplete="name" />
                </label>
                <label>
                  Email <span className="muted">(optional)</span> <input name="email" type="email" autoComplete="email" />
                </label>
              </div>

              <div className="fb-send">
                <button className="btn ink" type="submit">
                  Send feedback
                </button>
                <span className="small muted">Only Colin sees your answers. Leave your name off to stay anonymous.</span>
              </div>
            </form>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
