-- Fix existing interviews that have meet links but are stuck as 'por_programar'
-- Run this in Supabase SQL Editor right now
UPDATE public.interviews
SET    status = 'scheduled'
WHERE  meeting_url IS NOT NULL AND meeting_url != ''
  AND  status = 'por_programar';
