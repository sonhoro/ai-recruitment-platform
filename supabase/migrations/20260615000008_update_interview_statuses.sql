-- ============================================================
-- AI Recruitment Platform — Migration 0008
-- Update interview statuses: add por_programar, remove confirmed
-- ============================================================
--
-- Changes:
--   1. Drop default to allow type change
--   2. Change column to text temporarily
--   3. Convert existing 'scheduled' → 'por_programar'
--      Convert existing 'confirmed' → 'scheduled'
--   4. Create new enum type without 'confirmed'
--   5. Change column to new enum type
--   6. Set new default: 'por_programar'
--   7. Drop old type
-- ============================================================

-- Step 1: Drop the old default so the column can be recast
ALTER TABLE public.interviews
  ALTER COLUMN status DROP DEFAULT;

-- Step 2: Change column to text temporarily
ALTER TABLE public.interviews
  ALTER COLUMN status TYPE text;

-- Step 3: Migrate data
UPDATE public.interviews SET status = 'por_programar' WHERE status = 'scheduled';
UPDATE public.interviews SET status = 'scheduled' WHERE status = 'confirmed';

-- Interviews that already have a meeting URL should remain 'scheduled'
-- (they've already been configured by the recruiter)
UPDATE public.interviews SET status = 'scheduled' WHERE meeting_url IS NOT NULL AND meeting_url != '';

-- Step 4: Create new enum type without 'confirmed'
CREATE TYPE interview_status_new AS ENUM (
  'por_programar', 'scheduled', 'completed', 'cancelled', 'no_show'
);

-- Step 5: Change column to new enum
ALTER TABLE public.interviews
  ALTER COLUMN status TYPE interview_status_new
  USING status::interview_status_new;

-- Step 6: Set new default to 'por_programar'
ALTER TABLE public.interviews
  ALTER COLUMN status SET DEFAULT 'por_programar';

-- Step 7: Drop old type
DROP TYPE interview_status;

-- Step 8: Rename new type to original name
ALTER TYPE interview_status_new RENAME TO interview_status;
