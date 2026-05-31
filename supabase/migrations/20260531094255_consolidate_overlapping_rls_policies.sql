-- P0.4 — Konsolido RLS policies overlapping
--
-- Per cdo (table, action, role), Postgres duhet te ekzekutoje cdo permissive
-- policy ne menyre te pavarur. Shumica e tabelave kane 2-3 policies te
-- ndara per "user own row", "company owner", "super_admin" — duke i bashkuar
-- ne nje policy te vetme me OR redukton overhead-in dhe planet e queryeve.
--
-- Per tabelat ku ka role mix (anon + authenticated), ndajme:
--  - nje policy publike per anon
--  - nje policy konsoliduar me OR per authenticated
--
-- Semantika e te dhenave ruhet identike. Asnje fushe e re lejimi.

BEGIN;

-- =====================================================================
-- BOOKINGS
-- =====================================================================

DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Company admins view company bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admin can view all bookings" ON public.bookings;

CREATE POLICY "bookings select consolidated" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = bookings.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Clients can only cancel own pending bookings" ON public.bookings;
DROP POLICY IF EXISTS "Company admins update company bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admin can update all bookings" ON public.bookings;

-- USING: qe nje rresht te jete update-able, perdoruesi duhet te jete:
--   - klienti i tij AND status='pending'  (vetem cancel/edit i lejuar para konfirmimit)
--   - company owner
--   - super_admin
-- WITH CHECK: pas update-it, rreshti duhet te ruaje pronesine ose te jete super_admin.
CREATE POLICY "bookings update consolidated" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    (client_id = (SELECT auth.uid()) AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = bookings.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
    OR public.is_super_admin()
  )
  WITH CHECK (
    client_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = bookings.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
    OR public.is_super_admin()
  );

-- =====================================================================
-- COMPANIES
-- =====================================================================

DROP POLICY IF EXISTS "Companies readable by all" ON public.companies;
DROP POLICY IF EXISTS "Company admins can view own company" ON public.companies;
DROP POLICY IF EXISTS "Super admin can view all companies" ON public.companies;

-- Anon mund te shohe vetem kompanite e aprovuara
CREATE POLICY "companies select anon" ON public.companies
  FOR SELECT TO anon
  USING (status = 'approved');

-- Authenticated: aprovuara OR pronari OR super_admin
CREATE POLICY "companies select authenticated" ON public.companies
  FOR SELECT TO authenticated
  USING (
    status = 'approved'
    OR owner_id = (SELECT auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Company admins can update own company" ON public.companies;
DROP POLICY IF EXISTS "Super admin can update all companies" ON public.companies;

CREATE POLICY "companies update consolidated" ON public.companies
  FOR UPDATE TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR public.is_super_admin()
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    OR public.is_super_admin()
  );

-- =====================================================================
-- VEHICLES
-- =====================================================================

DROP POLICY IF EXISTS "Published vehicles readable by all" ON public.vehicles;
DROP POLICY IF EXISTS "Company admins view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Super admin can view all vehicles" ON public.vehicles;

CREATE POLICY "vehicles select anon" ON public.vehicles
  FOR SELECT TO anon
  USING (is_published = true AND status = 'active');

CREATE POLICY "vehicles select authenticated" ON public.vehicles
  FOR SELECT TO authenticated
  USING (
    (is_published = true AND status = 'active')
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Company owners can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Super admin can update all vehicles" ON public.vehicles;

CREATE POLICY "vehicles update consolidated" ON public.vehicles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
    OR public.is_super_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Company owners can delete own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Super admin can delete vehicles" ON public.vehicles;

CREATE POLICY "vehicles delete consolidated" ON public.vehicles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
    OR public.is_super_admin()
  );

-- =====================================================================
-- BANK_ACCOUNTS
-- =====================================================================

DROP POLICY IF EXISTS "Primary active bank account is readable by all" ON public.bank_accounts;
DROP POLICY IF EXISTS "Super admin reads all bank accounts" ON public.bank_accounts;

CREATE POLICY "bank_accounts select anon" ON public.bank_accounts
  FOR SELECT TO anon
  USING (is_primary = true AND is_active = true);

CREATE POLICY "bank_accounts select authenticated" ON public.bank_accounts
  FOR SELECT TO authenticated
  USING (
    (is_primary = true AND is_active = true)
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin')
  );

-- =====================================================================
-- CLIENT_DOCUMENTS
-- =====================================================================

DROP POLICY IF EXISTS "Clients view own documents" ON public.client_documents;
DROP POLICY IF EXISTS "Super admins view all documents" ON public.client_documents;

CREATE POLICY "client_documents select consolidated" ON public.client_documents
  FOR SELECT TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Clients update own documents" ON public.client_documents;
DROP POLICY IF EXISTS "Super admins update verification" ON public.client_documents;

CREATE POLICY "client_documents update consolidated" ON public.client_documents
  FOR UPDATE TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    OR public.is_super_admin()
  )
  WITH CHECK (
    client_id = (SELECT auth.uid())
    OR public.is_super_admin()
  );

-- =====================================================================
-- EMAIL_LOGS — dy policies te dyfishuara per super_admin (njera JWT, tjetra profiles)
-- =====================================================================

DROP POLICY IF EXISTS "Super admin can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Super admins can read email logs" ON public.email_logs;

-- OR-i i te dyja kushteve per te ruajtur sjelljen identike (mos cunguar leximin
-- nese profile.role mungon por JWT-ja e ka, ose anasjelltas).
CREATE POLICY "email_logs select super_admin" ON public.email_logs
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin')
  );

-- =====================================================================
-- INVOICES
-- =====================================================================

DROP POLICY IF EXISTS "Clients can create own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Company admins can insert invoices for own company" ON public.invoices;

CREATE POLICY "invoices insert consolidated" ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoices.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Company admins can view company invoices" ON public.invoices;

CREATE POLICY "invoices select consolidated" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    client_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = invoices.company_id
        AND companies.owner_id = (SELECT auth.uid())
    )
  );

-- =====================================================================
-- PROFILES
-- =====================================================================

DROP POLICY IF EXISTS "Super admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles update consolidated" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR public.is_super_admin()
  )
  WITH CHECK (
    (SELECT auth.uid()) = id
    OR public.is_super_admin()
  );

-- =====================================================================
-- REVIEWS
-- =====================================================================

DROP POLICY IF EXISTS "Reviews readable by all" ON public.reviews;
DROP POLICY IF EXISTS "Super admin can view all reviews" ON public.reviews;

-- Reviews jane publike per te gjithe (qual ishte 'true' per anon+authenticated).
-- Per anon mbajme nje policy, per authenticated nje policy.
-- Te dyja kthejne TRUE, por super_admin policy ishte zhytje pa kuptim;
-- e largojme sepse 'true' tashme mbulon te gjithe.
CREATE POLICY "reviews select all" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- =====================================================================
-- VEHICLE_CATEGORIES
-- =====================================================================

DROP POLICY IF EXISTS "Public can read active categories" ON public.vehicle_categories;
DROP POLICY IF EXISTS "Super admin can read all categories" ON public.vehicle_categories;

CREATE POLICY "vehicle_categories select anon" ON public.vehicle_categories
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "vehicle_categories select authenticated" ON public.vehicle_categories
  FOR SELECT TO authenticated
  USING (
    is_active = true
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin')
  );

COMMIT;
