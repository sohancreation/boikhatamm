
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'institution_admin', 'super_admin');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  class_level TEXT, -- '6','7','8','9','10','ssc','hsc','university'
  board TEXT, -- 'dhaka','chittagong','rajshahi','sylhet','comilla','jessore','barishal','dinajpur','mymensingh','madrasa','technical'
  goals TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  class_level TEXT NOT NULL,
  icon TEXT DEFAULT '📘',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subjects" ON public.subjects
  FOR SELECT USING (is_active = true);

-- Chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  chapter_number INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);

-- Topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  youtube_url TEXT,
  notes_content TEXT,
  sort_order INTEGER DEFAULT 0,
  requires_plan TEXT DEFAULT 'free' -- free, plus, pro
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);

-- Student progress
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  score INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.student_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.student_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.student_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  icon TEXT DEFAULT '🏆',
  description_en TEXT,
  description_bn TEXT,
  xp_required INTEGER DEFAULT 0
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can earn badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Update subscription_plans with new pricing
DELETE FROM public.subscription_plans;
INSERT INTO public.subscription_plans (name_en, name_bn, description_en, description_bn, price_bdt, duration_days, plan_type, max_ai_queries_per_day, has_career_mentoring, has_skill_learning, has_gamification, has_teacher_tools, features) VALUES
('Free', 'ফ্রি', 'Basic access for all students', 'সকল শিক্ষার্থীদের জন্য বেসিক অ্যাক্সেস', 0, 365, 'free', 5, false, false, false, false, '["Subject browsing", "5 AI explains/day", "Selected videos", "Basic quizzes"]'::jsonb),
('Plus', 'প্লাস', 'Enhanced learning experience', 'উন্নত শিক্ষা অভিজ্ঞতা', 199, 30, 'basic', 50, false, true, true, false, '["Unlimited AI Explain", "AI handwritten notes", "Syllabus upload", "Full study plan", "Chapter exams", "Gamification", "Basic skill learning"]'::jsonb),
('Pro', 'প্রো', 'Complete learning & career suite', 'সম্পূর্ণ শিক্ষা ও ক্যারিয়ার স্যুট', 399, 30, 'pro', -1, true, true, true, false, '["Everything in Plus", "Career mentoring", "Advanced skills & projects", "Certificates", "PDF downloads", "Performance analytics", "Priority AI"]'::jsonb),
('Institution', 'প্রতিষ্ঠান', 'For schools & coaching centers', 'স্কুল ও কোচিং সেন্টারের জন্য', 99, 30, 'premium', -1, true, true, true, true, '["School branding", "Teacher dashboard", "Student analytics", "Bulk accounts", "All Pro features"]'::jsonb);

-- Seed sample subjects for Class 9
INSERT INTO public.subjects (name_en, name_bn, class_level, icon, sort_order) VALUES
('Mathematics', 'গণিত', '9', '🔢', 1),
('Physics', 'পদার্থবিজ্ঞান', '9', '⚛️', 2),
('Chemistry', 'রসায়ন', '9', '🧪', 3),
('Biology', 'জীববিজ্ঞান', '9', '🧬', 4),
('English', 'ইংরেজি', '9', '📖', 5),
('Bangla', 'বাংলা', '9', '🇧🇩', 6),
('ICT', 'আইসিটি', '9', '💻', 7),
('Bangladesh & Global Studies', 'বাংলাদেশ ও বিশ্বপরিচয়', '9', '🌏', 8);

-- Seed sample chapters for Mathematics Class 9
INSERT INTO public.chapters (subject_id, name_en, name_bn, chapter_number, sort_order)
SELECT s.id, c.name_en, c.name_bn, c.ch_num, c.ch_num
FROM public.subjects s
CROSS JOIN (VALUES
  ('Sets', 'সেট', 1),
  ('Real Numbers', 'বাস্তব সংখ্যা', 2),
  ('Algebraic Expressions', 'বীজগাণিতিক রাশি', 3),
  ('Equations', 'সমীকরণ', 4),
  ('Geometry', 'জ্যামিতি', 5)
) AS c(name_en, name_bn, ch_num)
WHERE s.name_en = 'Mathematics' AND s.class_level = '9';

-- Seed sample topics for Sets chapter
INSERT INTO public.topics (chapter_id, name_en, name_bn, youtube_url, sort_order, requires_plan)
SELECT ch.id, t.name_en, t.name_bn, t.url, t.so, t.plan
FROM public.chapters ch
CROSS JOIN (VALUES
  ('Introduction to Sets', 'সেটের পরিচিতি', 'https://youtube.com/watch?v=example1', 1, 'free'),
  ('Types of Sets', 'সেটের প্রকারভেদ', 'https://youtube.com/watch?v=example2', 2, 'free'),
  ('Set Operations', 'সেট অপারেশন', 'https://youtube.com/watch?v=example3', 3, 'basic'),
  ('Venn Diagrams', 'ভেন চিত্র', 'https://youtube.com/watch?v=example4', 4, 'basic'),
  ('Problem Solving with Sets', 'সেট দিয়ে সমস্যা সমাধান', 'https://youtube.com/watch?v=example5', 5, 'pro')
) AS t(name_en, name_bn, url, so, plan)
WHERE ch.name_en = 'Sets';

-- Seed badges
INSERT INTO public.badges (name_en, name_bn, icon, description_en, description_bn, xp_required) VALUES
('First Step', 'প্রথম পদক্ষেপ', '👣', 'Complete your first topic', 'প্রথম টপিক সম্পন্ন করো', 0),
('Quick Learner', 'দ্রুত শিক্ষার্থী', '⚡', 'Earn 100 XP', '১০০ XP অর্জন করো', 100),
('Knowledge Seeker', 'জ্ঞান অন্বেষী', '🔍', 'Earn 500 XP', '৫০০ XP অর্জন করো', 500),
('Math Wizard', 'গণিত জাদুকর', '🧙', 'Complete all math chapters', 'সব গণিত অধ্যায় সম্পন্ন করো', 1000),
('Champion', 'চ্যাম্পিয়ন', '🏆', 'Earn 5000 XP', '৫০০০ XP অর্জন করো', 5000);

-- Updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user plan type
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT sp.plan_type FROM public.user_subscriptions us
     JOIN public.subscription_plans sp ON us.plan_id = sp.id
     WHERE us.user_id = _user_id AND us.status = 'active' AND us.expires_at > now()
     ORDER BY us.created_at DESC LIMIT 1),
    'free'
  )
$$;
