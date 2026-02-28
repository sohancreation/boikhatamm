
CREATE TABLE public.project_helper_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_type TEXT NOT NULL DEFAULT '',
  project_plan TEXT,
  action TEXT NOT NULL DEFAULT '',
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_helper_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project sessions" ON public.project_helper_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own project sessions" ON public.project_helper_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own project sessions" ON public.project_helper_sessions FOR DELETE USING (auth.uid() = user_id);
