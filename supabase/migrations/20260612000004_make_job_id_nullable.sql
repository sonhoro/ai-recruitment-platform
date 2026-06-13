-- ============================================================
-- AI Recruitment Platform — Migration 0004
-- Make candidates.job_id nullable for registration flow
-- ============================================================
--
-- Allows creating a candidate record without a job_id so
-- newly registered users can have a profile before applying.
-- ============================================================

ALTER TABLE public.candidates
  ALTER COLUMN job_id DROP NOT NULL;
