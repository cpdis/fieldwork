# Fieldwork site and cohort admin

The public booking pages and a small admin for running cohorts. Stripe Checkout takes payment, a Stripe webhook records it in Supabase Postgres, and the admin shows each cohort's roster, seats left, waitlist and dietary needs. It sends the confirmation, pre-course and follow-up emails through Resend.

It does no accounting. Stripe feeds Xero for that.

This is its own Next.js app with its own `package.json`. The slide deck at the repo root is untouched, and the deck's version freeze doesn't apply here.

## How a booking works

1. `/book/<slug>` shows the cohort. **Continue to payment** locks the cohort row, checks seats, and inserts a `pending` booking that holds a seat for 35 minutes.
2. A Checkout session opens for 31 minutes (Stripe's minimum is 30) with three custom fields: company name, ABN (11 digits, optional) and dietary needs.
3. `checkout.session.completed` marks the booking `paid`, copies the buyer's details and custom fields, checks the ABN checksum (a bad one is flagged, not rejected), and sends the confirmation email.
4. If the buyer walks away, `checkout.session.expired` frees the seat. A BECS bank debit keeps the seat held for up to 10 days until `async_payment_succeeded` or `async_payment_failed`.
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
