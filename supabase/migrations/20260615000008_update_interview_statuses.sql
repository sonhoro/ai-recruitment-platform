-- ============================================================
-- AI Recruitment Platform — Migration 0008
-- Update interview statuses: add por_programar, remove confirmed
-- ============================================================
--
-- Changes:
--   1. Add 'por_programar' to the interview_status enum
--   2. Convert existing 'scheduled' → 'por_programar'
--      (por_programar is the new default for newly created interviews)
--   3. Convert existing 'confirmed' → 'scheduled'
--      (scheduled now means the interview has been configured)
--   4. Remove 'confirmed' from the enum via type swap
-- ============================================================

-- Step 1: Add 'por_programar' to the existing enum
ALTER TYPE interview_status ADD VALUE IF NOT EXISTS 'por_programar' BEFORE 'scheduled';

-- Step 2: Migrate data — scheduled becomes por_programar
UPDATE public.interviews
SET    status = 'por_programar'
WHERE  status = 'scheduled';

-- Step 3: Migrate data — confirmed becomes scheduled
UPDATE public.interviews
SET    status = 'scheduled'
WHERE  status = 'confirmed';

-- Step 4: Create new enum type without 'confirmed', then swap
CREATE TYPE interview_status_new AS ENUM (
  'por_programar', 'scheduled', 'completed', 'cancelled', 'no_show'
);

ALTER TABLE public.interviews
  ALTER COLUMN status TYPE interview_status_new
  USING status::text::interview_status_new;

DROP TYPE interview_status;

ALTER TYPE interview_status_new RENAME TO interview_status;
