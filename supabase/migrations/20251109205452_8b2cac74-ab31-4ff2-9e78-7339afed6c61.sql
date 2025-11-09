-- Create training plans table
CREATE TABLE public.training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training goals table
CREATE TABLE public.training_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_metric TEXT NOT NULL, -- 'ai_score', 'posture', 'stability', 'smoothness'
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  deadline DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones table
CREATE TABLE public.training_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE SET NULL,
  milestone_type TEXT NOT NULL, -- 'personal_best', 'goal_completed', 'streak', 'improvement'
  value NUMERIC
);

-- Create AI recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.training_plans(id) ON DELETE CASCADE,
  recommendation_text TEXT NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'focus_area', 'technique', 'practice', 'milestone'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_plans
CREATE POLICY "Users can view own training plans"
  ON public.training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training plans"
  ON public.training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training plans"
  ON public.training_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training plans"
  ON public.training_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for training_goals
CREATE POLICY "Users can view own training goals"
  ON public.training_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training goals"
  ON public.training_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training goals"
  ON public.training_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training goals"
  ON public.training_goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for training_milestones
CREATE POLICY "Users can view own training milestones"
  ON public.training_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training milestones"
  ON public.training_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training milestones"
  ON public.training_milestones FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_recommendations
CREATE POLICY "Users can view own recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommendations"
  ON public.ai_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_training_plans_user_id ON public.training_plans(user_id);
CREATE INDEX idx_training_goals_plan_id ON public.training_goals(plan_id);
CREATE INDEX idx_training_goals_user_id ON public.training_goals(user_id);
CREATE INDEX idx_training_milestones_user_id ON public.training_milestones(user_id);
CREATE INDEX idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_training_plans_updated_at
  BEFORE UPDATE ON public.training_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_goals_updated_at
  BEFORE UPDATE ON public.training_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();