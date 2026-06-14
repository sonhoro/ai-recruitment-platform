-- ============================================================
-- AI Recruitment Platform — Migration 0006
-- Add ai_recommendation column for Human-in-the-loop
-- ============================================================
--
-- Context:
--   Instead of auto-advancing candidates to "interview" based on AI
--   suggestions (ADVANCE / INTERVIEW / TEST), the pipeline now keeps
--   them in "screening" and stores the AI recommendation in this column.
--   Recruiters see the badge in the dashboard and manually approve
--   the stage transition via the existing updateCandidateStage action.
--
-- Columns added:
--   ai_recommendation   TEXT   — 'advance' | 'interview' | 'test' | 'hold' | 'discard'
--
-- ============================================================

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS ai_recommendation TEXT
    CHECK (ai_recommendation IN ('advance', 'interview', 'test', 'hold', 'discard'));

COMMENT ON COLUMN public.candidates.ai_recommendation IS
  'AI suggestion for next step: advance | interview | test | hold | discard. Inspected by recruiters for Human-in-the-loop approval.';

CREATE INDEX IF NOT EXISTS idx_candidates_ai_recommendation
  ON public.candidates(ai_recommendation)
  WHERE ai_recommendation IS NOT NULL;
