
-- Study Plans table
CREATE TABLE public.study_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  class_level text NOT NULL,
  target_exam text NOT NULL,
  exam_date date NOT NULL,
  daily_hours numeric NOT NULL DEFAULT 2,
  weak_subjects text[] NOT NULL DEFAULT '{}',
  strong_subjects text[] NOT NULL DEFAULT '{}',
  syllabus_text text,
  plan_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study plans" ON public.study_plans FOR DELETE USING (auth.uid() = user_id);

-- Study Tasks table (daily tasks)
CREATE TABLE public.study_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  task_date date NOT NULL,
  subject text NOT NULL,
  chapter text,
  task_type text NOT NULL DEFAULT 'study',
  duration_minutes integer NOT NULL DEFAULT 30,
  description text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study tasks" ON public.study_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study tasks" ON public.study_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study tasks" ON public.study_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study tasks" ON public.study_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_study_tasks_date ON public.study_tasks(user_id, task_date);
CREATE INDEX idx_study_tasks_plan ON public.study_tasks(plan_id);

CREATE TRIGGER update_study_plans_updated_at
BEFORE UPDATE ON public.study_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
