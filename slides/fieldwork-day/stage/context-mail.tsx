/*
 * Block 3 "Same ask. Turn up the context": the email, staged with the Stageshow kit
 * (vendor/, MIT, Benji Taylor).
 *
 * Beat n is dial level n. Each beat attaches that level's context to the draft, fades the old
 * email and writes the new one in, a word at a time. Words from the step just added are
 * highlighted, words from earlier steps underlined. Drawn at scale 1 (see staged.tsx).
 */
import { useEffect, useRef } from 'react';
import type { Script } from './vendor/kit/act';
import { Check } from './vendor/kit/parts/Check';
import { Staged } from './staged';
import './context-mail.css';

type Seg = [string, number?];
/*
 * Real drafts, copied word for word from Claude (Fable 5.2, Medium) in incognito chats on
 * 28 Nov 2026: the same ask each time, with the Project instructions, the notes and the email
 * pasted in under it (see /mnt/project-files/deck/real-runs-2026-11-28 for the prompts and
 * Claude's notes around each draft). Never edit the words. The numbers only mark which step
 * a phrase came from, for the highlight. A paragraph starting "- " is a bullet.
 */
const EMAILS: { subj: Seg[]; body: Seg[][] }[] = [
  {
    subj: [['Follow-up: [site/project] visit, 27 November']],
    body: [
      [['Hi [Name],']],
      [['Thanks for your time on site yesterday. Summary of where we landed:']],
      [['Observed']],
      [['- [Finding 1]']],
      [['- [Finding 2]']],
      [['- [Finding 3]']],
      [['Agreed']],
      [['- [Decision / scope point 1]']],
      [['- [Decision / scope point 2]']],
      [['Open items']],
      [['- [Item] — [owner], by [date]']],
      [['- [Item] — [owner], by [date]']],
      [['From you, I need [drawings / access / approvals / information] by [date] to keep [milestone] on track.']],
      [["From me, you'll have [deliverable: quote / report / revised programme] by [date]."]],
      [["If anything above doesn't match your understanding, let me know and I'll correct the record."]],
      [['Regards,\n[Your name]']],
    ],
  },
  {
    subj: [['Follow-up from Friday’s site visit – [site address]']],
    body: [
      [['Hi [client first name],']],
      [['Thanks for showing me around [site address] on Friday.']],
      [['To confirm what we talked about, you’re after [survey type, e.g. feature and contour survey / boundary re-establishment] for [purpose, e.g. the rear extension / new fence line].']],
      [['From what I saw on site, [key observation, e.g. the rear boundary pegs are missing / access down the side is tight / the retaining wall sits close to the boundary]. [What that means for the job, if anything.]']],
      [['Our fee for this work is [price list item] at $[amount] including GST. [Any extra item and price, e.g. additional pegs at $[amount] each.]']],
      [['Before we can book the fieldwork, I need [what you need from the client, e.g. a copy of the Certificate of Title / your written go-ahead / side gate access].']],
      [['Once I have that, '], ['I’ll come back to you with a confirmed date', 1], [' for the fieldwork.']],
      [['Any questions, give me a call on [phone].']],
      [['Cheers,\nJess', 1]],
      [['Jess Tran\nLicensed Surveyor\nRidgeline Surveying', 1]],
    ],
  },
  {
    subj: [['14 Ashby Rd boundary survey', 2], [' – follow-up from Friday’s visit']],
    body: [
      [['Hi '], ['Anna', 2], [',']],
      [['Thanks for '], ['walking the block', 2], [' with me on Friday.']],
      [['A quick summary of what we found:']],
      [['- '], ['The north-east and south-east corner pegs are missing', 2], [', so both will need to be re-established as part of the boundary survey.']],
      [['- '], ['The east fence looks like it sits inside your boundary, by up to about 0.4 m', 2], [' in places. That’s only from what we could see on the day, and the survey will confirm where the boundary actually runs.']],
      [['I’ll send your quote through '], ['by Thursday 3 December', 2], ['.']],
      [['I know '], ['your fencer starts on the 21st', 2], ['. '], ['I can’t confirm a survey date yet', 1], [', but I’ll let you know what’s available when I send the quote. In the meantime, it’s worth letting your fencer know the east boundary is still to be confirmed, so the new fence isn’t set out from the old fence line.']],
      [['If you have any questions before then, just reply to this email.']],
      [['Regards,\n'], ['Jess', 1]],
      [['Jess Tran\nLicensed Surveyor\nRidgeline Surveying', 1]],
    ],
  },
  {
    subj: [['14 Ashby Rd', 2], [' – '], ['what we found and what’s next', 3]],
    body: [
      [['Hi '], ['Anna', 2], [',']],
      [['What we found: ', 3], ['the north-east and south-east corner pegs are missing', 2], ['. '], ['The east fence looks to be up to 0.4 m inside your boundary', 2], ['. The survey will confirm that.']],
      [['What happens next: ', 3], ['I’ll send your quote by Thursday', 2], ['. I know '], ['your fencer starts on the 21st', 2], [', so '], ['I’ll confirm a survey date with you as soon as it’s locked in', 1], ['.']],
      [['What we need from you: ', 3], ['nothing just yet. If the fencer’s start date changes, let me know.']],
      [['Cheers,\nJess', 3]],
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
  const li = e.body.map((p) => p[0][0].startsWith('- '));
  const body = e.body.map((p, i) => toks(li[i] ? (p[0][0] === '- ' ? p.slice(1) : [[p[0][0].slice(2), p[0][1]] as Seg, ...p.slice(1)]) : p));
  return { subj, body, li, words: n };
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
  /* The real drafts run longer than the window: keep the word being written in view. */
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const on = el.querySelectorAll('.cd-w[data-on]');
    const last = on[on.length - 1] as HTMLElement | undefined;
    if (!last) {
      el.scrollTop = 0;
      return;
    }
    const box = el.getBoundingClientRect();
    const k = box.height / el.offsetHeight || 1; // the deck canvas is scaled to the window
    const bottom = (last.getBoundingClientRect().bottom - box.top) / k + el.scrollTop;
    if (bottom > el.scrollTop + el.clientHeight - 8) el.scrollTop = bottom - el.clientHeight + 8;
  }, [s.words, s.mail]);
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
      <div className="cd-body" ref={body} data-long={(m && m.words > 110) || undefined}>
        {m?.body.map((p, i) => (
          <p key={`${s.mail}-${i}`} className={m.li[i] ? 'cd-li' : undefined}>
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
