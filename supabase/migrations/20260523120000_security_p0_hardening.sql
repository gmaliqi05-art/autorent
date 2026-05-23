/*
  # Security P0 Hardening (audit 2026-05-23)

  Rregullimet kritike te sigurise nga audit-i:

  1. rate_limit_buckets ka RLS aktiv pa polici — shtohet polici e qarte DENY per
     anon/authenticated. Vetem service_role do te shkruaje/lexoje.

  2. SECURITY DEFINER functions qe nuk duhen te jene callable nga klienti
     (jane helper functions per triggers ose cron) — REVOKE EXECUTE nga
     anon/authenticated:
       - cleanup_rate_limit_buckets()
       - on_review_change()
       - prevent_protected_profile_changes()
       - recalc_company_rating(uuid)
       - recalc_vehicle_rating(uuid)

  3. Funksionet public-facing qe MBETEN te aksesueshme (qellim biznesi):
       - available_vehicles(date, date)  — listing publik
       - vehicle_blocked_dates(uuid, date, date)  — calendar publik
       - is_super_admin()  — RLS helper
       - create_company_for_current_user(...)  — sign-up kompanie
       - update_own_profile(...)  — perditesim profili

  4. Storage public buckets (ad-images, company-media) — heqim policine
     broad SELECT qe lejon listim. URL-te e drejtperdrejta funksionojne pa to.

  Shenim: pg_net extension move nga public te extensions NUK aplikohet ketu
  (mund te thyeje pg_cron qe e perdor). Eshte ne backlog.
*/

-- ============================================================================
-- 1. rate_limit_buckets — polici DENY eksplicite
-- ============================================================================

DROP POLICY IF EXISTS "Deny all rate_limit_buckets" ON public.rate_limit_buckets;

CREATE POLICY "Deny all rate_limit_buckets"
  ON public.rate_limit_buckets
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.rate_limit_buckets IS
  'Rate limiter buckets. Only service_role (edge functions) reads/writes via SECURITY DEFINER RPC check_rate_limit().';

-- ============================================================================
-- 2. REVOKE EXECUTE nga funksionet helper qe s\'duhen direkt
-- ============================================================================

-- cleanup_rate_limit_buckets — duhet vetem nga cron/service_role
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limit_buckets() FROM PUBLIC, anon, authenticated;

-- on_review_change — funksion trigger; nuk thirret direkt
REVOKE EXECUTE ON FUNCTION public.on_review_change() FROM PUBLIC, anon, authenticated;

-- prevent_protected_profile_changes — funksion trigger
REVOKE EXECUTE ON FUNCTION public.prevent_protected_profile_changes() FROM PUBLIC, anon, authenticated;

-- recalc_company_rating / recalc_vehicle_rating — helper per trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'recalc_company_rating'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.recalc_company_rating(uuid) FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'recalc_vehicle_rating'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.recalc_vehicle_rating(uuid) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- ============================================================================
-- 3. Storage: heq policy broad SELECT nga bucket-et publike
-- ============================================================================
-- Per buckets me public=true, file URLs funksionojne pa SELECT policy.
-- Heqja parandalon enumerimin/listimin e file-ave.

DROP POLICY IF EXISTS "Ad images public read" ON storage.objects;
DROP POLICY IF EXISTS "Company media public read" ON storage.objects;

-- ============================================================================
-- 4. Komente per audit trail
-- ============================================================================

COMMENT ON FUNCTION public.cleanup_rate_limit_buckets() IS
  'Internal: removes expired rate limit buckets. Callable only by service_role.';

COMMENT ON FUNCTION public.on_review_change() IS
  'Internal trigger function: recalculates aggregate ratings. Not directly callable.';

COMMENT ON FUNCTION public.prevent_protected_profile_changes() IS
  'Internal trigger function: prevents role escalation. Not directly callable.';
