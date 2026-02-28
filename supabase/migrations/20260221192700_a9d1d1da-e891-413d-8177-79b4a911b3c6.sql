
-- Create study abroad profiles table
CREATE TABLE public.study_abroad_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Academic
  degree TEXT DEFAULT '',
  cgpa TEXT DEFAULT '',
  major TEXT DEFAULT '',
  university_name TEXT DEFAULT '',
  graduation_year TEXT DEFAULT '',
  
  -- Test Scores
  ielts_score TEXT DEFAULT '',
  gre_score TEXT DEFAULT '',
  gmat_score TEXT DEFAULT '',
  sat_score TEXT DEFAULT '',
  
  -- Research
  has_thesis BOOLEAN DEFAULT false,
  has_publication BOOLEAN DEFAULT false,
  has_conference BOOLEAN DEFAULT false,
  research_details TEXT DEFAULT '',
  
  -- Experience
  internship_details TEXT DEFAULT '',
  job_details TEXT DEFAULT '',
  project_details TEXT DEFAULT '',
  
  -- Preferences
  funding_preference TEXT DEFAULT 'fully_funded',
  country_preferences TEXT[] DEFAULT '{}',
  target_degree TEXT DEFAULT '',
  target_major TEXT DEFAULT '',
  
  -- AI Analysis Results
  analysis_result JSONB DEFAULT '{}'::jsonb,
  country_recommendations JSONB DEFAULT '[]'::jsonb,
  university_recommendations JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.study_abroad_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study abroad profiles"
  ON public.study_abroad_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study abroad profiles"
  ON public.study_abroad_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study abroad profiles"
  ON public.study_abroad_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study abroad profiles"
  ON public.study_abroad_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_study_abroad_profiles_updated_at
  BEFORE UPDATE ON public.study_abroad_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
