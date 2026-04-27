/*
  # Fix Security and Performance Issues
  
  ## Changes
  
  ### 1. Add Missing Indexes on Foreign Keys
  - chat_conversations.user_id
  - chat_messages.matched_response_id
  - companies.city_id, country_id, subscription_plan_id
  - homepage_content.updated_by
  - profiles.city_id, country_id
  
  ### 2. Optimize RLS Policies
  - Wrap all auth.uid() calls with (select auth.uid())
  - Wrap all auth.jwt() calls with (select auth.jwt())
  - This prevents re-evaluation for each row
  
  ### 3. Fix Function Search Path
  - Set immutable search_path on update_updated_at_column function
  
  ## Performance Impact
  - Significant improvement in query performance with foreign key indexes
  - RLS policies will execute much faster at scale
  - Function is now secure against search_path hijacking
*/

-- ============================================================================
-- ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_matched_response_id ON chat_messages(matched_response_id);
CREATE INDEX IF NOT EXISTS idx_companies_city_id ON companies(city_id);
CREATE INDEX IF NOT EXISTS idx_companies_country_id ON companies(country_id);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_plan_id ON companies(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_homepage_content_updated_by ON homepage_content(updated_by);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_country_id ON profiles(country_id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - PROFILES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- OPTIMIZE RLS POLICIES - COMPANIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Company admins can view own company" ON companies;
CREATE POLICY "Company admins can view own company"
  ON companies FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Company admins can update own company" ON companies;
CREATE POLICY "Company admins can update own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create company" ON companies;
CREATE POLICY "Users can create company"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

-- ============================================================================
-- OPTIMIZE RLS POLICIES - VEHICLES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Company admins view own vehicles" ON vehicles;
CREATE POLICY "Company admins view own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = vehicles.company_id 
      AND companies.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company admins manage own vehicles" ON vehicles;
CREATE POLICY "Company admins manage own vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = vehicles.company_id 
      AND companies.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = vehicles.company_id 
      AND companies.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- OPTIMIZE RLS POLICIES - BOOKINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users view own bookings" ON bookings;
CREATE POLICY "Users view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (client_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users create own bookings" ON bookings;
CREATE POLICY "Users create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users update own bookings" ON bookings;
CREATE POLICY "Users update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (client_id = (select auth.uid()))
  WITH CHECK (client_id = (select auth.uid()));

DROP POLICY IF EXISTS "Company admins view company bookings" ON bookings;
CREATE POLICY "Company admins view company bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = bookings.company_id 
      AND companies.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company admins update company bookings" ON bookings;
CREATE POLICY "Company admins update company bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = bookings.company_id 
      AND companies.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = bookings.company_id 
      AND companies.owner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- OPTIMIZE RLS POLICIES - REVIEWS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users create own reviews" ON reviews;
CREATE POLICY "Users create own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (select auth.uid()));

-- ============================================================================
-- OPTIMIZE RLS POLICIES - CHAT_RESPONSES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Chat responses readable by authenticated" ON chat_responses;
CREATE POLICY "Chat responses readable by authenticated"
  ON chat_responses FOR SELECT TO authenticated
  USING (is_active = true OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin inserts chat responses" ON chat_responses;
CREATE POLICY "Super admin inserts chat responses"
  ON chat_responses FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates chat responses" ON chat_responses;
CREATE POLICY "Super admin updates chat responses"
  ON chat_responses FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin deletes chat responses" ON chat_responses;
CREATE POLICY "Super admin deletes chat responses"
  ON chat_responses FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- OPTIMIZE RLS POLICIES - HOMEPAGE_CONTENT TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Homepage content readable by authenticated" ON homepage_content;
CREATE POLICY "Homepage content readable by authenticated"
  ON homepage_content FOR SELECT TO authenticated
  USING (is_active = true OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin inserts homepage content" ON homepage_content;
CREATE POLICY "Super admin inserts homepage content"
  ON homepage_content FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates homepage content" ON homepage_content;
CREATE POLICY "Super admin updates homepage content"
  ON homepage_content FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin deletes homepage content" ON homepage_content;
CREATE POLICY "Super admin deletes homepage content"
  ON homepage_content FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- OPTIMIZE RLS POLICIES - PLATFORM_ADS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Ads readable by authenticated" ON platform_ads;
CREATE POLICY "Ads readable by authenticated"
  ON platform_ads FOR SELECT TO authenticated
  USING (is_active = true OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin inserts ads" ON platform_ads;
CREATE POLICY "Super admin inserts ads"
  ON platform_ads FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates ads" ON platform_ads;
CREATE POLICY "Super admin updates ads"
  ON platform_ads FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin deletes ads" ON platform_ads;
CREATE POLICY "Super admin deletes ads"
  ON platform_ads FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- OPTIMIZE RLS POLICIES - CHAT_CONVERSATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users view own conversations" ON chat_conversations;
CREATE POLICY "Users view own conversations"
  ON chat_conversations FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Authenticated creates conversations" ON chat_conversations;
CREATE POLICY "Authenticated creates conversations"
  ON chat_conversations FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Super admin updates conversations" ON chat_conversations;
CREATE POLICY "Super admin updates conversations"
  ON chat_conversations FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- OPTIMIZE RLS POLICIES - CHAT_MESSAGES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users view own conversation messages" ON chat_messages;
CREATE POLICY "Users view own conversation messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (chat_conversations.user_id = (select auth.uid())
        OR ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
    )
  );

-- ============================================================================
-- OPTIMIZE RLS POLICIES - PLATFORM_SETTINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Super admin inserts settings" ON platform_settings;
CREATE POLICY "Super admin inserts settings"
  ON platform_settings FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates settings" ON platform_settings;
CREATE POLICY "Super admin updates settings"
  ON platform_settings FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- OPTIMIZE RLS POLICIES - SUBSCRIPTION_PLANS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Super admin inserts subscription plans" ON subscription_plans;
CREATE POLICY "Super admin inserts subscription plans"
  ON subscription_plans FOR INSERT TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates subscription plans" ON subscription_plans;
CREATE POLICY "Super admin updates subscription plans"
  ON subscription_plans FOR UPDATE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin deletes subscription plans" ON subscription_plans;
CREATE POLICY "Super admin deletes subscription plans"
  ON subscription_plans FOR DELETE TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- OPTIMIZE RLS POLICIES - EMAIL_LOGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can view all email logs" ON email_logs;
CREATE POLICY "Super admins can view all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- OPTIMIZE RLS POLICIES - EMAIL_TEMPLATES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can view email templates" ON email_templates;
CREATE POLICY "Super admins can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admins can insert email templates" ON email_templates;
CREATE POLICY "Super admins can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admins can update email templates" ON email_templates;
CREATE POLICY "Super admins can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admins can delete email templates" ON email_templates;
CREATE POLICY "Super admins can delete email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- FIX FUNCTION SEARCH PATH
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;