ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
