-- ============================================================
-- AI Recruitment Platform — Migration 0007
-- Fix existing candidates whose full_name is the email prefix
-- ============================================================
--
-- Replaces full_name = 'ana.garcia' (email prefix) with the
-- real name stored in auth.users.raw_user_meta_data->>'full_name'
-- for all candidate rows that have the email prefix as name.
-- ============================================================

-- Fix candidates linked via auth_user_id
UPDATE public.candidates c
SET    full_name = u.raw_user_meta_data->>'full_name',
       updated_at = NOW()
FROM   auth.users u
WHERE  c.auth_user_id = u.id
  AND  c.full_name = SPLIT_PART(c.email, '@', 1)
  AND  u.raw_user_meta_data->>'full_name' IS NOT NULL;

-- Fix candidates not linked to auth (no auth_user_id) but matching by email
UPDATE public.candidates c
SET    full_name = u.raw_user_meta_data->>'full_name',
       updated_at = NOW()
FROM   auth.users u
WHERE  c.auth_user_id IS NULL
  AND  u.email = c.email
  AND  c.full_name = SPLIT_PART(c.email, '@', 1)
  AND  u.raw_user_meta_data->>'full_name' IS NOT NULL;
