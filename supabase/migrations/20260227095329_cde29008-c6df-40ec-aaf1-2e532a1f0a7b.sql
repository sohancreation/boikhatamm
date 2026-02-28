
-- Update Plus → Starter (basic plan)
UPDATE public.subscription_plans
SET 
  name_en = 'Starter',
  name_bn = 'স্টার্টার',
  description_en = 'For school & HSC students — get into the ecosystem',
  description_bn = 'স্কুল ও HSC শিক্ষার্থীদের জন্য — ইকোসিস্টেমে প্রবেশ করুন',
  max_ai_queries_per_day = 40,
  features = '["AI Doubt Solving — 40 questions/day", "Quiz Access — 5 quizzes/day", "Basic Study Planner", "XP + Level + Streak system", "Basic analytics", "Mock Interview — 2/month", "IELTS Reading practice", "Daily missions", "Basic badges", "1x XP multiplier"]'::jsonb
WHERE id = '297c56a2-0d5c-49b5-8a63-5dfffa7f239b';

-- Update Pro plan
UPDATE public.subscription_plans
SET 
  name_en = 'Pro',
  name_bn = 'প্রো',
  description_en = 'Best value — serious learners choose this',
  description_bn = 'সেরা মূল্য — সিরিয়াস শিক্ষার্থীদের পছন্দ',
  max_ai_queries_per_day = 120,
  features = '["Everything in Starter +", "AI Doubt Solving — 120 questions/day", "Unlimited Quizzes", "Adaptive difficulty quiz", "Full IELTS (Reading + Writing + Speaking)", "Mock Interview — 8/month", "AI Study Notes Generator", "Weakness detection system", "Weekly progress comparison", "Streak Shield — 2/month", "2x XP Boost on weekends", "Skill tree unlock", "Premium gold badges", "1.5x XP multiplier"]'::jsonb
WHERE id = '948c0f3f-f082-4c8a-9c35-820b36aeb2dd';

-- Update Institution → Elite (premium plan)
UPDATE public.subscription_plans
SET 
  name_en = 'Elite',
  name_bn = 'এলিট',
  description_en = 'For serious students, university & job prep',
  description_bn = 'সিরিয়াস শিক্ষার্থী, বিশ্ববিদ্যালয় ও চাকরি প্রস্তুতির জন্য',
  max_ai_queries_per_day = -1,
  features = '["Everything in Pro +", "Unlimited AI questions", "Deep AI explanation mode", "Mock Interview — Unlimited", "Resume Review AI", "Research assistant access", "Project help unlimited", "Advanced analytics dashboard", "Performance prediction score", "Personalized study roadmap", "Priority AI response", "Early feature access", "Elite Scholar 👑 rank badge", "Animated purple glow badge", "2x XP multiplier"]'::jsonb
WHERE id = 'e628bd79-9a27-49bc-a5af-1bc8c7c8f123';

-- Update Free plan features
UPDATE public.subscription_plans
SET
  features = '["Subject browsing", "5 AI questions/day", "Selected videos", "Basic quizzes", "Community access"]'::jsonb
WHERE id = '400a9e7c-3683-4007-926d-e073d44a8109';
