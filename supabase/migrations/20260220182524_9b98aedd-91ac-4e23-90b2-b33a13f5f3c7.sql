
-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description_en TEXT,
  description_bn TEXT,
  price_bdt NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 30,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'premium')),
  features JSONB DEFAULT '[]'::jsonb,
  max_ai_queries_per_day INTEGER DEFAULT 5,
  has_career_mentoring BOOLEAN DEFAULT false,
  has_skill_learning BOOLEAN DEFAULT false,
  has_gamification BOOLEAN DEFAULT true,
  has_teacher_tools BOOLEAN DEFAULT false,
  discount_percent INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  payment_method TEXT CHECK (payment_method IN ('bkash', 'nagad', 'card', 'free')),
  payment_transaction_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  amount_bdt NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'card')),
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.payment_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed default plans
INSERT INTO public.subscription_plans (name_en, name_bn, description_en, description_bn, price_bdt, duration_days, plan_type, max_ai_queries_per_day, has_career_mentoring, has_skill_learning, has_gamification, has_teacher_tools, features) VALUES
('Free', 'ফ্রি', 'Basic access for all students', 'সকল শিক্ষার্থীদের জন্য বেসিক অ্যাক্সেস', 0, 365, 'free', 5, false, false, true, false, '["5 AI queries/day", "Basic subjects", "Community access"]'::jsonb),
('Basic', 'বেসিক', 'Enhanced learning with more features', 'আরও ফিচার সহ উন্নত শিক্ষা', 99, 30, 'basic', 25, false, true, true, false, '["25 AI queries/day", "All subjects", "Skill learning", "Study planner"]'::jsonb),
('Pro', 'প্রো', 'Complete learning experience', 'সম্পূর্ণ শিক্ষা অভিজ্ঞতা', 199, 30, 'pro', 100, true, true, true, false, '["100 AI queries/day", "Career mentoring", "Priority support", "All features"]'::jsonb),
('Premium', 'প্রিমিয়াম', 'Everything + Teacher tools', 'সবকিছু + শিক্ষক টুলস', 499, 30, 'premium', -1, true, true, true, true, '["Unlimited AI", "Teacher tools", "1-on-1 mentoring", "Certificate"]'::jsonb);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
