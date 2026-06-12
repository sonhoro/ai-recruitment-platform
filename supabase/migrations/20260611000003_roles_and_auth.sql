-- ============================================================
-- AI Recruitment Platform — Migration 0003
-- Roles and Candidate Auth
-- ============================================================
--
-- 1. Add role column to recruiters: 'recruiter' | 'interviewer'
-- 2. Add auth_user_id to candidates (FK to auth.users)
-- 3. Add updated_at trigger to scores table
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Role column on recruiters
-- ─────────────────────────────────────────────
ALTER TABLE public.recruiters
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'recruiter'
    CHECK (role IN ('recruiter', 'interviewer'));

COMMENT ON COLUMN public.recruiters.role IS
  'Platform role: recruiter (full access) or interviewer (limited to interviews).';

-- ─────────────────────────────────────────────
-- 2. Auth link on candidates
-- ─────────────────────────────────────────────
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.candidates.auth_user_id IS
  'Link to Supabase Auth. Set when a candidate creates an account.';

CREATE INDEX IF NOT EXISTS idx_candidates_auth_user_id
  ON public.candidates(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- 3. Update existing seed: set admin@example.com as recruiter
-- ─────────────────────────────────────────────
UPDATE public.recruiters SET role = 'recruiter' WHERE email = 'admin@example.com';
