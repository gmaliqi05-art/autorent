/*
  # Performance: RLS initplan + missing FK indexes (audit 2026-05-23)

  Probleme te identifikuara nga Supabase advisor:

  1. auth_rls_initplan — auth.uid() / auth.jwt() jane funksione VOLATILE qe ri-evaluohen
     per cdo rresht. Wrap ne (SELECT ...) i ben ata STABLE per query-n => 10-100x speedup
     ne tabela me >1000 rresht.

  2. unindexed_foreign_keys — FK pa indeks bejne JOIN te ngadalshme dhe DELETE/UPDATE
     locks tabelen e parent-it.

  Te gjitha DROP + CREATE policies brenda nje block, idempotent.
*/

-- ============================================================================
-- 1. RLS optimizations — wrap auth.uid() ne (SELECT ...)
-- ============================================================================

-- BOOKINGS
DROP POLICY IF EXISTS "Clients can only cancel own pending bookings" ON public.bookings;
CREATE POLICY "Clients can only cancel own pending bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING ((client_id = (SELECT auth.uid())) AND (status = 'pending'))
  WITH CHECK ((client_id = (SELECT auth.uid())));

-- CHAT
DROP POLICY IF EXISTS "Users view own conversations or super admin" ON public.chat_conversations;
CREATE POLICY "Users view own conversations or super admin"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  );

DROP POLICY IF EXISTS "Users view own conversation messages or super admin" ON public.chat_messages;
CREATE POLICY "Users view own conversation messages or super admin"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
          chat_conversations.user_id = (SELECT auth.uid())
          OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
        )
    )
  );

-- CLIENT_DOCUMENTS
DROP POLICY IF EXISTS "Clients view own documents" ON public.client_documents;
CREATE POLICY "Clients view own documents"
  ON public.client_documents FOR SELECT
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Clients update own documents" ON public.client_documents;
CREATE POLICY "Clients update own documents"
  ON public.client_documents FOR UPDATE
  TO authenticated
  USING (client_id = (SELECT auth.uid()))
  WITH CHECK (client_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Clients delete own documents" ON public.client_documents;
CREATE POLICY "Clients delete own documents"
  ON public.client_documents FOR DELETE
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

-- EMAIL_LOGS — perdor JWT app_metadata jo profiles lookup (me e shpejte)
DROP POLICY IF EXISTS "Super admins can read email logs" ON public.email_logs;
CREATE POLICY "Super admins can read email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- HOMEPAGE_SETTINGS
DROP POLICY IF EXISTS "Super admins can update homepage settings" ON public.homepage_settings;
CREATE POLICY "Super admins can update homepage settings"
  ON public.homepage_settings FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- INVOICES
DROP POLICY IF EXISTS "Clients can view own invoices" ON public.invoices;
CREATE POLICY "Clients can view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (client_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Company admins can view company invoices" ON public.invoices;
CREATE POLICY "Company admins can view company invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoices.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company admins can update own company invoices" ON public.invoices;
CREATE POLICY "Company admins can update own company invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoices.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- VEHICLE_CATEGORIES — perdor JWT jo profiles lookup
DROP POLICY IF EXISTS "Super admin can read all categories" ON public.vehicle_categories;
CREATE POLICY "Super admin can read all categories"
  ON public.vehicle_categories FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin can update categories" ON public.vehicle_categories;
CREATE POLICY "Super admin can update categories"
  ON public.vehicle_categories FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin can delete categories" ON public.vehicle_categories;
CREATE POLICY "Super admin can delete categories"
  ON public.vehicle_categories FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- VEHICLE_UNAVAILABILITY
DROP POLICY IF EXISTS "Company staff view own unavailability" ON public.vehicle_unavailability;
CREATE POLICY "Company staff view own unavailability"
  ON public.vehicle_unavailability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      JOIN public.companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
        AND c.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company staff update own unavailability" ON public.vehicle_unavailability;
CREATE POLICY "Company staff update own unavailability"
  ON public.vehicle_unavailability FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      JOIN public.companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
        AND c.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company staff delete own unavailability" ON public.vehicle_unavailability;
CREATE POLICY "Company staff delete own unavailability"
  ON public.vehicle_unavailability FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      JOIN public.companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
        AND c.owner_id = (SELECT auth.uid())
    )
  );

-- VEHICLES (update/delete)
DROP POLICY IF EXISTS "Company owners can update own vehicles" ON public.vehicles;
CREATE POLICY "Company owners can update own vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Company owners can delete own vehicles" ON public.vehicles;
CREATE POLICY "Company owners can delete own vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
  );

-- BANK_ACCOUNTS — JWT lookup
DROP POLICY IF EXISTS "Super admin reads all bank accounts" ON public.bank_accounts;
CREATE POLICY "Super admin reads all bank accounts"
  ON public.bank_accounts FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates bank accounts" ON public.bank_accounts;
CREATE POLICY "Super admin updates bank accounts"
  ON public.bank_accounts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin deletes bank accounts" ON public.bank_accounts;
CREATE POLICY "Super admin deletes bank accounts"
  ON public.bank_accounts FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- 2. Missing FK indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_by
  ON public.bookings(cancelled_by)
  WHERE cancelled_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_documents_verified_by
  ON public.client_documents(verified_by)
  WHERE verified_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_homepage_settings_updated_by
  ON public.homepage_settings(updated_by)
  WHERE updated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_unavailability_created_by
  ON public.vehicle_unavailability(created_by)
  WHERE created_by IS NOT NULL;

-- ============================================================================
-- 3. Indexe shtese per filtra te shpeshte (listing)
-- ============================================================================

-- Filter "available now": is_published + status + deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_vehicles_published_active
  ON public.vehicles(is_published, status, company_id)
  WHERE is_published = true AND status = 'active' AND deleted_at IS NULL;

-- Filter bookings per kompani + periudhe
CREATE INDEX IF NOT EXISTS idx_bookings_company_dates_status
  ON public.bookings(company_id, pickup_date, status)
  WHERE status IN ('pending','confirmed','active');

-- Notifications unread per perdorues
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE is_read = false;
