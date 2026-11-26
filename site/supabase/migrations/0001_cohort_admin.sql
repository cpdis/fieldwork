-- Fieldwork cohort admin: cohorts, bookings, waitlist, email log, Stripe event log.
-- The app talks to Postgres directly with the server-side connection string, so
-- every table has RLS on and no policies: the anon and authenticated roles that
-- Supabase exposes through PostgREST can read and write nothing.

create extension if not exists pgcrypto;

create table cohorts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  venue_name      text,
  venue_address   text,
  -- Free text added to the confirmation and pre-course emails (parking, food, what to bring).
  joining_notes   text,
  capacity        integer not null check (capacity > 0),
  price_cents     integer not null check (price_cents >= 0),
  currency        text not null default 'aud' check (currency ~ '^[a-z]{3}$'),
  status          text not null default 'draft'
                  check (status in ('draft', 'open', 'closed', 'cancelled')),
  pre_course_days integer not null default 5 check (pre_course_days between 0 and 60),
  follow_up_days  integer not null default 1 check (follow_up_days between 0 and 60),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table bookings (
  id                         uuid primary key default gen_random_uuid(),
  cohort_id                  uuid not null references cohorts (id) on delete restrict,
  -- pending: Checkout session open, seat held until hold_expires_at.
  -- paid: Stripe payment completed. comp: added by hand (friend, invoice, pilot).
  status                     text not null
                             check (status in ('pending', 'paid', 'comp', 'cancelled', 'refunded', 'expired')),
  source                     text not null check (source in ('stripe', 'manual')),
  name                       text,
  email                      text,
  phone                      text,
  company                    text,
  abn                        text,
  abn_valid                  boolean,
  dietary                    text,
  admin_notes                text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text unique,
  amount_total_cents         integer,
  currency                   text,
  hold_expires_at            timestamptz,
  paid_at                    timestamptz,
  cancelled_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index bookings_cohort_status_idx on bookings (cohort_id, status);

create table waitlist (
  id                   uuid primary key default gen_random_uuid(),
  cohort_id            uuid not null references cohorts (id) on delete cascade,
  name                 text not null,
  email                text not null,
  company              text,
  note                 text,
  offered_at           timestamptz,
  removed_at           timestamptz,
  created_at           timestamptz not null default now()
);

create unique index waitlist_cohort_email_idx on waitlist (cohort_id, lower(email));

create table email_log (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid references bookings (id) on delete cascade,
  waitlist_id  uuid references waitlist (id) on delete cascade,
  -- confirmation | pre_course | follow_up | seat_offer
  kind         text not null,
  to_email     text not null,
  status       text not null check (status in ('sending', 'sent', 'failed', 'logged')),
  provider_id  text,
  error        text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz,
  check ((booking_id is null) <> (waitlist_id is null))
);

-- One automatic email of each kind per booking. A failed row is retried in place.
create unique index email_log_booking_kind_idx on email_log (booking_id, kind) where booking_id is not null;
create index email_log_waitlist_idx on email_log (waitlist_id) where waitlist_id is not null;

create table stripe_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

create or replace function touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger cohorts_touch before update on cohorts for each row execute function touch_updated_at();
create trigger bookings_touch before update on bookings for each row execute function touch_updated_at();

alter table cohorts       enable row level security;
alter table bookings      enable row level security;
alter table waitlist      enable row level security;
alter table email_log     enable row level security;
alter table stripe_events enable row level security;
