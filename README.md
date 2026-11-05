# Fieldwork decks

Course slides for Fieldwork, built with [open-slide](https://open-slide.dev) 2.3.1 (pinned).

## Run it

```
npm install
npm run dev        # editor at http://localhost:5173
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
```

Node 20.19+ or 22.12+. In the editor, press `f` to present full screen, or `p` to open the presenter view (notes, next slide, timer) linked to the audience window. Open the presenter view from the editor, not from inside full-screen mode.

## What's here

- `assets/fieldwork/brand.tsx` and `fieldwork.css` hold the shared brand: tokens, fonts and components. Every deck imports them from `@assets/fieldwork/brand`.
- `themes/fieldwork.md` holds the brand rules for agents. `themes/fieldwork.demo.tsx` is its preview in the Themes panel.
- `AGENTS.md` holds the house rules. They override open-slide's default authoring guidance where the two differ.
- `slides/fieldwork-prototype/` is the four-page interactive prototype, ported from `course/design/prototype-slides` on 31 Oct 2026:
  - the cover
  - the map of the apps (zoom)
  - watch it work (step-through with play)
  - a ticked box is not a verified edit (hands-on)

## The site

`site/` is the public booking site and cohort admin, a separate Next.js app with its own `package.json`. See `site/README.md`.

## Notes

- `CLAUDE.md` is a symlink to `AGENTS.md`, and `.claude/skills/` links to `.agents/skills/`, so Claude Code and Codex read the same rules. On Windows, clone with `git config core.symlinks true`.
- App windows on the slides are simplified stand-ins. Check them against the current Claude and ChatGPT desktop apps before each course. As of Oct 2026, Codex is a mode inside the ChatGPT desktop app, and Anthropic is folding Cowork into the main Claude app.
