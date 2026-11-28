-- End-of-day feedback, one row per answer sent from /feedback. cohort_id is the day the
-- link named (?day=<slug>), or the most recent day that had started when it was sent.
create table feedback (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid references cohorts(id) on delete set null,
  app         text check (app in ('ChatGPT', 'Claude', 'Both')),
  useful      smallint check (useful between 1 and 5),
  keep        text,
  change      text,
  recommend   text check (recommend in ('Yes', 'Maybe', 'No')),
  name        text,
  email       text,
  created_at  timestamptz not null default now()
);
create index feedback_cohort_idx on feedback (cohort_id, created_at);

-- Claude's read of a cohort's feedback: a summary and suggested changes to the deck
-- and the day. Kept, not overwritten, so earlier reads stay comparable.
create table feedback_summaries (
  id              uuid primary key default gen_random_uuid(),
  cohort_id       uuid not null references cohorts(id) on delete cascade,
  response_count  integer not null,
  model           text not null,
  summary         text not null,
  created_at      timestamptz not null default now()
);
create index feedback_summaries_cohort_idx on feedback_summaries (cohort_id, created_at desc);

-- Same rule as every other table: no public access; the app connects as the owner.
alter table feedback           enable row level security;
alter table feedback_summaries enable row level security;
