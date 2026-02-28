
-- Create a trial plan
INSERT INTO subscription_plans (
  plan_type, name_en, name_bn, description_en, description_bn,
  price_bdt, duration_days, is_active,
  max_ai_queries_per_day, has_gamification, has_skill_learning, has_career_mentoring, has_teacher_tools
) VALUES (
  'pro', 'Free Trial', 'ফ্রি ট্রায়াল', '3-day free trial with full Pro access', '৩ দিনের ফ্রি ট্রায়াল',
  0, 3, true,
  50, true, true, true, false
);

-- Update handle_new_user to auto-create a 3-day trial subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  trial_plan_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  -- Auto-assign 3-day free trial
  SELECT id INTO trial_plan_id FROM public.subscription_plans
  WHERE name_en = 'Free Trial' AND is_active = true LIMIT 1;

  IF trial_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, started_at, expires_at, status, payment_method)
    VALUES (NEW.id, trial_plan_id, now(), now() + interval '3 days', 'active', 'trial');
  END IF;

  RETURN NEW;
END;
$$;
