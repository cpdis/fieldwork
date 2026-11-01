/*
 * Shared plumbing for the clicker-stepped staged demos (Blocks 3 and 4).
 *
 * useBeats: the beat the clicker has reached (through <BeatSteps>), plus a chip or button pick
 * that overrides it until the clicker moves again. Pass `take` to Staged so a pick replays.
 * Staged: one Stage that plays beat b once, starting from the end of beat b - 1. Off the live
 * page (thumbnails, presenter preview) it is a still of the beat's end.
 *
 * These stages are drawn at scale 1: give the Stage the pixel width of its box, so cqw
 * inside it means what it means everywhere else on the page. The box widths below are
 * whole pixels on the 1920 canvas (92.5cqw = 1776px).
 */
import { type ReactNode, useCallback, useState } from 'react';
import type { Script } from './vendor/kit/act';
import type { Rect } from './vendor/kit/measure';
import { Stage, type StageProps } from './vendor/kit/stage';

export const useBeats = (count: number) => {
  const [beat, setBeat] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  /** bumps on every pick, so picking the beat already showing plays it again */
  const [take, setTake] = useState(0);
  const onBeat = useCallback(
    (b: number) => {
      setBeat(Math.min(b, count - 1));
      setPick(null);
    },
    [count],
  );
  const choose = useCallback((b: number) => {
    setPick(b);
    setTake((t) => t + 1);
  }, []);
  return { beat: pick ?? beat, onBeat, pick: choose, take };
};

export function Staged<S extends object>({
  beat,
  take = 0,
  live,
  base,
  ends,
  beats,
  width,
  height,
  cursor,
  className,
  children,
}: {
  beat: number;
  take?: number;
  live: boolean;
  base: S;
  ends: S[];
  beats: (Script<S> | undefined)[];
  width: number;
  height: number;
  cursor?: (beat: number) => StageProps<S>['cursor'];
  className?: string;
  children: (s: S, rect: (name: string) => Rect) => ReactNode;
}) {
  const b = Math.max(0, Math.min(ends.length - 1, beat));
  const script = live ? beats[b] : undefined;
  return (
    <Stage<S>
      key={`${b}-${live}-${take}`}
      width={width}
      height={height}
      unframed
      play="once"
      initial={script ? (b ? ends[b - 1] : base) : ends[b]}
      poster={ends[b]}
      script={script}
      cursor={script ? cursor?.(b) : undefined}
      className={className}
    >
      {(s, rect) => children(s, rect)}
    </Stage>
  );
}
