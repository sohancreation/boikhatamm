
-- Add job candidate fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_job_candidate boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_sector text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS job_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS job_role text DEFAULT NULL;
