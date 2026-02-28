
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_ielts_candidate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ielts_target_band text DEFAULT NULL;
