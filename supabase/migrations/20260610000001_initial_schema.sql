-- ============================================================
-- AI Recruitment Platform — Initial Schema Migration
-- Supabase / PostgreSQL
-- RLS: DISABLED (development mode)
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'draft', 'open', 'paused', 'closed', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE candidate_status AS ENUM (
    'new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_type AS ENUM (
    'phone_screen', 'technical', 'behavioral', 'panel', 'final', 'offer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE interview_status AS ENUM (
    'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE score_stage AS ENUM (
    'resume_screening', 'skills_match', 'culture_fit', 'technical_assessment', 'overall'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────
-- TABLE: recruiters
-- ─────────────────────────────────────────────
-- Links to Supabase Auth (auth.users) via id.
-- A recruiter can belong to a company/organization.

CREATE TABLE IF NOT EXISTS public.recruiters (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID        UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,
  company_name    TEXT,
  department      TEXT,
  avatar_url      TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.recruiters IS
  'Platform users with recruiter role. Linked to Supabase Auth.';

-- ─────────────────────────────────────────────
-- TABLE: jobs  (vacantes)
-- ─────────────────────────────────────────────
-- Each job posting belongs to one recruiter.

CREATE TABLE IF NOT EXISTS public.jobs (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id        UUID        NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  title               TEXT        NOT NULL,
  description         TEXT,
  requirements        TEXT,                          -- raw JD text used for AI prompts
  location            TEXT,
  remote_policy       TEXT,                          -- 'remote' | 'hybrid' | 'onsite'
  salary_min          NUMERIC(12, 2),
  salary_max          NUMERIC(12, 2),
  currency            CHAR(3)     DEFAULT 'USD',
  status              job_status  NOT NULL DEFAULT 'draft',
  department          TEXT,
  employment_type     TEXT,                          -- 'full_time' | 'part_time' | 'contract'
  skills_required     TEXT[],                        -- array of skill tags
  published_at        TIMESTAMPTZ,
  closes_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.jobs IS
  'Job postings (vacantes) created by recruiters.';

-- ─────────────────────────────────────────────
-- TABLE: candidates
-- ─────────────────────────────────────────────
-- A candidate applies to a specific job.
-- Multiple applications from the same person → multiple rows.

CREATE TABLE IF NOT EXISTS public.candidates (
  id                  UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id              UUID              NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  -- Personal info
  full_name           TEXT              NOT NULL,
  email               TEXT              NOT NULL,
  phone               TEXT,
  location            TEXT,
  linkedin_url        TEXT,
  portfolio_url       TEXT,
  -- CV / resume
  resume_url          TEXT,             -- Storage bucket path
  resume_text         TEXT,             -- Extracted plain-text for AI processing
  -- Application tracking
  status              candidate_status  NOT NULL DEFAULT 'new',
  source              TEXT,             -- 'linkedin' | 'referral' | 'careers_page' | etc.
  applied_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  notes               TEXT,             -- internal recruiter notes
  -- Metadata
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  -- Prevent exact duplicate applications (same email + same job)
  CONSTRAINT uq_candidate_job UNIQUE (email, job_id)
);

COMMENT ON TABLE public.candidates IS
  'Candidate applications. One row per (candidate, job) pair.';

-- ─────────────────────────────────────────────
-- TABLE: scores  (evaluaciones de IA)
-- ─────────────────────────────────────────────
-- Stores AI evaluation output WITH full observability columns.

CREATE TABLE IF NOT EXISTS public.scores (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id        UUID          NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id              UUID          NOT NULL REFERENCES public.jobs(id)        ON DELETE CASCADE,

  -- ── Evaluation result ──────────────────────────
  stage               score_stage   NOT NULL DEFAULT 'overall',
  score               NUMERIC(5, 2) NOT NULL             -- 0.00 – 100.00
                        CHECK (score BETWEEN 0 AND 100),
  recommendation      TEXT,                              -- 'advance' | 'reject' | 'hold'
  reasoning           TEXT,                              -- AI-generated explanation
  strengths           TEXT[],
  weaknesses          TEXT[],

  -- ── Observability / LLM Telemetry ─────────────
  model_version       TEXT          NOT NULL,            -- e.g. 'gpt-4o-2024-08-06'
  prompt_tokens       INTEGER       NOT NULL DEFAULT 0,
  completion_tokens   INTEGER       NOT NULL DEFAULT 0,
  total_tokens        INTEGER       GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  latency_ms          INTEGER       NOT NULL DEFAULT 0,  -- end-to-end call duration
  json_result         JSONB,                             -- raw LLM response payload
  prompt_template_id  TEXT,                              -- version/name of prompt used
  error_message       TEXT,                              -- non-null if evaluation failed

  -- ── Timestamps ────────────────────────────────
  evaluated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.scores IS
  'AI evaluation scores per candidate+job. Includes full LLM observability: tokens, latency, model version, and raw JSON result.';

-- ─────────────────────────────────────────────
-- TABLE: interviews
-- ─────────────────────────────────────────────
-- Interviews are linked to a candidate (and therefore implicitly to a job).

CREATE TABLE IF NOT EXISTS public.interviews (
  id                  UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id        UUID              NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_id              UUID              NOT NULL REFERENCES public.jobs(id)        ON DELETE CASCADE,
  recruiter_id        UUID              NOT NULL REFERENCES public.recruiters(id)  ON DELETE RESTRICT,

  -- Scheduling
  interview_type      interview_type    NOT NULL DEFAULT 'phone_screen',
  status              interview_status  NOT NULL DEFAULT 'scheduled',
  scheduled_at        TIMESTAMPTZ       NOT NULL,
  duration_minutes    INTEGER           NOT NULL DEFAULT 60,
  timezone            TEXT              NOT NULL DEFAULT 'UTC',

  -- Meeting details
  meeting_url         TEXT,
  meeting_platform    TEXT,             -- 'google_meet' | 'zoom' | 'teams' | 'in_person'
  location_address    TEXT,             -- for in-person interviews

  -- Interviewers (panel support)
  interviewer_ids     UUID[],           -- additional recruiter/user ids on the panel

  -- Post-interview
  feedback            TEXT,
  rating              SMALLINT          CHECK (rating BETWEEN 1 AND 5),
  outcome             TEXT,             -- 'pass' | 'fail' | 'pending'
  feedback_submitted_at TIMESTAMPTZ,

  -- Metadata
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.interviews IS
  'Scheduled interviews between recruiters and candidates for a specific job.';

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

-- recruiters
CREATE INDEX IF NOT EXISTS idx_recruiters_email        ON public.recruiters(email);
CREATE INDEX IF NOT EXISTS idx_recruiters_auth_user_id ON public.recruiters(auth_user_id);

-- jobs
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status       ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_published_at ON public.jobs(published_at DESC);

-- candidates
CREATE INDEX IF NOT EXISTS idx_candidates_job_id  ON public.candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email   ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status  ON public.candidates(status);

-- scores
CREATE INDEX IF NOT EXISTS idx_scores_candidate_id    ON public.scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scores_job_id          ON public.scores(job_id);
CREATE INDEX IF NOT EXISTS idx_scores_stage           ON public.scores(stage);
CREATE INDEX IF NOT EXISTS idx_scores_model_version   ON public.scores(model_version);
CREATE INDEX IF NOT EXISTS idx_scores_evaluated_at    ON public.scores(evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_json_result     ON public.scores USING GIN (json_result);

-- interviews
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter_id ON public.interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id       ON public.interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);

-- ─────────────────────────────────────────────
-- AUTO-UPDATE updated_at via TRIGGER
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop triggers first to avoid duplicate trigger errors, then recreate
DO $$ BEGIN
  DROP TRIGGER IF EXISTS trg_recruiters_updated_at ON public.recruiters;
  DROP TRIGGER IF EXISTS trg_jobs_updated_at ON public.jobs;
  DROP TRIGGER IF EXISTS trg_candidates_updated_at ON public.candidates;
  DROP TRIGGER IF EXISTS trg_interviews_updated_at ON public.interviews;
END $$;

CREATE TRIGGER trg_recruiters_updated_at
  BEFORE UPDATE ON public.recruiters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY — DISABLED FOR DEVELOPMENT
-- ─────────────────────────────────────────────
-- Re-enable and define policies before going to production.

ALTER TABLE public.recruiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- GRANTS — Allow anon key (client-side) to read/write
-- ─────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ─────────────────────────────────────────────
-- END OF MIGRATION
-- ─────────────────────────────────────────────
