/// <reference types="vite/client" />
/* Opening: cover, the day, where are you on the staff, who's talking, how today works. */
import type { Page } from '@open-slide/core';
import { useState } from 'react';
import { Eyebrow, Frame, Hl, Mark, Pad, Title } from '@assets/fieldwork/brand';
import { COURSE, DAY, LEVELS, toMin } from '../course';
import { Head, PageNo, Staff, usePlay } from '../kit';

/* ---------- cover ---------- */
const Cover: Page = () => {
  const on = usePlay(200);
  return (
    <Frame label="Fieldwork">
      <Pad>
        <Eyebrow>
          A one-day course · {COURSE.where} · {COURSE.cohort} · {COURSE.when}
        </Eyebrow>
        <div className={`cover-mark b0-cover ${on ? '' : 'pre'}`}>
          <Mark />
          <span className="wm">Fieldwork</span>
        </div>
        <p className={`b0-tag ${on ? '' : 'pre'}`}>
          The Claude and ChatGPT desktop apps, for people who run a business.
        </p>
        <div className="cover-list">
          <div>
            <b>Both apps, side by side</b>
            <span>Every idea shown in ChatGPT and in Claude, with equal time. Use the one you already pay for.</span>
          </div>
          <div>
            <b>Your business, all day</b>
            <span>Each block ends with a lab on a real task from your own work, not a made-up example.</span>
          </div>
          <div>
            <b>Leave with things that run</b>
            <span>A business Project, a brand file, a skill, a scheduled job, a policy and a 30-day plan.</span>
          </div>
        </div>
      </Pad>
    </Frame>
  );
};
Cover.transition = {
  duration: 280,
  exit: { duration: 280, keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 280,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

/* ---------- the day ---------- */
const Today: Page = () => {
  const on = usePlay();
  return (
    <Frame label="Today">
      <Head eb="Today · 9:00 to 16:00" title="One day, eight blocks, one real task" />
      <PageNo />
      <div className={`b0-sched ${on ? '' : 'pre'}`}>
        {DAY.map((d, i) => (
          <div key={d.id} className={`dk-fade row ${d.kind}`} style={{ ['--i' as string]: i }}>
            <span className="t">
              {d.start}
              <span className="dk-muted">–{d.end}</span>
            </span>
            {d.kind === 'block' ? (
              <>
                <span className="n">{String(d.n).padStart(2, '0')}</span>
                <span className="b">{d.title}</span>
                <span className="o">{d.out}</span>
                <span className="lv">L{d.level}</span>
              </>
            ) : (
              <>
                <span className="n" />
                <span className="b dk-muted">{d.title}</span>
                <span className="o dk-muted">{toMin(d.end) - toMin(d.start)} min</span>
                <span className="lv" />
              </>
            )}
          </div>
        ))}
      </div>
      <div className="b0-sched-staff">
        <Staff level={5} from={1} h={35} target={[4, 5, 'Today']} />
      </div>
    </Frame>
  );
};

/* ---------- where are you on the staff? (room tally, read again at the end) ---------- */
export const roomTally: { am: Record<number, number>; pm: Record<number, number> } = { am: {}, pm: {} };

export const StaffPoll = ({ when }: { when: 'am' | 'pm' }) => {
  const [pick, setPick] = useState(when === 'am' ? 1 : 4);
  const [, force] = useState(0);
  const t = roomTally[when];
  const marks: Record<number, string> = {};
  for (const l of LEVELS) {
    const n = t[l.n] ?? 0;
    const m = roomTally.am[l.n] ?? 0;
    if (when === 'pm' && (n || m)) marks[l.n] = `${'|'.repeat(m) || ''}${m ? ' → ' : ''}${'|'.repeat(n)}`;
    else if (n) marks[l.n] = '|'.repeat(n);
  }
  const l = LEVELS[pick - 1];
  const hands = Object.values(t).reduce((a, b) => a + b, 0);
  return (
    <>
      <div className="b0-poll-staff" data-osd-interactive>
        <Staff level={pick} h={35} onPick={setPick} marks={marks} target={[4, 5, 'Today']} />
      </div>
      <div className="b0-poll-panel">
        <span className="dk-k">Level {l.n}</span>
        <div className="dk-big" style={{ fontSize: '4.6cqw' }}>
          {l.name}
        </div>
        <p className="dk-body" style={{ fontSize: '1.5cqw', maxWidth: '36cqw' }}>
          {l.looks}
        </p>
        <div className="pbtns" style={{ marginTop: '1cqw' }}>
          <button
            className="rb primary"
            type="button"
            onClick={() => {
              t[pick] = (t[pick] ?? 0) + 1;
              force((x) => x + 1);
            }}
          >
            + One hand at L{pick}
          </button>
          <button
            className="rb"
            type="button"
            onClick={() => {
              for (const k of Object.keys(t)) delete t[Number(k)];
              force((x) => x + 1);
            }}
          >
            Clear
          </button>
        </div>
        <span className="dk-k" style={{ marginTop: '.4cqw' }}>
          {hands ? `${hands} ${hands === 1 ? 'hand' : 'hands'} counted` : 'Pick a level, then count hands'}
          {when === 'pm' && Object.keys(roomTally.am).length > 0 ? ' · left of the arrow: this morning' : ''}
        </span>
      </div>
    </>
  );
};

const WhereAreYou: Page = () => (
  <Frame label="Where are you on the staff?">
    <Head
      eb="Today · the spine of the day"
      title="Where are you on the staff?"
      sum={
        <>
          Every's Eight Levels of AI Adoption, read like a levelling staff. Most owners start at L1. Today's target:{' '}
          <Hl>leave working at L4</Hl>, with one L5 workflow built and a map to L6.
        </>
      }
    />
    <PageNo />
    <StaffPoll when="am" />
    <div className="dk-src">Levels: Every, “The Eight Levels of AI Adoption”. We count the room again at 15:50.</div>
  </Frame>
);

/* ---------- who's talking ---------- */
const photo = Object.values(
  import.meta.glob('../assets/instructor.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }),
)[0] as string | undefined;

const Instructor: Page = () => (
  <Frame label="Who's talking">
    <Head eb="Today · who's talking" title={`${COURSE.instructor}. A practitioner, one step ahead of you`} />
    <PageNo />
    <div className="b0-who">
      <div className="ph">
        {photo ? <img src={photo} alt={COURSE.instructor} /> : <span>{COURSE.instructor.slice(0, 1)}</span>}
      </div>
      <div className="spec">
        {[
          ['Day job', 'Engineer and project manager. 14 years at the same engineering company. Not a software company.'],
          ['Uses AI', 'Every day. Mostly Codex at work, mostly Claude at home.'],
          ['Built since May', '21 projects in six months: 10 live sites, 3 iPhone apps in TestFlight, a pile of work tools.'],
          ['Works at', 'The scale you can copy: one agent and a couple of helpers at a time, inside a well-set-up project.'],
          ['Habit', 'Goes to the 20th version, not the first. Today shows that habit, and the deck is the evidence.'],
        ].map(([k, v]) => (
          <div key={k}>
            <span className="dk-k">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  </Frame>
);

/* ---------- how today works ---------- */
const HowToday: Page = () => (
  <Frame label="How today works">
    <Head eb="Today · how it works" title="Four rules for the room" />
    <PageNo />
    <div className="b0-rules">
      {[
        ['01', 'Idea, both apps, your business', 'Each block: a short idea, the same job in ChatGPT and in Claude, then a lab on your own work.'],
        ['02', 'Use the app you pay for', 'The labs show both. No one needs to switch tools today, and nothing here needs code.'],
        ['03', 'One real task, all day', 'The task from your intake form grows through the labs. By 16:00 it runs as a skill.'],
        ['04', 'Ask out loud', 'If you are stuck, someone else is too. Questions are the best part of the day.'],
      ].map(([n, t, s]) => (
        <div key={n}>
          <span className="dk-k">{n}</span>
          <b>{t}</b>
          <span>{s}</span>
        </div>
      ))}
    </div>
    <div className="b0-house">
      <span className="dk-k">Housekeeping</span>
      <span>Breaks 10:45 and 15:00 · Lunch 12:00 · Finish 16:00</span>
      {COURSE.wifi.name && (
        <span>
          Wi-Fi <b>{COURSE.wifi.name}</b> · <b>{COURSE.wifi.password}</b>
        </span>
      )}
      <span>Phones are fine. Laptops open, chargers in.</span>
    </div>
  </Frame>
);

export const pages: [Page, string][] = [
  [
    Cover,
    'Cover. Up as people arrive. Welcome them, point at coffee. Start at 9:00 sharp: owners notice when you respect their time.',
  ],
  [
    Today,
    '1 min. The shape of the day. Point at the right column: everyone leaves with these six things, made on their own business. The staff on the right climbs from L1 to L5 by the end.',
  ],
  [
    WhereAreYou,
    '3 min. Click each level and read it out. Ask: "Hands up if this is you." Click "+ One hand" for each hand at that level. Most of the room will be L1 or L2. Say: "That is normal. By 4pm you will be at L4." The tally is kept for the regrade at 15:50.',
  ],
  [
    Instructor,
    '2 min. Keep it short. The point is "peer, not guru": you are an engineer who uses this every day, at a scale they can copy. Add a photo at slides/fieldwork-day/assets/instructor.jpg.',
  ],
  [
    HowToday,
    '1 min. The four rules. Rule 3 matters most: the intake task. If someone did not fill in the intake form, ask them now for one annoying recurring task.',
  ],
];
