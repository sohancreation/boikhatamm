
-- Table to cache generated courses per class/subject
CREATE TABLE public.generated_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_level text NOT NULL,
  subject_name text NOT NULL,
  board text DEFAULT 'General',
  language text DEFAULT 'en',
  chapters jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(class_level, subject_name, board, language)
);

ALTER TABLE public.generated_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view generated courses"
ON public.generated_courses FOR SELECT USING (true);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  text_en text NOT NULL DEFAULT '',
  text_bn text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on generated_courses
CREATE TRIGGER update_generated_courses_updated_at
BEFORE UPDATE ON public.generated_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
