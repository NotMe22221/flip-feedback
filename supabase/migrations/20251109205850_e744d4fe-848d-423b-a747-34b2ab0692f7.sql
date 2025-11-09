-- Add missing INSERT policy for ai_recommendations
CREATE POLICY "Users can create own recommendations"
  ON public.ai_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);