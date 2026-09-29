-- Kargo Hiring Dashboard — initial schema, on Neon (Lakebase Postgres).
-- Mirrors the shapes in src/lib/repositories/types.ts exactly; if that file
-- changes, this migration (and src/lib/repositories/neon/*) must change
-- with it.
--
-- Apply with a DIRECT (unpooled) connection string, per the neon-postgres
-- skill's migration guidance:
--   psql "$DATABASE_URL_UNPOOLED" -f neon/migrations/0001_init.sql
--
-- No RLS/policies here — unlike the earlier Supabase-targeted migration,
-- there is no separate anon-vs-service-role key model on this connection.
-- The app talks to Postgres directly over DATABASE_URL from the server
-- only; nothing else ever connects to this database.

create extension if not exists "pgcrypto";

create type role_key as enum ('pm', 'spm');

create type application_status as enum (
  'NEW', 'PROCESSING', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW',
  'REJECTED', 'HIRED', 'PROCESSING_FAILED'
);

create type email_type as enum ('interview_invite', 'rejection');
create type email_draft_status as enum ('draft', 'sent');
create type email_log_status as enum ('sent', 'simulated', 'failed');
create type batch_run_status as enum ('idle', 'running', 'completed', 'failed');

create table candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  resume_file_name text not null,
  resume_file_path text not null,
  resume_mime_type text not null,
  -- Full text, pre-PII-strip. Kept for the app's own use (emailing the
  -- candidate later) — the AI is only ever sent a stripped copy of this.
  raw_text text not null,
  created_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  role_key role_key not null,
  original_role_key role_key not null,
  role_overridden boolean not null default false,
  status application_status not null default 'NEW',
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_applications_status on applications (status);
create index idx_applications_role on applications (role_key);
create index idx_applications_candidate on applications (candidate_id);

-- CandidateEvidence: one row per application, upserted on (re-)extraction.
-- Each *_signal column stores an EvidenceSignal<T> as jsonb:
--   { value, evidence, confidence, basis }
create table candidate_evidence (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  candidate_name text not null,
  candidate_current_role_title text not null,
  -- named current_role_evidence, not current_role: the latter is a
  -- reserved SQL keyword (an alias for CURRENT_ROLE) and needs quoting
  -- everywhere it's referenced — simpler to just avoid it.
  current_role_evidence jsonb not null,
  years_experience jsonb not null,
  companies jsonb not null,
  education jsonb not null,
  logistics_experience jsonb not null,
  product_experience jsonb not null,
  technical_experience jsonb not null,
  ownership_examples jsonb not null,
  decision_examples jsonb not null,
  discovery_examples jsonb not null,
  stakeholder_signals jsonb not null,
  career_transitions jsonb not null,
  measurable_outcomes jsonb not null,
  raw_evidence text not null,
  model_id text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (application_id)
);

-- CandidateScore: one row per application. `overall_score` and
-- `historical_signal` are written ONLY by lib/scoring/aggregate.ts — never
-- a SQL generated column, never trusted from the model's own output.
create table candidate_scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  overall_score numeric(3, 2) not null check (overall_score between 1 and 5),
  why_surfaced text not null,
  criteria jsonb not null,           -- CriterionResult[]
  historical_signal jsonb not null,  -- HistoricalSignalResult
  strengths jsonb not null,
  concerns jsonb not null,
  interview_questions jsonb not null,
  model_id text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (application_id)
);

create table interview_briefs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  summary text not null,
  why_shortlisted text not null,
  strengths jsonb not null,
  uncertainties jsonb not null,
  questions jsonb not null,          -- InterviewBriefQuestion[]
  follow_up_probes jsonb not null,
  model_id text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  unique (application_id)
);

create table email_drafts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  type email_type not null,
  subject text not null,
  body text not null,
  status email_draft_status not null default 'draft',
  model_id text not null,
  prompt_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_email_drafts_application on email_drafts (application_id, type, created_at desc);

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  email_draft_id uuid not null references email_drafts(id) on delete cascade,
  application_id uuid not null references applications(id) on delete cascade,
  to_address text not null,
  subject text not null,
  resend_message_id text,
  status email_log_status not null,
  error text,
  sent_at timestamptz not null default now()
);
create index idx_email_logs_application on email_logs (application_id, sent_at desc);
create index idx_email_logs_recent on email_logs (sent_at desc);

-- Every founder override (status, roleKey, or a single criterion score) is
-- recorded here — nothing is ever auto-overwritten, and this is the only
-- place that history is durable.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text not null,
  reason text,
  actor text not null,
  created_at timestamptz not null default now()
);
create index idx_audit_log_application on audit_log (application_id, created_at desc);

create table batch_runs (
  id uuid primary key default gen_random_uuid(),
  status batch_run_status not null default 'idle',
  total_count int not null default 0,
  processed_count int not null default 0,
  succeeded_count int not null default 0,
  failed_count int not null default 0,
  current_application_id uuid references applications(id),
  failures jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index idx_batch_runs_started on batch_runs (started_at desc);
