# Putting the site on fieldworkperth.com

The domain is registered with Cloudflare. The app runs on Vercel (it needs a Node server for bookings, the admin and the daily email cron), and Cloudflare stays the DNS host. This is the usual pairing and costs nothing extra on Vercel's Hobby plan while the site is small. Move to Vercel Pro (US$20 a month) before taking real payments, since Hobby is for non-commercial use.

Work through `README.md` > "Set up for real" first (Supabase, Stripe test mode, Resend). Then:

## 1. Vercel

1. vercel.com > Add New > Project > import `cpdis/fieldwork`.
2. **Root Directory:** `site`. Framework: Next.js (detected).
3. Environment variables: everything in `.env.example`, with
   - `SITE_URL=https://fieldworkperth.com`
   - `CONTACT_EMAIL=hello@fieldworkperth.com` (shown in the footer; leave blank to hide)
   - `DATABASE_URL` = Supabase's **transaction pooler** string (port 6543).
4. Deploy. Check the `*.vercel.app` address works before touching DNS.
5. Run the migrations against Supabase once: `cd site && DATABASE_URL=<session pooler string> npm run db:migrate && npm run db:seed` (the seed lists the 2 December pilot with the venue blank).
6. Project > Settings > Domains > add `fieldworkperth.com`, then add `www.fieldworkperth.com` and set it to **redirect to** `fieldworkperth.com` (308).

Vercel then shows the DNS records it wants. Use the values it shows; at the time of writing they are an A record for the apex and a CNAME for `www`.

## 2. Cloudflare DNS

Cloudflare dashboard > fieldworkperth.com > DNS > Records.

1. Delete any parking records Cloudflare added for the apex (`@`) and `www` (A, AAAA or CNAME).
2. Add:

| Type | Name | Content | Proxy status | TTL |
| --- | --- | --- | --- | --- |
| A | `@` | `76.76.21.21` (or the IP Vercel shows) | **DNS only** (grey cloud) | Auto |
| CNAME | `www` | `cname.vercel-dns.com` (or the project-specific target Vercel shows) | **DNS only** (grey cloud) | Auto |

3. Back in Vercel > Domains, wait for both to show **Valid Configuration**. Vercel issues the certificate itself, usually within minutes.

Why DNS only: Vercel already runs a CDN and issues the certificate. With Cloudflare's orange-cloud proxy in front, certificate renewals and Vercel's bot protection can misfire, and you gain nothing. If you ever do switch the proxy on, set Cloudflare > SSL/TLS to **Full (strict)**, never Flexible, or the site loops on redirects.

If the zone has CAA records, add `0 issue "letsencrypt.org"` so Vercel can get its certificate. A new zone has none, which is fine.

## 3. Email on the domain

- **Receiving** `hello@fieldworkperth.com`: Cloudflare > Email > Email Routing > enable, then add a rule forwarding `hello@` to your own inbox. Cloudflare adds its MX and SPF records for you. Free.
- **Sending** (confirmations, reminders): Resend > Domains > add `fieldworkperth.com` (Resend suggests the `send` subdomain for its MX and SPF). Copy each record it lists into Cloudflare DNS, all **DNS only**. When Resend says Verified, set `EMAIL_FROM="Fieldwork <hello@fieldworkperth.com>"` and `EMAIL_REPLY_TO=hello@fieldworkperth.com` in Vercel and redeploy.
- Cloudflare Email Routing and Resend can both use SPF on the domain. If both want a TXT record at the same name, merge them into one `v=spf1 ... ~all` record rather than adding two.

## 4. Stripe

Point the webhook at `https://fieldworkperth.com/api/stripe/webhook` (README step 2) once the domain shows Valid Configuration. Do a test-mode booking end to end on the real domain before switching keys to live.

## 5. Check it

- `https://fieldworkperth.com` loads, `https://www.fieldworkperth.com` redirects to it, both with a padlock.
- The form on the home page puts you on the list: it shows up under **Next public day list** at `/admin`, or on the pilot's waitlist.
- `/admin` asks for the password.

## Hosting elsewhere

The marketing page is plain server-rendered HTML with one small script (`public/site.js`), so it runs on any host that runs Next.js: Vercel, Netlify, a Node server, or Cloudflare Workers through the OpenNext adapter. Vercel is the recommendation because the booking side already uses its cron and has been built for it. On another host, replace the cron in `vercel.json` with that host's scheduler calling `GET /api/cron/emails` with `Authorization: Bearer $CRON_SECRET`.
