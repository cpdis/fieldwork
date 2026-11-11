# open-slide — Agent Guide

You are authoring **slides** in this repo. Every slide is arbitrary React code that you write.

## Hard rules

- Put your slide under `slides/<kebab-case-id>/`.
- The entry is `slides/<id>/index.tsx`.
- Put slide-specific images/videos/fonts under `slides/<id>/assets/`. For assets reused across decks or themes (logos, avatars), use the global `assets/` folder and import via `@assets/...`.
- Do **not** touch `package.json`, `open-slide.config.ts`, or other slides.
- Do not add dependencies. Use only `react` and standard web APIs.

## Fieldwork house rules (these override the skills' defaults)

This repo holds the Fieldwork course decks. The brand is fixed, so where `slide-authoring` or `create-slide` suggest otherwise, these rules win:

- Read `themes/fieldwork.md` before writing or editing any page.
- Import the brand from `@assets/fieldwork/brand`. Every page's root is `<Frame>`. Don't copy components into a slide, and don't edit `assets/fieldwork/` unless the user asks for a brand change.
- Size with `cqw` and the class names in `assets/fieldwork/fieldwork.css`, rather than inline pixel values. Inline styles are fine for one-off layout tweaks.
- Use the five brand fonts that `brand.tsx` loads. Never the system stack, never another font.
- Yellow (`--accent`) is a highlighter fill with ink on it, never text on paper, about 2% of a page, and never on the Claude half.
- On dual-track pages, OpenAI (ChatGPT and Codex) is always on the left and Claude always on the right, with equal weight.
- Never show a client's or an employer's name or data, or anything a business has not made public. Published third-party cases are fine when the page carries a source line that names the publisher. Demo businesses and their data are made up.
- Gate timers and autoplay with `useIsActivePage()`.
- Keep `@open-slide/core` pinned to an exact version. Don't upgrade in the four weeks before a course date.

## Which skill to use

- **Drafting a new deck** — use the `create-slide` skill. It walks through scoping questions, structure, and hand-off.
- **Applying inspector comments** (`@slide-comment` markers in a page) — use the `apply-comments` skill.
- **Creating or extracting a theme** — use the `create-theme` skill. Themes live as markdown under `themes/<id>.md` and are read by `create-slide` before authoring.
- **Resolving "this page" / "this element"** — when the user references the current slide or selection without naming it, consult the `current-slide` skill. It reads the dev server's `node_modules/.open-slide/current.json` to find which slide, page, and inspector-picked element they mean.
- **Writing a speech script / speaker notes** — use the framework's built-in feature: the `notes` export in the slide's `index.tsx`, index-aligned with the page array and shown in the presenter view. See the **Speaker notes** section of the `slide-authoring` skill. Never deliver a script as a markdown or text file.
- **Any other slide edit** — read the `slide-authoring` skill before writing. It is the technical reference for everything inside `slides/<id>/`: file contract, the 1920×1080 canvas, type scale, palette, layout, assets, self-review checklist, and anti-patterns. `create-slide` and `apply-comments` both defer to it for the *how*.

Keep this file short: hard rules only. All deeper guidance lives in the skills above.

## Updating skills

The skills above are managed by `@open-slide/core`. Do not edit them in place. To pull the latest versions:

```
pnpm up @open-slide/core
pnpm sync:skills
```

`pnpm dev` will also detect drift on startup and offer to sync. `pnpm sync:skills --dry-run` (via `pnpm exec open-slide sync:skills --dry-run`) previews changes without writing.
