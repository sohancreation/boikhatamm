
-- Create profile edit logs table to track before/after changes
CREATE TABLE public.profile_edit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_edit_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own logs
CREATE POLICY "Users can insert own edit logs"
ON public.profile_edit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own logs
CREATE POLICY "Users can view own edit logs"
ON public.profile_edit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all edit logs"
ON public.profile_edit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Index for fast lookups
CREATE INDEX idx_profile_edit_logs_user_id ON public.profile_edit_logs(user_id);
CREATE INDEX idx_profile_edit_logs_created_at ON public.profile_edit_logs(created_at DESC);
