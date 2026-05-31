/*
  # Fix chat_responses, platform_ads, homepage_content RLS policies
  Replace broken app_metadata checks with is_super_admin() function
*/

-- chat_responses
DROP POLICY IF EXISTS "Chat responses readable by authenticated" ON public.chat_responses;

DROP POLICY IF EXISTS "Super admin inserts chat responses" ON public.chat_responses;

DROP POLICY IF EXISTS "Super admin updates chat responses" ON public.chat_responses;

DROP POLICY IF EXISTS "Super admin deletes chat responses" ON public.chat_responses;

CREATE POLICY "Chat responses readable by authenticated users"
  ON public.chat_responses
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_super_admin());

CREATE POLICY "Super admin can insert chat responses"
  ON public.chat_responses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update chat responses"
  ON public.chat_responses
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete chat responses"
  ON public.chat_responses
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- platform_ads
DROP POLICY IF EXISTS "Ads readable by authenticated" ON public.platform_ads;

DROP POLICY IF EXISTS "Super admin inserts ads" ON public.platform_ads;

DROP POLICY IF EXISTS "Super admin updates ads" ON public.platform_ads;

DROP POLICY IF EXISTS "Super admin deletes ads" ON public.platform_ads;

CREATE POLICY "Platform ads readable by authenticated"
  ON public.platform_ads
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_super_admin());

CREATE POLICY "Super admin can insert ads"
  ON public.platform_ads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update ads"
  ON public.platform_ads
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete ads"
  ON public.platform_ads
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- homepage_content (may not exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'homepage_content') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Homepage content readable by authenticated" ON public.homepage_content';

    EXECUTE 'DROP POLICY IF EXISTS "Super admin inserts homepage content" ON public.homepage_content';

    EXECUTE 'DROP POLICY IF EXISTS "Super admin updates homepage content" ON public.homepage_content';

    EXECUTE 'DROP POLICY IF EXISTS "Super admin deletes homepage content" ON public.homepage_content';

    EXECUTE 'CREATE POLICY "Homepage content readable" ON public.homepage_content FOR SELECT TO authenticated USING (is_active = true OR public.is_super_admin())';

    EXECUTE 'CREATE POLICY "Super admin can insert homepage content" ON public.homepage_content FOR INSERT TO authenticated WITH CHECK (public.is_super_admin())';

    EXECUTE 'CREATE POLICY "Super admin can update homepage content" ON public.homepage_content FOR UPDATE TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin())';

    EXECUTE 'CREATE POLICY "Super admin can delete homepage content" ON public.homepage_content FOR DELETE TO authenticated USING (public.is_super_admin())';

  END IF;

END $$;

;
