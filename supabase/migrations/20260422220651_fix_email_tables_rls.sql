/*
  # Fix email_templates and email_logs RLS policies
  Replace broken app_metadata checks with is_super_admin() function
*/

-- email_templates: drop only the broken app_metadata ones, keep "Authenticated can read email templates"
DROP POLICY IF EXISTS "Super admins can view email templates" ON public.email_templates;

DROP POLICY IF EXISTS "Super admins can insert email templates" ON public.email_templates;

DROP POLICY IF EXISTS "Super admins can update email templates" ON public.email_templates;

DROP POLICY IF EXISTS "Super admins can delete email templates" ON public.email_templates;

CREATE POLICY "Super admin can insert email templates"
  ON public.email_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update email templates"
  ON public.email_templates
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete email templates"
  ON public.email_templates
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- email_logs
DROP POLICY IF EXISTS "Super admins can view all email logs" ON public.email_logs;

DROP POLICY IF EXISTS "Super admin can insert email logs" ON public.email_logs;

DROP POLICY IF EXISTS "Super admin can update email logs" ON public.email_logs;

CREATE POLICY "Super admin can view email logs"
  ON public.email_logs
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin can create email logs"
  ON public.email_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can modify email logs"
  ON public.email_logs
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

;
