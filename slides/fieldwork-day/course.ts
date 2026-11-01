/*
 * Settings for one run of the course. Change these before each cohort; every page reads them.
 * Times are local (Perth). The break and lunch pages count down to the next block's start.
 */
export const COURSE = {
  name: 'Fieldwork',
  cohort: 'Pilot 1',
  when: 'December 2026',
  where: 'Perth',
  instructor: 'Colin',
  /** Shown on the close page when set, for example 'colin@yourdomain.com.au'. */
  contact: '',
  /** Shown on the housekeeping page when set. */
  wifi: { name: '', password: '' },
};

export type BlockId = 'why' | 'map' | 'context' | 'make' | 'agents' | 'repeat' | 'background' | 'trust';

export type DaySlot =
  | { kind: 'block'; id: BlockId; n: number; start: string; end: string; title: string; short: string; level: number; out: string }
  | { kind: 'break'; id: string; start: string; end: string; title: string };

/** The day. `level` is the reading on the staff (Every's Eight Levels) that the block teaches. */
export const DAY: DaySlot[] = [
  { kind: 'block', id: 'why', n: 1, start: '9:00', end: '9:30', title: 'Why now', short: 'Why now', level: 1, out: 'A reason to care' },
  { kind: 'block', id: 'map', n: 2, start: '9:30', end: '10:00', title: 'The map of the apps', short: 'The map', level: 1, out: 'Your first useful task' },
  { kind: 'block', id: 'context', n: 3, start: '10:00', end: '10:45', title: 'Context is everything', short: 'Context', level: 2, out: 'Your business Project' },
  { kind: 'break', id: 'break1', start: '10:45', end: '11:00', title: 'Break' },
  { kind: 'block', id: 'make', n: 4, start: '11:00', end: '12:00', title: 'Making things that look good', short: 'Making things', level: 3, out: 'A brand file and one asset' },
  { kind: 'break', id: 'lunch', start: '12:00', end: '13:00', title: 'Lunch' },
  { kind: 'block', id: 'agents', n: 5, start: '13:00', end: '14:00', title: 'Agents and computer use', short: 'Agents', level: 4, out: 'An admin job done by an agent' },
  { kind: 'block', id: 'repeat', n: 6, start: '14:00', end: '14:45', title: 'Make it repeatable', short: 'Repeatable', level: 5, out: 'Your first skill' },
  { kind: 'break', id: 'break2', start: '14:45', end: '15:00', title: 'Break' },
  { kind: 'block', id: 'background', n: 7, start: '15:00', end: '15:30', title: 'Background agents', short: 'Background', level: 6, out: 'One job on a schedule' },
  { kind: 'block', id: 'trust', n: 8, start: '15:30', end: '16:00', title: 'Trust and next steps', short: 'Trust', level: 5, out: 'A policy and a 30-day plan' },
];

export const blockById = (id: BlockId) => DAY.find((d) => d.kind === 'block' && d.id === id) as Extract<DaySlot, { kind: 'block' }>;

/** Every's Eight Levels of AI Adoption, the spine of the day. */
export const LEVELS = [
  { n: 1, name: 'Chatbot', looks: 'You ask, it answers, you copy and paste.' },
  { n: 2, name: 'Copilot', looks: 'It works inside your files: the doc, the sheet, the inbox.' },
  { n: 3, name: 'Agent', looks: 'It works through steps and checks in with you.' },
  { n: 4, name: 'Autopilot', looks: 'It finishes the job. You review the result.' },
  { n: 5, name: 'Workflows', looks: 'Saved methods that make the output reliable: skills, plugins.' },
  { n: 6, name: 'Assistant', looks: 'It works in the background, on a schedule, and asks before it acts.' },
  { n: 7, name: 'Multi-agent', looks: 'A few agents split a big job between them.' },
  { n: 8, name: 'Orchestrator', looks: 'You run a team of agents like a team of people.' },
];

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
