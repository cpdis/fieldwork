import type { Page } from '@open-slide/core';
import { Eyebrow, Frame, Hl, Mark, Pad, SideLabel, Split, Title } from '@assets/fieldwork/brand';

const Cover: Page = () => (
  <Frame>
    <Pad>
      <Eyebrow>Fieldwork · theme preview</Eyebrow>
      <div className="cover-mark">
        <Mark />
        <span className="wm">Fieldwork</span>
      </div>
    </Pad>
  </Frame>
);

const Dual: Page = () => (
  <Frame>
    <Pad>
      <Eyebrow>Block 3 · 10:40 · Same job, two apps</Eyebrow>
      <Title>
        One idea across the top, <Hl>two apps</Hl> below
      </Title>
    </Pad>
    <Split
      top="12cqw"
      left={<SideLabel name="OpenAI · ChatGPT + Codex" sub="Instrument side" />}
      right={
        <>
          <SideLabel name="Claude" sub="same job, other app" />
          <div className="mapline">red pencil, never yellow</div>
        </>
      }
    />
  </Frame>
);

export default [Cover, Dual] satisfies Page[];
