-- ============================================================
-- Fix existing candidate names (run from Supabase SQL Editor)
-- ============================================================
-- Corrige los candidatos existentes cuyo full_name es el
-- prefijo del email (ej: "ana.garcia" en vez de "Ana García").
--
-- Obtiene el nombre real desde auth.users.raw_user_meta_data.
-- ============================================================

-- 1. Candidatos vinculados por auth_user_id
UPDATE public.candidates c
SET    full_name = u.raw_user_meta_data->>'full_name',
       updated_at = NOW()
FROM   auth.users u
WHERE  c.auth_user_id = u.id
  AND  c.full_name = SPLIT_PART(c.email, '@', 1)
  AND  u.raw_user_meta_data->>'full_name' IS NOT NULL;

-- 2. Candidatos sin auth_user_id, vinculados por email
UPDATE public.candidates c
SET    full_name = u.raw_user_meta_data->>'full_name',
       updated_at = NOW()
FROM   auth.users u
WHERE  c.auth_user_id IS NULL
  AND  u.email = c.email
  AND  c.full_name = SPLIT_PART(c.email, '@', 1)
  AND  u.raw_user_meta_data->>'full_name' IS NOT NULL;

-- ── Report ──
SELECT
  'Candidatos corregidos' AS operacion,
  COUNT(*) AS total
FROM   public.candidates c
JOIN   auth.users u ON (
         (c.auth_user_id = u.id OR (c.auth_user_id IS NULL AND u.email = c.email))
         AND c.full_name = u.raw_user_meta_data->>'full_name'
       )
WHERE  c.full_name IS DISTINCT FROM SPLIT_PART(c.email, '@', 1);
