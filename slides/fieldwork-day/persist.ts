/*
 * Room state that must survive a reload or a crash between 9:00 and 16:00: the hand counts,
 * the lab timers and the sort boards. Kept in the browser's local storage, one bucket per cohort.
 * Every read and write is wrapped: with storage blocked, the deck still runs, it just forgets.
 */
import { useState } from 'react';
import { COURSE } from './course';

const bucket = `fieldwork-day:${COURSE.cohort}:${COURSE.when}`;

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${bucket}:${key}`);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function saveState(key: string, value: unknown) {
  try {
    localStorage.setItem(`${bucket}:${key}`, JSON.stringify(value));
  } catch {
    /* storage full or blocked: carry on without it */
  }
}

/** Wipes every saved count, timer and sort for this cohort. Called from the cover's "New session" button. */
export function clearRoomState() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(`${bucket}:`)) localStorage.removeItem(k);
  } catch {
    /* nothing to clear */
  }
}

/**
 * useState that also saves to local storage. Pass `live = false` on thumbnails and the presenter view,
 * where pages show their finished state and must not read or overwrite what the room did.
 */
export function useSaved<T>(key: string, initial: T, live = true): [T, (v: T | ((prev: T) => T)) => void] {
  const [v, setV] = useState<T>(() => (live ? loadState(key, initial) : initial));
  const set = (next: T | ((prev: T) => T)) =>
    setV((prev) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      if (live) saveState(key, value);
      return value;
    });
  return [v, set];
}
