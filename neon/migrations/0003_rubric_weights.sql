-- Founder-editable rubric weights. One row per (role, criterion); a role
-- with no rows uses the calibrated defaults in src/lib/rubric/{pm,spm}.ts.
-- Weights are stored as fractions of 1 and must sum to 1 per role
-- (enforced in the API route, not here — a partial set never gets written
-- because each save replaces the role's full set inside one transaction).
--
-- Idempotent, so re-running every migration in order is safe:
--   psql "$DATABASE_URL_UNPOOLED" -f neon/migrations/0003_rubric_weights.sql

create table if not exists rubric_weights (
  role_key role_key not null,
  criterion_key text not null,
  weight numeric(5, 4) not null check (weight between 0 and 1),
  updated_at timestamptz not null default now(),
  primary key (role_key, criterion_key)
);
