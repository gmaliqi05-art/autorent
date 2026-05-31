/*
  # Fix profiles, companies, vehicles, bookings, reviews, chat RLS policies
  Replace broken app_metadata checks with is_super_admin() function
*/

-- profiles
DROP POLICY IF EXISTS "Super admin can update all profiles" ON public.profiles;

CREATE POLICY "Super admin can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- companies
DROP POLICY IF EXISTS "Super admin can view all companies" ON public.companies;

DROP POLICY IF EXISTS "Super admin can update all companies" ON public.companies;

CREATE POLICY "Super admin can view all companies"
  ON public.companies FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin can update all companies"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- vehicles
DROP POLICY IF EXISTS "Super admin can view all vehicles" ON public.vehicles;

DROP POLICY IF EXISTS "Super admin can update all vehicles" ON public.vehicles;

DROP POLICY IF EXISTS "Super admin can delete vehicles" ON public.vehicles;

CREATE POLICY "Super admin can view all vehicles"
  ON public.vehicles FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin can update all vehicles"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete vehicles"
  ON public.vehicles FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- bookings
DROP POLICY IF EXISTS "Super admin can view all bookings" ON public.bookings;

DROP POLICY IF EXISTS "Super admin can update all bookings" ON public.bookings;

CREATE POLICY "Super admin can view all bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin can update all bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- reviews
DROP POLICY IF EXISTS "Super admin can view all reviews" ON public.reviews;

DROP POLICY IF EXISTS "Super admin can delete reviews" ON public.reviews;

CREATE POLICY "Super admin can view all reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin can delete reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- chat_conversations
DROP POLICY IF EXISTS "Users view own conversations" ON public.chat_conversations;

DROP POLICY IF EXISTS "Super admin updates conversations" ON public.chat_conversations;

CREATE POLICY "Users view own conversations or super admin"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Super admin can update conversations"
  ON public.chat_conversations FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- chat_messages
DROP POLICY IF EXISTS "Users view own conversation messages" ON public.chat_messages;

CREATE POLICY "Users view own conversation messages or super admin"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.user_id = auth.uid() OR public.is_super_admin())
    )
  );

;
