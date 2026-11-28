import { Footer, Header } from '@/components/Chrome';
import { APPS, RECOMMEND } from '@/lib/feedback';
import '../marketing.css';

export const metadata = { title: 'Feedback', robots: { index: false } };

type Props = { searchParams: Promise<{ sent?: string; error?: string }> };

const ERRORS: Record<string, string> = {
  empty: 'Answer at least one question, then send.',
  server: 'That didn’t go through. Please try again in a minute.',
};

/** Five questions at the end of the day, or from the thank-you email that evening. */
export default async function Feedback({ searchParams }: Props) {
  const q = await searchParams;
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 48, maxWidth: 720 }}>
        <p className="eyebrow">Feedback</p>
        <h1 style={{ marginTop: 12 }}>Five questions, two minutes.</h1>
        {q.sent ? (
          <p className="lede">Thank you. Colin reads every one.</p>
        ) : (
          <form className="card stack" method="post" action="/api/feedback" style={{ marginTop: 32, gap: 24 }}>
            {q.error && ERRORS[q.error] && <p className="notice bad">{ERRORS[q.error]}</p>}
            <div className="hp" aria-hidden="true" style={{ position: 'absolute', left: -9999 }}>
              <label>
                Website <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <fieldset className="pick inline">
              <legend>1. Which app did you use today?</legend>
              {APPS.map((a) => (
                <label key={a} className="opt chip">
                  <input type="radio" name="app" value={a} /> <span>{a}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className="pick inline">
              <legend>2. How useful was the day for your business? 1 is not at all, 5 is very.</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="opt chip">
                  <input type="radio" name="useful" value={n} /> <span>{n}</span>
                </label>
              ))}
            </fieldset>
            <label>
              3. What will you use this week?
              <textarea name="keep" rows={3} />
            </label>
            <label>
              4. What should change for the next day?
              <textarea name="change" rows={3} />
            </label>
            <fieldset className="pick inline">
              <legend>5. Would you recommend it to another business owner?</legend>
              {RECOMMEND.map((r) => (
                <label key={r} className="opt chip">
                  <input type="radio" name="recommend" value={r} /> <span>{r}</span>
                </label>
              ))}
            </fieldset>
            <div className="grid2">
              <label>
                Name <span className="muted">(optional)</span> <input name="name" autoComplete="name" />
              </label>
              <label>
                Email <span className="muted">(optional)</span> <input name="email" type="email" autoComplete="email" />
              </label>
            </div>
            <div className="row">
              <button className="btn ink" type="submit">
                Send
              </button>
              <span className="small muted">Goes only to Colin. Leave your name off to stay anonymous.</span>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
