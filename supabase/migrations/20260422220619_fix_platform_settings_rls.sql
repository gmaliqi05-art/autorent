/*
  # Fix platform_settings RLS policies

  1. Changes
    - Replace broken app_metadata-based INSERT/UPDATE policies with is_super_admin() function
*/

DROP POLICY IF EXISTS "Super admin inserts settings" ON public.platform_settings;

DROP POLICY IF EXISTS "Super admin updates settings" ON public.platform_settings;

CREATE POLICY "Super admin can insert settings"
  ON public.platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update settings"
  ON public.platform_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

;
