-- ============================================================
-- AI Recruitment Platform — Migration 0008
-- Update interview statuses: add por_programar, remove confirmed
-- ============================================================
--
-- Changes:
--   1. Temporarily change column to text to freely update values
--   2. Convert existing 'scheduled' → 'por_programar'
--      (por_programar is the new default for newly created interviews)
--   3. Convert existing 'confirmed' → 'scheduled'
--      (scheduled now means the interview has been configured)
--   4. Create new enum type without 'confirmed'
--   5. Change column back to new enum type
--   6. Drop old type
-- ============================================================

-- Step 1: Change column to text temporarily
ALTER TABLE public.interviews
  ALTER COLUMN status TYPE text;

-- Step 2: Migrate data
UPDATE public.interviews SET status = 'por_programar' WHERE status = 'scheduled';
UPDATE public.interviews SET status = 'scheduled' WHERE status = 'confirmed';

-- Step 3: Create new enum type without 'confirmed'
CREATE TYPE interview_status_new AS ENUM (
  'por_programar', 'scheduled', 'completed', 'cancelled', 'no_show'
);

-- Step 4: Change column to new enum
ALTER TABLE public.interviews
  ALTER COLUMN status TYPE interview_status_new
  USING status::interview_status_new;

-- Step 5: Drop old type
DROP TYPE interview_status;

-- Step 6: Rename new type to original name
ALTER TYPE interview_status_new RENAME TO interview_status;
