-- The deck on the site: share links, viewing sessions, time per page, and notes left on pages.

-- A private link to the read-only deck, one per person it's sent to. The token is the URL
-- (/look/<token>); revoking or expiring it stops new visits and live sessions alike.
create table deck_links (
  id              uuid primary key default gen_random_uuid(),
  token           text not null unique,
  name            text not null,
  note            text,
  allow_notes     boolean not null default true,
  expires_at      timestamptz,
  revoked_at      timestamptz,
  open_count      integer not null default 0,
  last_opened_at  timestamptz,
  created_at      timestamptz not null default now()
);

-- One tab's run through the deck. The id comes from the browser, so retries are idempotent.
-- viewer is 'admin' (Colin, signed in) or 'link' (someone on a share link). cohort_id is set when
-- an admin session starts during a cohort's day, which is how a run in the room is told apart
-- from a rehearsal. presented is true once the presenter view has driven the tab.
create table deck_sessions (
  id            uuid primary key,
  viewer        text not null check (viewer in ('admin', 'link')),
  link_id       uuid references deck_links(id) on delete cascade,
  cohort_id     uuid references cohorts(id) on delete set null,
  presented     boolean not null default false,
  label         text,
  commit_sha    text,
  page_count    smallint,
  device        text,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  check ((viewer = 'link') = (link_id is not null))
);
create index deck_sessions_started_idx on deck_sessions (started_at desc);
create index deck_sessions_link_idx on deck_sessions (link_id, started_at desc);

-- Each stop on a page, in order. A visit to a page earlier than the one before it is a "back".
-- dwell_ms counts only time the tab was visible, and grows as the browser checks in.
create table deck_views (
  session_id  uuid not null references deck_sessions(id) on delete cascade,
  seq         integer not null,
  page        smallint not null check (page > 0),
  from_page   smallint,
  entered_at  timestamptz not null,
  dwell_ms    integer not null default 0 check (dwell_ms >= 0),
  primary key (session_id, seq)
);
create index deck_views_page_idx on deck_views (page);

-- A note left on a page, by Colin while rehearsing (link_id null) or by someone on a share link.
create table deck_notes (
  id           uuid primary key default gen_random_uuid(),
  link_id      uuid references deck_links(id) on delete cascade,
  session_id   uuid references deck_sessions(id) on delete set null,
  page         smallint not null check (page > 0),
  body         text not null check (length(body) between 1 and 4000),
  commit_sha   text,
  done_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index deck_notes_open_idx on deck_notes (done_at, created_at desc);

alter table deck_links    enable row level security;
alter table deck_sessions enable row level security;
alter table deck_views    enable row level security;
alter table deck_notes    enable row level security;
