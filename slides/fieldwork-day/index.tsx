/*
 * Fieldwork · the full day (9:00–16:00). One deck for the whole course.
 * Blocks live in ./blocks, shared deck pieces in ./kit.tsx, run settings in ./course.ts.
 * Each block exports [Page, note] pairs so speaker notes can never drift out of line with pages.
 */
import type { Page, SlideMeta, SlideTransition } from '@open-slide/core';
import { pages as b0 } from './blocks/b0-opening';
import { pages as b1 } from './blocks/b1-why';
import { pages as b2 } from './blocks/b2-map';
import { pages as b3 } from './blocks/b3-context';
import { pages as b4 } from './blocks/b4-make';
import { pages as b5 } from './blocks/b5-agents';
import { pages as b6 } from './blocks/b6-repeat';
import { pages as b7 } from './blocks/b7-background';
import { pages as b8 } from './blocks/b8-trust';
import { breakPage, registry } from './kit';
import './deck.css';
import './mocks.css';

const Break1 = breakPage({ title: 'Break', back: '11:00', sub: 'Fifteen minutes. Your Project is saved. Coffee is at the back.' });
const Lunch = breakPage({ title: 'Lunch', back: '13:00', sub: 'An hour. After lunch: agents that do the work while you watch.' });
const Break2 = breakPage({ title: 'Break', back: '15:00', sub: 'Fifteen minutes. Your skill is saved. Last stretch after this.' });

const all: [Page, string][] = [
  ...b0,
  ...b1,
  ...b2,
  ...b3,
  [Break1, 'Break page. It counts down to 11:00 on the day. Leave it up.'],
  ...b4,
  [Lunch, 'Lunch page. Counts down to 13:00. Ask two people over lunch what they built in Lab 3; use one as the example at 13:00.'],
  ...b5,
  ...b6,
  [Break2, 'Break page. Counts down to 15:00. Walk the room: who has a skill that ran on new input? Ask one of them to show it at 15:00.'],
  ...b7,
  ...b8,
];

all.forEach(([p], i) => registry.set(p, i + 1));

// House transition: "rise". Hold the outgoing page, fade the next one up 6px.
export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)', keyframes: [{ opacity: 1 }, { opacity: 1 }] },
  enter: {
    duration: 260,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

export const meta: SlideMeta = { title: 'Fieldwork · the full day', createdAt: '2026-11-01T00:00:00Z' };
export const notes = all.map(([, n]) => n);
export default all.map(([p]) => p) satisfies Page[];
