
-- 1. Doubt Solver chat sessions
CREATE TABLE public.doubt_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.doubt_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own doubt sessions" ON public.doubt_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own doubt sessions" ON public.doubt_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own doubt sessions" ON public.doubt_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own doubt sessions" ON public.doubt_sessions FOR DELETE USING (auth.uid() = user_id);

-- 2. Quiz results
CREATE TABLE public.quiz_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  chapter text,
  topic text,
  difficulty text NOT NULL DEFAULT 'medium',
  question_count integer NOT NULL DEFAULT 10,
  score integer NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz results" ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Career mentoring results
CREATE TABLE public.career_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  results_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.career_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own career results" ON public.career_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own career results" ON public.career_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. AI Summaries
CREATE TABLE public.ai_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_content text NOT NULL,
  output_format text NOT NULL,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own summaries" ON public.ai_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON public.ai_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own summaries" ON public.ai_summaries FOR DELETE USING (auth.uid() = user_id);

-- 5. Saved Resumes
CREATE TABLE public.saved_resumes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'My Resume',
  resume_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own resumes" ON public.saved_resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON public.saved_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.saved_resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.saved_resumes FOR DELETE USING (auth.uid() = user_id);

-- 6. Saved Slides/Presentations
CREATE TABLE public.saved_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'My Presentation',
  slides_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  style text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own slides" ON public.saved_slides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own slides" ON public.saved_slides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slides" ON public.saved_slides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own slides" ON public.saved_slides FOR DELETE USING (auth.uid() = user_id);

-- 7. Scholarship searches
CREATE TABLE public.scholarship_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  search_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  results_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scholarship_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scholarship searches" ON public.scholarship_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scholarship searches" ON public.scholarship_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scholarship searches" ON public.scholarship_searches FOR DELETE USING (auth.uid() = user_id);

-- 8. Mock Interview results
CREATE TABLE public.mock_interview_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  overall_score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mock_interview_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own interview results" ON public.mock_interview_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview results" ON public.mock_interview_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. IELTS results
CREATE TABLE public.ielts_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  module text NOT NULL,
  level text,
  band_score numeric,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  evaluation jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ielts_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ielts results" ON public.ielts_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ielts results" ON public.ielts_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_doubt_sessions_updated_at BEFORE UPDATE ON public.doubt_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saved_resumes_updated_at BEFORE UPDATE ON public.saved_resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saved_slides_updated_at BEFORE UPDATE ON public.saved_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
