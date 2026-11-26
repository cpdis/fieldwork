-- The marketing site's form. Someone can ask for a seat on a listed day (cohort_id
-- set, as before) or for "the next public day" (cohort_id null). Either way it is a
-- waitlist row, so the admin and the seat-offer email work unchanged for dated rows.

alter table waitlist alter column cohort_id drop not null;

-- Which app they already pay for: chatgpt | claude | both | neither. Free text is
-- refused by the check so the admin can count it.
alter table waitlist add column uses text check (uses in ('chatgpt', 'claude', 'both', 'neither'));
alter table waitlist add column source text not null default 'site';

-- One general-interest row per email. Dated rows keep waitlist_cohort_email_idx.
create unique index waitlist_general_email_idx on waitlist (lower(email)) where cohort_id is null;
