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

## The full-day deck

`slides/fieldwork-day/` is the whole course day, 9:00 to 16:00: the opening, eight blocks, two breaks and lunch, about 80 pages.

- `course.ts` holds the settings for one run: cohort, date, venue, instructor, contact and Wi-Fi (shown only when set), and the timetable. The break and lunch pages count down to the times in it, and the block openers and day bar read it too.
- `blocks/b0-opening.tsx` to `blocks/b8-trust.tsx` hold one block each. Each exports `[page, speaker note]` pairs, so notes can't drift out of line with pages. Notes show in the presenter view (`p`).
- `kit.tsx` and `kit.css` are the deck's own pieces: the levelling staff, block openers, the day bar, live-demo pages, labs with a room timer, break pages and source lines.
- `deck.css` styles the pages. `mocks.css` holds the deliberately off-brand examples (other people's documents and sites).
- Instructor photo: drop `instructor.jpg` (or `.png` / `.webp`) into `slides/fieldwork-day/assets/`. Without it, the intro page shows a monogram.
- Real screenshots and clips: `shots.ts` lists each one (id, source, what to capture, where it's used). Save the file as `slides/fieldwork-day/assets/shots/<id>.<ext>` and the page picks it up; until then the page shows a labelled gap. Clips play muted, only on the current page. `node scripts/shot-list.mjs fieldwork-day` shows what's still missing (`--md` prints a capture list).

- `stage/` holds the staged demos: fake app windows animated with the [Stageshow](https://benji.org/stageshow) kit (a scripted cursor, a camera that zooms in, rows that arrive in place). `stage/vendor/` is Stageshow copied unmodified (MIT, see `SOURCE.md`). Import single kit files, never `kit/index.ts`, which pulls in an icon package the deck doesn't have and brand marks that aren't MIT. `stage/beats.tsx` lets the clicker step a staged demo one beat at a time; each demo still shows its finished state in thumbnails and the presenter preview.

Conventions on the day:

- **LIVE IN THE APP** pages (black) are cue cards for switching to the ChatGPT and Claude desktop apps. Each one names the page that runs the same demo inside the deck, if the Wi-Fi or an app misbehaves.
- **Lab** pages have a room timer (Start, +5 min, Reset). It keeps running if you move to another page and back.
- Interactive pages (buttons, sliders, checkboxes) don't advance the slide when clicked. Use the arrow keys or the space bar to move on.
- Check menu names and plan details against the live apps before each cohort. The pages that need it say "check names each cohort".

Brand check: `node scripts/brand-check.mjs fieldwork-day`. It exits non-zero on a problem, so it can run in CI.

## Notes

- `CLAUDE.md` is a symlink to `AGENTS.md`, and `.claude/skills/` links to `.agents/skills/`, so Claude Code and Codex read the same rules. On Windows, clone with `git config core.symlinks true`.
- App windows on the slides are simplified stand-ins. Check them against the current Claude and ChatGPT desktop apps before each course. As of Oct 2026, Codex is a mode inside the ChatGPT desktop app, and Anthropic is folding Cowork into the main Claude app.
