/*
 * Clicker beats for a staged demo. Renders `count` hidden open-slide <Step>s, so the
 * presenter's clicker (arrow keys, space, the presenter view) steps through them the
 * same way it reveals any other step, and reports how many are revealed.
 * Entering the page backwards reveals them all, so the demo shows its finished state.
 */
import { Step, Steps } from '@open-slide/core';
import { useLayoutEffect, useRef } from 'react';

export const BeatSteps = ({ count, onBeat }: { count: number; onBeat: (beat: number) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => onBeat(el.querySelectorAll('[data-osd-step="revealed"]').length);
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { subtree: true, attributes: true, attributeFilter: ['data-osd-step'] });
    return () => mo.disconnect();
  }, [onBeat]);
  return (
    <div ref={ref} hidden aria-hidden="true">
      <Steps>
        {Array.from({ length: count }, (_, i) => (
          <Step key={i} duration={0}>
            <i />
          </Step>
        ))}
      </Steps>
    </div>
  );
};
