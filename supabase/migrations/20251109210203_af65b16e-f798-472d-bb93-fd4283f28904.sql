-- Create plan shares table for collaborative coaching
CREATE TABLE public.plan_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit'
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, shared_with_email)
);

-- Enable RLS
ALTER TABLE public.plan_shares ENABLE ROW LEVEL SECURITY;

-- Policies for plan_shares
CREATE POLICY "Users can view shares they created or are recipients of"
  ON public.plan_shares FOR SELECT
  USING (
    auth.uid() = shared_by OR 
    auth.email() = shared_with_email
  );

CREATE POLICY "Plan owners can create shares"
  ON public.plan_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_plans
      WHERE training_plans.id = plan_shares.plan_id
      AND training_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shares they received"
  ON public.plan_shares FOR UPDATE
  USING (auth.email() = shared_with_email);

CREATE POLICY "Plan owners can delete shares"
  ON public.plan_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.training_plans
      WHERE training_plans.id = plan_shares.plan_id
      AND training_plans.user_id = auth.uid()
    )
  );

-- Update training_plans RLS to allow shared access
DROP POLICY IF EXISTS "Users can view own training plans" ON public.training_plans;
CREATE POLICY "Users can view own or shared training plans"
  ON public.training_plans FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.plan_shares
      WHERE plan_shares.plan_id = training_plans.id
      AND plan_shares.shared_with_email = auth.email()
      AND plan_shares.accepted = true
    )
  );

-- Update training_goals RLS to allow shared access
DROP POLICY IF EXISTS "Users can view own training goals" ON public.training_goals;
CREATE POLICY "Users can view own or shared training goals"
  ON public.training_goals FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.plan_shares
      WHERE plan_shares.plan_id = training_goals.plan_id
      AND plan_shares.shared_with_email = auth.email()
      AND plan_shares.accepted = true
    )
  );

DROP POLICY IF EXISTS "Users can update own training goals" ON public.training_goals;
CREATE POLICY "Users can update own or shared (with edit) training goals"
  ON public.training_goals FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.plan_shares
      WHERE plan_shares.plan_id = training_goals.plan_id
      AND plan_shares.shared_with_email = auth.email()
      AND plan_shares.permission_level = 'edit'
      AND plan_shares.accepted = true
    )
  );

-- Update training_milestones RLS to allow shared access
DROP POLICY IF EXISTS "Users can view own training milestones" ON public.training_milestones;
CREATE POLICY "Users can view own or shared training milestones"
  ON public.training_milestones FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.plan_shares
      WHERE plan_shares.plan_id = training_milestones.plan_id
      AND plan_shares.shared_with_email = auth.email()
      AND plan_shares.accepted = true
    )
  );

-- Update ai_recommendations RLS to allow shared access
DROP POLICY IF EXISTS "Users can view own recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can view own or shared recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.plan_shares
      WHERE plan_shares.plan_id = ai_recommendations.plan_id
      AND plan_shares.shared_with_email = auth.email()
      AND plan_shares.accepted = true
    )
  );

-- Create index for better performance
CREATE INDEX idx_plan_shares_plan_id ON public.plan_shares(plan_id);
CREATE INDEX idx_plan_shares_email ON public.plan_shares(shared_with_email);