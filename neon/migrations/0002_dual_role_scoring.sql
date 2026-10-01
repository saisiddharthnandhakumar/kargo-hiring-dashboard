-- Adds dual-rubric scoring (an application can hold a score per rubric it's
-- been evaluated against: its primary role, plus an optional secondary
-- cross-role score) and a calibration-set flag so the 8 seeded past-hire
-- records can be excluded from the live dashboard.
--
-- Apply with a DIRECT (unpooled) connection string:
--   psql "$DATABASE_URL_UNPOOLED" -f neon/migrations/0002_dual_role_scoring.sql
--
-- IMPORTANT: before running the `drop constraint` statement below, confirm
-- the actual constraint name created by `unique (application_id)` in
-- 0001_init.sql via:
--   \d candidate_scores
-- and adjust the name if it differs from the guess used here.

alter table applications add column is_calibration boolean not null default false;

alter table candidate_scores add column role_key role_key;
alter table candidate_scores add column is_primary boolean not null default true;

-- Backfill: every existing score row belongs to its application's current role.
update candidate_scores cs
set role_key = a.role_key
from applications a
where a.id = cs.application_id;

alter table candidate_scores alter column role_key set not null;

-- Replace the old 1:1-per-application constraint with the new composite one.
alter table candidate_scores drop constraint candidate_scores_application_id_key;
alter table candidate_scores add constraint candidate_scores_app_role_key unique (application_id, role_key);
