# Fieldwork site: agent guide

This folder is a Next.js app, separate from the slide deck at the repo root. The deck's house rules about `slides/` don't apply here, but the brand does:

- Colours and type follow `themes/fieldwork.md` at the repo root. Tokens are mirrored in `src/app/globals.css`; don't import the deck's `fieldwork.css`, which is sized for a 1920 canvas.
- Instrument Sans and IBM Plex Mono only. Yellow (`--accent`) is a fill with ink on it, about 2% of a page.
- Never show a real company's name in examples or seed data.
- All database access goes through `src/lib/` with the server-side `DATABASE_URL`. Never expose bookings through Supabase's public API; the tables have RLS on and no policies on purpose.
- Every admin page and server action calls `requireAdmin()`. Route handlers under `/admin` check `isAdmin()` themselves.
- Run `npm test` and `npx tsc --noEmit` before committing.
