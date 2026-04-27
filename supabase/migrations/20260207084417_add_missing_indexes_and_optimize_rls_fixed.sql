/*
  # Add Missing Indexes and Optimize RLS Policies

  ## Changes

  1. **Foreign Key Indexes**
     - Add index on `chat_conversations.user_id`
     - Add index on `chat_messages.matched_response_id`
     - Add index on `companies.subscription_plan_id`
     - Add index on `homepage_content.updated_by`
     - Add index on `profiles.city_id`
     - Add index on `profiles.country_id`
     - Add index on `reviews.booking_id`

  2. **RLS Policy Optimization**
     - Replace `auth.uid()` with `(select auth.uid())` in all policies
     - This prevents re-evaluation for each row and improves query performance
     - Update policies for: profiles, companies, vehicles, bookings, reviews, chat_responses,
       homepage_content, platform_ads, chat_conversations, chat_messages, platform_settings,
       subscription_plans, countries, cities, email_logs, email_templates

  3. **Security Improvements**
     - Policies are recreated with optimized performance
     - All existing security rules are maintained
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_matched_response_id ON chat_messages(matched_response_id);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_plan_id ON companies(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_homepage_content_updated_by ON homepage_content(updated_by);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_country_id ON profiles(country_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);

-- Optimize profiles RLS policies
DROP POLICY IF EXISTS "Perdoruesit mund te lexojne profilin e tyre" ON profiles;
DROP POLICY IF EXISTS "Perdoruesit mund te perditesojne profilin e tyre" ON profiles;
DROP POLICY IF EXISTS "Perdoruesit mund te krijojne profilin e tyre" ON profiles;
DROP POLICY IF EXISTS "Super admin mund te shikoje te gjitha profilet" ON profiles;

CREATE POLICY "Perdoruesit mund te lexojne profilin e tyre"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Perdoruesit mund te perditesojne profilin e tyre"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Perdoruesit mund te krijojne profilin e tyre"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Super admin mund te shikoje te gjitha profilet"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize companies RLS policies
DROP POLICY IF EXISTS "Pronaret krijojne kompanine" ON companies;
DROP POLICY IF EXISTS "Kompanite e aprovuara jane publike" ON companies;
DROP POLICY IF EXISTS "Pronaret perditesojne kompanine e tyre" ON companies;
DROP POLICY IF EXISTS "Super admin fshin kompanite" ON companies;

CREATE POLICY "Pronaret krijojne kompanine"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Kompanite e aprovuara jane publike"
  ON companies FOR SELECT
  TO authenticated
  USING (status = 'approved' OR owner_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Pronaret perditesojne kompanine e tyre"
  ON companies FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (owner_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin fshin kompanite"
  ON companies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize vehicles RLS policies
DROP POLICY IF EXISTS "Kompania shton automjete" ON vehicles;
DROP POLICY IF EXISTS "Kompania perditeson automjetet" ON vehicles;
DROP POLICY IF EXISTS "Kompania fshin automjetet" ON vehicles;
DROP POLICY IF EXISTS "Automjetet e publikuara jane publike" ON vehicles;

CREATE POLICY "Kompania shton automjete"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Kompania perditeson automjetet"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Kompania fshin automjetet"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Automjetet e publikuara jane publike"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    is_published = true OR 
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize bookings RLS policies
DROP POLICY IF EXISTS "Klienti krijon rezervime" ON bookings;
DROP POLICY IF EXISTS "Klienti shikon rezervimet e veta" ON bookings;
DROP POLICY IF EXISTS "Perditesimi i rezervimeve" ON bookings;

CREATE POLICY "Klienti krijon rezervime"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (client_id = (select auth.uid()));

CREATE POLICY "Klienti shikon rezervimet e veta"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    client_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Perditesimi i rezervimeve"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    client_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    client_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize reviews RLS policies
DROP POLICY IF EXISTS "Klienti le vleresim" ON reviews;

CREATE POLICY "Klienti le vleresim"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.client_id = (select auth.uid())
      AND bookings.status = 'completed'
    )
  );

-- Optimize chat_responses RLS policies
DROP POLICY IF EXISTS "Chat responses readable by authenticated" ON chat_responses;
DROP POLICY IF EXISTS "Super admin inserts chat responses" ON chat_responses;
DROP POLICY IF EXISTS "Super admin updates chat responses" ON chat_responses;
DROP POLICY IF EXISTS "Super admin deletes chat responses" ON chat_responses;

CREATE POLICY "Chat responses readable by authenticated"
  ON chat_responses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admin inserts chat responses"
  ON chat_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin updates chat responses"
  ON chat_responses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin deletes chat responses"
  ON chat_responses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize homepage_content RLS policies
DROP POLICY IF EXISTS "Homepage content readable by authenticated" ON homepage_content;
DROP POLICY IF EXISTS "Super admin inserts homepage content" ON homepage_content;
DROP POLICY IF EXISTS "Super admin updates homepage content" ON homepage_content;
DROP POLICY IF EXISTS "Super admin deletes homepage content" ON homepage_content;

CREATE POLICY "Homepage content readable by authenticated"
  ON homepage_content FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admin inserts homepage content"
  ON homepage_content FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin updates homepage content"
  ON homepage_content FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin deletes homepage content"
  ON homepage_content FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize platform_ads RLS policies
DROP POLICY IF EXISTS "Ads readable by authenticated" ON platform_ads;
DROP POLICY IF EXISTS "Super admin inserts ads" ON platform_ads;
DROP POLICY IF EXISTS "Super admin updates ads" ON platform_ads;
DROP POLICY IF EXISTS "Super admin deletes ads" ON platform_ads;

CREATE POLICY "Ads readable by authenticated"
  ON platform_ads FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admin inserts ads"
  ON platform_ads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin updates ads"
  ON platform_ads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin deletes ads"
  ON platform_ads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize chat_conversations RLS policies
DROP POLICY IF EXISTS "Users view own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Authenticated creates conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Super admin updates conversations" ON chat_conversations;

CREATE POLICY "Users view own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Authenticated creates conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admin updates conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize chat_messages RLS policies
DROP POLICY IF EXISTS "Users view own conversation messages" ON chat_messages;

CREATE POLICY "Users view own conversation messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = conversation_id
      AND (
        chat_conversations.user_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid())
          AND profiles.role = 'super_admin'
        )
      )
    )
  );

-- Optimize platform_settings RLS policies
DROP POLICY IF EXISTS "Super admin inserts settings" ON platform_settings;
DROP POLICY IF EXISTS "Super admin updates settings" ON platform_settings;

CREATE POLICY "Super admin inserts settings"
  ON platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin updates settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize subscription_plans RLS policies
DROP POLICY IF EXISTS "Super admin inserts subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin updates subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin deletes subscription plans" ON subscription_plans;

CREATE POLICY "Super admin inserts subscription plans"
  ON subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin updates subscription plans"
  ON subscription_plans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin deletes subscription plans"
  ON subscription_plans FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize countries RLS policies
DROP POLICY IF EXISTS "Super admin mund të shtojë shtete" ON countries;
DROP POLICY IF EXISTS "Super admin mund të përditësojë shtete" ON countries;
DROP POLICY IF EXISTS "Super admin mund të fshijë shtete" ON countries;

CREATE POLICY "Super admin mund të shtojë shtete"
  ON countries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin mund të përditësojë shtete"
  ON countries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin mund të fshijë shtete"
  ON countries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize cities RLS policies
DROP POLICY IF EXISTS "Super admin mund të shtojë qytete" ON cities;
DROP POLICY IF EXISTS "Super admin mund të përditësojë qytete" ON cities;
DROP POLICY IF EXISTS "Super admin mund të fshijë qytete" ON cities;

CREATE POLICY "Super admin mund të shtojë qytete"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin mund të përditësojë qytete"
  ON cities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin mund të fshijë qytete"
  ON cities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize email_logs RLS policies
DROP POLICY IF EXISTS "Super admins can view all email logs" ON email_logs;

CREATE POLICY "Super admins can view all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- Optimize email_templates RLS policies
DROP POLICY IF EXISTS "Super admins can view email templates" ON email_templates;
DROP POLICY IF EXISTS "Super admins can insert email templates" ON email_templates;
DROP POLICY IF EXISTS "Super admins can update email templates" ON email_templates;
DROP POLICY IF EXISTS "Super admins can delete email templates" ON email_templates;

CREATE POLICY "Super admins can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );
