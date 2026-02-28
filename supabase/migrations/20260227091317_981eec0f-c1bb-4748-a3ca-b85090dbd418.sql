
-- Add coin economy tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_coins_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_coins_reset_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS daily_coins_earned integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_coins_reset_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS coins_last_earned_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_quiz_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_ai_question_at timestamp with time zone;
