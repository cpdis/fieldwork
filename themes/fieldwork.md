---
name: Fieldwork
description: Instrument-grade light theme for the Fieldwork AI course. Warm paper, ink, one levelling-staff yellow, with a Field-notes half for Claude.
mode: light
---

# Fieldwork

Source of truth: `course/design/brand-brief.md` (sections 2, 5, 8 and 9). This file is the agent-facing summary. Where they differ, the brief wins.

**Do not paste components from this file.** Every Fieldwork deck imports the shared brand module instead, so the brand has one source:

```tsx
import { Frame, Pad, Eyebrow, Title, Hl, Mark, Split, SideLabel, InsetWindow, Chip } from '@assets/fieldwork/brand';
```

`assets/fieldwork/brand.tsx` loads the webfonts and imports `assets/fieldwork/fieldwork.css` (tokens and primitives, scoped under `.fw`). Every page's root is `<Frame>`.

## Palette

| Role | Token | Value | Notes |
| --- | --- | --- | --- |
| bg | `--paper` | `#f6f6f3` | warm off-white page |
| text | `--ink` | `#141518` | primary copy, rules, ink fills |
| muted | `--muted` | `#6a6d74` | secondary copy, mono labels |
| accent | `--accent` | `#ffc400` | levelling-staff yellow. Highlighter fill only (see Accent rules) |
| surface | `--white` | `#ffffff` | app windows, cards |
| hairline | `--rule` | `#e1e2dc` | dividers |
| frame | `--alu` | `#d6d8d1` | chip and window borders |
| Field-notes paper | `--fn-paper` | `#edf2e5` | Claude half background |
| Field-notes grid | `--fn-grid` | `#d3dfc6` | 1.6cqw graph-paper grid |
| Field-notes ink | `--fn-ink` | `#24282b` | Claude half text |
| red pencil | `--fn-red` | `#c0392b` | marks on the Claude half (replaces the accent there) |
| status | `--ok` `--warn` `--bad` | `#1f7a4d` `#a86400` `#c2311f` | outlined status tags only |

Light only. No dark variant.

## Accent rules

- Yellow is a fill with ink on it (11.4:1). Never yellow text or yellow hairlines on paper (1.5:1). Yellow text on an ink fill is fine.
- About 2% of any surface: one highlighted word, one key number, one primary button, a hotspot.
- Use `<Hl>` for a highlighted word.
- Focus rings: ink outline plus a yellow outer ring (already in the stylesheet).
- The Field-notes (Claude) half never takes the accent. The red pencil marks things there (underline, circle, handwriting).

## Typography

- Display and body: **Instrument Sans** 400–700. Headlines 600, tight tracking (-0.035em).
- Labels, numbers, eyebrows: **IBM Plex Mono** 400–500, uppercase eyebrows with 0.06em tracking.
- Field-notes half only: **Newsreader** (serif side label) and **Caveat** (hand annotations). **Source Sans 3** for small Field-notes labels.
- These five families are loaded by `brand.tsx`. Do not add others, and do not fall back to the open-slide default of one font pair.
- No italic display headings.
- Sizes are in `cqw` on the 1920 canvas (1cqw = 19.2px): title 3.3cqw, eyebrow 0.95cqw, body 1.2–1.5cqw, cover wordmark 9cqw.

## Layout

- Page padding: 3cqw top, 3.6cqw sides (`<Pad>`).
- Header pattern: eyebrow ("Block N · time · topic"), title, optional one-line summary at 1.2cqw.
- Dual-track pages use `<Split top="…">`: **Instrument on the left (OpenAI: ChatGPT and Codex), Field notes on the right (Claude).** Same side every time. Equal widths, equal window sizes.
- Identify each tool with a small neutral `<SideLabel>`. Never use Anthropic or OpenAI brand colours.
- One idea per page. Let whitespace do the work.

## Fixed components

All live in `assets/fieldwork/brand.tsx`:

- `Frame` is the page root: tokens, paper, and the cqw container.
- `Pad`, `Eyebrow`, `Title` and `Hl` make up the header.
- `Mark` is the benchmark mark: a yellow bar over a tripod.
- `Split` and `SideLabel` build the dual-track layout.
- `InsetWindow` is a simplified app window with numbered hotspots that zoom and show a callout. It adapts to the half it sits in.
- `Chip` is a numbered step or job picker.

Primitives in `fieldwork.css` that are used as plain class names: `.steps`, `.runbar`, `.rb` / `.rb.primary`, `.chat`, `.cols3`, `.col`, `.tbl`, `.reg`, `.panel`, `.num`, `.cover-list`, `.tagnote`, `.handnote`.

## Motion

- Motion explains; it never decorates. Zoom on a hotspot, step through a run, tick a box.
- Easing `cubic-bezier(.2,.7,.2,1)`, 350–550ms. Respect `prefers-reduced-motion`.
- Timers and autoplay run only on the live page: gate them with `useIsActivePage()`.
- Default slide transition is a plain cut. No morphs, shaders, glows or particle effects.

## Never list

The never list comes from the brand brief, section 2:

- purple or blue gradients, glows, glassmorphism
- sparkle icons, robot or brain imagery, emoji as decoration
- stock photos, AI-generated people
- cards inside cards; border plus shadow plus fill on one element
- "unlock", "supercharge", "10x"

## Content rules

- Never show a real company's name unless that company is part of the training audience. Use made-up stand-ins, for example Ridgeline Surveying, Northline Supplies and Westside Electrical.
- Use real numbers and realistic work. Write in plain Australian English.
- Claude and ChatGPT/Codex get equal weight on every dual-track page.
