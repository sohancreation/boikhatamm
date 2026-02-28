
-- Add gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS coins integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rank_title text DEFAULT 'Beginner Scholar';

-- XP Logs - track every XP event
CREATE TABLE public.xp_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own xp logs" ON public.xp_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp logs" ON public.xp_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_xp_logs_user_date ON public.xp_logs(user_id, created_at DESC);

-- Daily Missions
CREATE TABLE public.daily_missions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  mission_date date NOT NULL DEFAULT CURRENT_DATE,
  mission_1_type text NOT NULL DEFAULT 'complete_quiz',
  mission_1_target integer NOT NULL DEFAULT 1,
  mission_1_progress integer NOT NULL DEFAULT 0,
  mission_1_done boolean NOT NULL DEFAULT false,
  mission_2_type text NOT NULL DEFAULT 'study_minutes',
  mission_2_target integer NOT NULL DEFAULT 20,
  mission_2_progress integer NOT NULL DEFAULT 0,
  mission_2_done boolean NOT NULL DEFAULT false,
  mission_3_type text NOT NULL DEFAULT 'ask_ai',
  mission_3_target integer NOT NULL DEFAULT 1,
  mission_3_progress integer NOT NULL DEFAULT 0,
  mission_3_done boolean NOT NULL DEFAULT false,
  all_completed boolean NOT NULL DEFAULT false,
  bonus_claimed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_date)
);
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own missions" ON public.daily_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.daily_missions FOR UPDATE USING (auth.uid() = user_id);

-- Achievements definition table
CREATE TABLE public.achievements (
  id text NOT NULL PRIMARY KEY,
  name_en text NOT NULL,
  name_bn text NOT NULL,
  description_en text,
  description_bn text,
  icon text DEFAULT '🏅',
  xp_bonus integer DEFAULT 0,
  coins_bonus integer DEFAULT 0,
  category text DEFAULT 'general',
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  sort_order integer DEFAULT 0
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User achievements (earned)
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id text NOT NULL REFERENCES public.achievements(id),
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can earn achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Skill progress (per-subject skill tree)
CREATE TABLE public.skill_tree_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  skill_branch text NOT NULL,
  lessons_done integer DEFAULT 0,
  quizzes_done integer DEFAULT 0,
  mastery_level integer DEFAULT 0,
  unlocked boolean DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject, skill_branch)
);
ALTER TABLE public.skill_tree_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own skill tree" ON public.skill_tree_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill tree" ON public.skill_tree_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill tree" ON public.skill_tree_progress FOR UPDATE USING (auth.uid() = user_id);

-- Streak shields (earnable items)
CREATE TABLE public.user_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id text NOT NULL,
  quantity integer DEFAULT 1,
  acquired_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (id, name_en, name_bn, description_en, description_bn, icon, xp_bonus, coins_bonus, category, requirement_type, requirement_value, sort_order) VALUES
('streak_7', '7 Day Warrior', '৭ দিনের যোদ্ধা', 'Maintain a 7-day streak', '৭ দিন ধারাবাহিক স্ট্রিক', '🔥', 50, 20, 'streak', 'streak_days', 7, 1),
('streak_30', 'Monthly Champion', 'মাসিক চ্যাম্পিয়ন', 'Maintain a 30-day streak', '৩০ দিন ধারাবাহিক স্ট্রিক', '🏆', 200, 100, 'streak', 'streak_days', 30, 2),
('streak_100', 'Century Legend', 'শতক কিংবদন্তি', '100-day streak!', '১০০ দিনের স্ট্রিক!', '💎', 500, 300, 'streak', 'streak_days', 100, 3),
('quiz_10', 'Quiz Starter', 'কুইজ স্টার্টার', 'Complete 10 quizzes', '১০টি কুইজ সম্পন্ন', '📝', 30, 10, 'quiz', 'quizzes_completed', 10, 4),
('quiz_50', 'Quiz Master', 'কুইজ মাস্টার', 'Complete 50 quizzes', '৫০টি কুইজ সম্পন্ন', '🧠', 100, 50, 'quiz', 'quizzes_completed', 50, 5),
('quiz_100', 'Quiz Legend', 'কুইজ কিংবদন্তি', 'Complete 100 quizzes', '১০০টি কুইজ সম্পন্ন', '👑', 250, 150, 'quiz', 'quizzes_completed', 100, 6),
('correct_100', 'Century Scorer', 'শতক স্কোরার', '100 correct answers', '১০০টি সঠিক উত্তর', '🎯', 100, 50, 'accuracy', 'correct_answers', 100, 7),
('correct_500', 'Knowledge King', 'জ্ঞান রাজা', '500 correct answers', '৫০০টি সঠিক উত্তর', '🏅', 300, 200, 'accuracy', 'correct_answers', 500, 8),
('lesson_10', 'Lesson Learner', 'পাঠ শিক্ষার্থী', 'Complete 10 lessons', '১০টি পাঠ সম্পন্ন', '📚', 50, 20, 'lesson', 'lessons_completed', 10, 9),
('lesson_50', 'Lesson Master', 'পাঠ মাস্টার', 'Complete 50 lessons', '৫০টি পাঠ সম্পন্ন', '📖', 150, 80, 'lesson', 'lessons_completed', 50, 10),
('first_interview', 'Interview Ready', 'ইন্টারভিউ রেডি', 'Complete first mock interview', 'প্রথম মক ইন্টারভিউ সম্পন্ন', '🎤', 30, 15, 'interview', 'interviews_completed', 1, 11),
('interview_10', 'Interview Pro', 'ইন্টারভিউ প্রো', 'Complete 10 mock interviews', '১০টি মক ইন্টারভিউ সম্পন্ন', '💼', 100, 50, 'interview', 'interviews_completed', 10, 12),
('level_5', 'Rising Star', 'উদীয়মান তারকা', 'Reach level 5', 'লেভেল ৫ এ পৌঁছান', '⭐', 50, 30, 'level', 'level_reached', 5, 13),
('level_10', 'Rising Genius', 'উদীয়মান প্রতিভা', 'Reach level 10', 'লেভেল ১০ এ পৌঁছান', '🌟', 150, 80, 'level', 'level_reached', 10, 14),
('level_20', 'Mastermind', 'মাস্টারমাইন্ড', 'Reach level 20', 'লেভেল ২০ এ পৌঁছান', '🧩', 500, 300, 'level', 'level_reached', 20, 15),
('coins_500', 'Coin Collector', 'কয়েন সংগ্রাহক', 'Earn 500 coins', '৫০০ কয়েন অর্জন', '🪙', 50, 0, 'economy', 'coins_earned', 500, 16),
('first_daily', 'Mission Starter', 'মিশন স্টার্টার', 'Complete all daily missions', 'সব দৈনিক মিশন সম্পন্ন', '🎯', 20, 10, 'mission', 'missions_completed', 1, 17),
('daily_7', 'Mission Warrior', 'মিশন যোদ্ধা', 'Complete daily missions 7 times', '৭ বার দৈনিক মিশন সম্পন্ন', '⚔️', 100, 50, 'mission', 'missions_completed', 7, 18);
