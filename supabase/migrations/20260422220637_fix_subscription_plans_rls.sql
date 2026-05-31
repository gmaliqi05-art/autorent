/*
  # Fix subscription_plans RLS policies
  Replace broken app_metadata checks with is_super_admin() function
*/

DROP POLICY IF EXISTS "Super admin inserts subscription plans" ON public.subscription_plans;

DROP POLICY IF EXISTS "Super admin updates subscription plans" ON public.subscription_plans;

DROP POLICY IF EXISTS "Super admin deletes subscription plans" ON public.subscription_plans;

CREATE POLICY "Super admin can insert subscription plans"
  ON public.subscription_plans
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update subscription plans"
  ON public.subscription_plans
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete subscription plans"
  ON public.subscription_plans
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

;
