# Fieldwork site and cohort admin

The marketing page at `/`, the public booking pages, and a small admin for running cohorts. To put it on fieldworkperth.com, see `DEPLOY.md`. Stripe Checkout takes payment, a Stripe webhook records it in Supabase Postgres, and the admin shows each cohort's roster, seats left, waitlist and dietary needs. It sends the confirmation, pre-course and follow-up emails through Resend.

It does no accounting. Stripe feeds Xero for that.

This is its own Next.js app with its own `package.json`. The slide deck at the repo root is untouched, and the deck's version freeze doesn't apply here.

## The home page

`/` is the marketing page: the pitch, the both-apps demo, the day, who runs it, prices, the dates and a form, and the FAQ.

- Copy, prices, the timetable and the FAQ are in `src/lib/site-content.ts`.
- **Dates come from the admin.** Every `open` or `closed` cohort that hasn't ended is listed. An `open` cohort with a price shows **Book and pay** (Stripe Checkout). A `closed` cohort shows **Ask for a seat**, which puts the person on that cohort's waitlist. The pilot is seeded as `closed`, price 0, venue blank ("Venue to be announced"); set the venue in the admin when it's booked.
- The form also offers **The next public day**, which goes on a general list with no cohort. The admin home shows it under **Next public day list**, with a CSV download and a **Move** button that puts someone on a cohort's waitlist, from where **Email seat offer** works as before.
- With no database (a preview build) or no listed cohorts, the page shows `FALLBACK_DAYS` so it never goes blank. `SITE_PREVIEW=1` makes the form answer "preview only" without posting.
- The form posts to `/api/interest`. It works without JavaScript (a redirect back to `/#book`); with it, `public/site.js` answers in place. `site.js` also runs the typing composer, the both-apps steps and the levelling staff on the timetable. It loads after hydration and changes only attributes, so it never upsets React.

## How a booking works

1. `/book/<slug>` shows the cohort and our own checkout form (`src/app/book/[slug]/CheckoutForm.tsx`). Step one asks for name, email, company and ABN (both optional, for a tax invoice) and dietary needs. **Continue to payment** posts to `/api/checkout`, which locks the cohort row, checks seats, inserts a `pending` booking with those details that holds a seat for 35 minutes, and opens a Checkout session with `ui_mode: 'elements'` for 31 minutes (Stripe's minimum is 30).
2. Step two mounts Stripe's Payment Element in place, styled to the site's tokens through the Appearance API, and a **Pay** button showing the session's total. Card and bank details go from Stripe's fields straight to Stripe. Stripe.js is loaded from js.stripe.com, pinned to the release that matches the server library's API version (`STRIPE_JS` in the form).
3. `checkout.session.completed` marks the booking `paid`, checks the ABN checksum (a bad one is flagged, not rejected), and sends the confirmation email. Details already on the booking are kept; a hosted Checkout session or Payment Link still works and supplies them through custom fields.
4. If the buyer walks away, `checkout.session.expired` frees the seat, and the page tells them the hold ran out. A BECS bank debit keeps the seat held for up to 10 days until `async_payment_succeeded` or `async_payment_failed`.
5. A full refund in the Stripe dashboard (`charge.refunded`) marks the booking `refunded`. A partial refund is noted on the booking.

When a cohort is full, the page offers a waitlist instead. From the admin you can email a waitlisted person a seat offer once a seat frees up. First to book gets it.

Each Stripe event is recorded in `stripe_events` in the same transaction that applies it, so a redelivered event does nothing. Each automatic email is claimed in `email_log` before sending, so it goes once per booking; a failed send is retried on the next cron run.

## Admin

`/admin`, behind a single password (`ADMIN_PASSWORD`). Per cohort:

- Roster with company, ABN, dietary needs, booking status and which emails have gone.
- Seats booked, seats left, people paying right now, waitlist count.
- A caterer summary of dietary needs.
- Add someone by hand (pilot guests, invoiced company bookings). They count toward the seats.
- Cancel (frees the seat; refund separately in Stripe), reinstate, edit details, resend any email.
- Roster CSV download.

Cohort status: **draft** is hidden, **open** takes bookings, **closed** is listed with a waitlist only, **cancelled** stops all emails.

## Emails

| Email | When |
| --- | --- |
| Confirmation | When payment completes, or when you add someone by hand |
| Pre-course (what to bring) | From `pre_course_days` before the start (default 5) |
| Follow-up | From `follow_up_days` after the end (default 1), for 14 days |
| Seat offer | When you press **Email seat offer** on the waitlist |

Vercel Cron calls `/api/cron/emails` daily at 00:00 UTC, which is 8am in Perth. The text lives in `src/lib/email-templates.ts`; each cohort's **joining notes** (parking, food, entry) are added to the confirmation and pre-course emails. Without `RESEND_API_KEY` emails are printed to the log and marked "(dev)" in the admin.

## Run it locally

```
cd site
npm install
cp .env.example .env.local      # fill in, see below
npm run db:migrate              # any Postgres, or Supabase
npm run db:seed                 # one open test cohort
npm run dev                     # http://localhost:3000
```

For webhooks in dev, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, and put the `whsec_…` it prints in `STRIPE_WEBHOOK_SECRET`. Pay with card `4242 4242 4242 4242`.

`npm test` runs the booking, webhook and email tests against a real Postgres (`TEST_DATABASE_URL`, default `postgres://postgres@localhost:5432/fieldwork_test`). The tests drop and recreate that database's `public` schema, so never point it at Supabase.

## Set up for real

1. **Supabase.** Create a project in the Sydney region. Run the migration with `DATABASE_URL=<session pooler string> npm run db:migrate`, or paste `supabase/migrations/0001_cohort_admin.sql` into the SQL editor. Every table has row-level security on and no policies, so the public API keys can't read bookings; the app connects as the database owner instead.
2. **Stripe (test mode first).** Add a webhook endpoint at `https://<site>/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired` and `charge.refunded`. Turn on email receipts in Settings > Customer emails. A live `sk_live_` key is refused in production until you also set `STRIPE_ALLOW_LIVE=1`.
3. **Resend.** Verify the sending domain and set `RESEND_API_KEY`, `EMAIL_FROM` and `EMAIL_REPLY_TO`.
4. **Vercel.** New project from this repo with **Root Directory** set to `site`. Add the variables from `.env.example`. Use Supabase's transaction pooler string (port 6543) for `DATABASE_URL`. Set `CRON_SECRET` to a random string; Vercel sends it to the cron route.

When the Australian Stripe account goes live and you register for GST, the price on each cohort stays GST-inclusive; turn on Stripe Tax or switch receipts to tax invoices in Stripe itself.
