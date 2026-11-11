/*
 * Block 3 "Same ask. Turn up the context": the email, staged with the Stageshow kit
 * (vendor/, MIT, Benji Taylor).
 *
 * Beat n is dial level n. Each beat attaches that level's context to the draft, fades the old
 * email and writes the new one in, a word at a time. Words from the step just added are
 * highlighted, words from earlier steps underlined. Drawn at scale 1 (see staged.tsx).
 */
import type { Script } from './vendor/kit/act';
import { Check } from './vendor/kit/parts/Check';
import { Staged } from './staged';
import './context-mail.css';

type Seg = [string, number?];
const EMAILS: { subj: Seg[]; body: Seg[][] }[] = [
  {
    subj: [['Following up on our recent visit']],
    body: [
      [['Dear [Client Name],']],
      [['Thank you for taking the time to meet with us yesterday. It was a pleasure discussing your project, and we are excited about the opportunity to work with you.']],
      [['We will be in touch shortly with next steps. Please don’t hesitate to reach out if you have any questions.']],
      [['Best regards,'], ['\n[Your Name]']],
    ],
  },
  {
    subj: [['Your '], ['boundary survey', 1], [' – next steps']],
    body: [
      [['Hi '], ['Anna', 1], [',']],
      [['Thanks for having us out yesterday. '], ['Ridgeline', 1], [' will prepare a quote for the boundary survey and send it '], ['within two working days', 1], ['.']],
      [['Any questions in the meantime, just reply to this email.']],
      [['Cheers,', 1], ['\nJess Tran, Licensed Surveyor', 1]],
    ],
  },
  {
    subj: [['14 Ashby Rd', 2], [' – '], ['boundary survey', 1], [' next steps']],
    body: [
      [['Hi '], ['Anna', 1], [',']],
      [['Thanks for walking the block with me yesterday. Quick recap: '], ['two of the four boundary pegs are missing (NE and SE corners)', 2], ['. '], ['The eastern fence may sit up to 0.4 m inside your boundary', 2], ['; the survey will confirm it.']],
      [['I’ll send the quote '], ['by Thursday', 2], [' so we can survey '], ['before your fencer starts on the 21st', 2], ['.']],
      [['Cheers,', 1], ['\nJess', 1]],
    ],
  },
  {
    subj: [['14 Ashby Rd', 2], [' – '], ['what we found and what’s next', 3]],
    body: [
      [['Hi '], ['Anna', 1], [',']],
      [['What we found: ', 3], ['two boundary pegs missing (NE and SE corners)', 2], ['. '], ['The eastern fence may sit up to 0.4 m inside your boundary', 2], ['.']],
      [['What happens next: ', 3], ['quote by Thursday', 2], [', survey next week, '], ['before your fencer starts on the 21st', 2], ['.']],
      [['What we need from you: ', 3], ['your Certificate of Title, if it’s handy.', 3]],
      [['Cheers,', 1], ['\nJess', 1]],
    ],
  },
];
export const LEVELS = EMAILS.length;

/** What each level attaches to the request. Level 0 is the request on its own. */
const CHIPS = ['The ask', 'Project · Ridgeline Surveying', 'site-visit-notes.txt', 'email-you-liked.eml'];

/* Each email as words (with the spaces inside their segment, so a highlight runs on), numbered in reading order. */
type Tok = { t: string; k: '' | 'new' | 'old'; i: number };
const MAILS = EMAILS.map((e, lv) => {
  let n = 0;
  const toks = (segs: Seg[]): Tok[] =>
    segs.flatMap(([t, k]) => (t.match(/\s*\S+\s*/g) ?? [t]).map((w) => ({ t: w, k: k ? (k === lv ? 'new' : 'old') : '', i: n++ }) as Tok));
  const subj = toks(e.subj);
  const body = e.body.map(toks);
  return { subj, body, words: n };
});

type S = { chips: number; pop: number; fade: boolean; mail: number; words: number; busy: boolean };
const W = 1140;
const H = 665;

const BASE: S = { chips: 0, pop: -1, fade: false, mail: -1, words: 0, busy: false };
const END: S[] = MAILS.map((m, i) => ({ ...BASE, chips: i, mail: i, words: m.words }));

const write =
  (lv: number): Script<S> =>
  async (a) => {
    await a.wait(350);
    if (lv > 0) {
      await a.set({ chips: lv, pop: lv });
      await a.wait(700);
      await a.set({ fade: true });
      await a.wait(420);
    }
    await a.set({ mail: lv, words: 0, fade: false, busy: true });
    await a.wait(300);
    for (let w = 1; w <= MAILS[lv].words; w++) {
      a.put({ words: w });
      await a.wait(26);
    }
    await a.wait(200);
    await a.set({ busy: false });
  };
const BEATS = EMAILS.map((_, i) => write(i));

const Words = ({ toks, count }: { toks: Tok[]; count: number }) => (
  <>
    {toks.map((w) => (
      <span key={w.i} className={`cd-w ${w.k}`} data-on={w.i < count || undefined}>
        {w.t}
      </span>
    ))}
  </>
);

const Mail = ({ s }: { s: S }) => {
  const m = s.mail >= 0 ? MAILS[s.mail] : null;
  return (
    <div className="cd-mail" data-fade={s.fade || undefined}>
      <div className="cd-bar">
        <span className="cd-dots">
          <i />
          <i />
          <i />
        </span>
        <span>New message</span>
        <span className="cd-st">
          {s.mail >= 0 && <Check on={!s.busy} pending={s.busy} size={16} />}
          {s.mail < 0 ? 'Waiting' : s.busy ? 'Writing' : 'Draft ready'}
        </span>
      </div>
      <div className="cd-head">
        <div className="cd-row">
          <span className="cd-k">It knows</span>
          <span className="cd-chips">
            {CHIPS.map((c, i) => (
              <span key={c} className="cd-chip" data-ask={i === 0 || undefined} data-on={i <= s.chips || undefined} data-new={(i > 0 && i === s.chips) || undefined} data-pop={i === s.pop || undefined}>
                {c}
              </span>
            ))}
          </span>
        </div>
        <div className="cd-row">
          <span className="cd-k">Subject</span>
          <b className="cd-subj">{m && <Words toks={m.subj} count={s.words} />}</b>
        </div>
      </div>
      <div className="cd-body">
        {m?.body.map((p, i) => (
          <p key={`${s.mail}-${i}`}>
            <Words toks={p} count={s.words} />
          </p>
        ))}
      </div>
    </div>
  );
};

export const ContextMail = ({ level, take, live }: { level: number; take: number; live: boolean }) => (
  <div className="cd">
    <Staged<S> beat={level} take={take} live={live} base={BASE} ends={END} beats={BEATS} width={W} height={H}>
      {(s) => <Mail s={s} />}
    </Staged>
  </div>
);
