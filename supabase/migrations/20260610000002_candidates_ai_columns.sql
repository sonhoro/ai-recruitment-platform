-- ============================================================
-- AI Recruitment Platform — Migration 0002
-- Add AI-enriched columns to candidates table
-- ============================================================
--
-- Context:
--   When n8n finishes analyzing a CV with Claude/GPT, it calls back
--   POST /api/webhook-ats-result with the LLM output.
--   These two columns store the AI-derived metadata directly on the
--   candidate row for fast dashboard reads without a JOIN to `scores`.
--
-- Columns added:
--   ai_summary   TEXT        — 3-5 sentence professional summary from the LLM
--   seniority    TEXT        — 'Junior' | 'Semi-Senior' | 'Senior' (AI-detected)
--
-- The definitive score and full observability data live in the `scores` table.
-- These columns are intentionally denormalized for query performance.
-- ============================================================

-- ─────────────────────────────────────────────
-- Add AI-enriched columns to candidates
-- ─────────────────────────────────────────────

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,       -- LLM-generated professional summary
  ADD COLUMN IF NOT EXISTS seniority  TEXT        -- AI-detected seniority level
    CHECK (seniority IN ('Junior', 'Semi-Senior', 'Senior'));

COMMENT ON COLUMN public.candidates.ai_summary IS
  'AI-generated professional summary (3-5 sentences). Written by LLM during CV analysis. Null until first AI evaluation.';

COMMENT ON COLUMN public.candidates.seniority IS
  'AI-detected seniority level: Junior (0-2y) | Semi-Senior (3-5y) | Senior (6y+). Null until first AI evaluation.';

-- ─────────────────────────────────────────────
-- Index for dashboard filtering by seniority
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_candidates_seniority
  ON public.candidates(seniority)
  WHERE seniority IS NOT NULL;

-- ─────────────────────────────────────────────
-- END OF MIGRATION 0002
-- ─────────────────────────────────────────────
