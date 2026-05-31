/*
  # Security Hardening — role escalation + atomic company signup

  ## Problem 1: Role escalation potencial
  Politika "Users can update own profile" lejonte update tek te gjitha kolonat,
  perfshire `role`. Nje user normal mund te ekzekutonte:
    UPDATE profiles SET role='super_admin' WHERE id=auth.uid();
  RLS-ja e backend-it e bllokon aksesin e te dhenave (sepse super_admin verifikohet
  ne JWT.app_metadata, jo ne profiles.role), por UI-ja do t'i jepte akses ne
  routes-at `/admin` ose `/kompania`.

  Zgjidhja:
  - Trigger BEFORE UPDATE ne profiles qe bllokon ndryshimin e:
      role, id, is_active
    Vetem super_admin (ne JWT.app_metadata) ose service_role mund t'i ndryshojne.

  ## Problem 2: Sign-up i kompanive jo-atomik
  Procesi i vjeter (client-side) bente: signUp -> update profile -> insert company,
  3 operacione te ndara. Nese njera deshtonte, le state te papastert (psh user me
  role='company_admin' por pa kompani).

  Zgjidhja:
  - RPC `create_company_for_current_user(...)` qe ekzekutohet ne nje transaksion
    te vetem. Klienti thirr kete pasi te kete bere signUp normal.

  ## Security
  - Trigger eshte SECURITY DEFINER me search_path fiks (anti-hijack)
  - RPC eshte SECURITY DEFINER por verifikon `auth.uid()` brenda
  - RPC nuk lejon caktimin e `owner_id` nga klienti — perdor auth.uid()
*/

-- ============================================================================
-- 0z. PRE: shto kolonat Stripe ne bookings
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='stripe_session_id') THEN
    ALTER TABLE public.bookings ADD COLUMN stripe_session_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='stripe_payment_intent_id') THEN
    ALTER TABLE public.bookings ADD COLUMN stripe_payment_intent_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='paid_at') THEN
    ALTER TABLE public.bookings ADD COLUMN paid_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session_id
  ON public.bookings(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent_id
  ON public.bookings(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Zgjero payment_status check te lejoje 'refunded'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'bookings_payment_status_check'
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_payment_status_check;
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending','paid','failed','refunded'));

-- Shto payment_status edhe ne invoices nese mungon
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='payment_status') THEN
    ALTER TABLE public.invoices ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;
END $$;

-- ============================================================================
-- 0a. PRE: shto kolonen provider_message_id ne email_logs (per tracking Resend)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='email_logs' AND column_name='provider_message_id'
  ) THEN
    ALTER TABLE public.email_logs ADD COLUMN provider_message_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_logs_provider_message_id
  ON public.email_logs(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

-- ============================================================================
-- 0b. PRE: shto kolonen preferred_language ne profiles (referohet ne kod por nuk ekzistonte)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='preferred_language'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN preferred_language text DEFAULT 'sq'
      CHECK (preferred_language IN ('sq','en','de'));
  END IF;
END $$;

-- ============================================================================
-- 1. TRIGGER: bllokon role escalation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_protected_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  caller_role text;
BEGIN
  -- Lejoje gjithmone nese po ekzekuton service_role (edge functions me service key)
  caller_role := current_setting('request.jwt.claim.role', true);
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Lejoje nese caller-i eshte super_admin (sipas JWT app_metadata)
  is_admin := COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );

  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Per perdorues te zakonshem, blloko ndryshimin e kolonave te mbrojtura
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot change profile id';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Permission denied: cannot change role';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Permission denied: cannot change is_active';
  END IF;

  -- email-i e mban auth.users, nuk duhet ndryshuar manualisht ne profiles
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Cannot change email directly; use Supabase Auth API';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_protected_profile_changes_trigger ON public.profiles;
CREATE TRIGGER prevent_protected_profile_changes_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_protected_profile_changes();

-- ============================================================================
-- 2. RPC: krijim atomik i kompanise per perdoruesin aktual
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_company_for_current_user(
  p_name text,
  p_phone text,
  p_email text,
  p_city text,
  p_country text,
  p_city_id uuid DEFAULT NULL,
  p_country_id uuid DEFAULT NULL,
  p_subscription_plan_id uuid DEFAULT NULL,
  p_billing_cycle text DEFAULT 'monthly'
)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_company public.companies;
  v_slug text;
  v_now timestamptz := now();
  v_expires_at timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validim parametrash
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Invalid company name';
  END IF;
  IF p_billing_cycle NOT IN ('monthly', 'yearly') THEN
    RAISE EXCEPTION 'Invalid billing cycle';
  END IF;

  -- Nje perdorues mund te zoteroje maksimumi nje kompani (mund ta heqim nese duam multi)
  IF EXISTS (SELECT 1 FROM public.companies WHERE owner_id = v_user_id) THEN
    RAISE EXCEPTION 'User already owns a company';
  END IF;

  -- Slug unik
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  v_slug := v_slug || '-' || extract(epoch from v_now)::bigint::text;

  -- Llogarit datën e skadimit nese ka subscription
  IF p_subscription_plan_id IS NOT NULL THEN
    IF p_billing_cycle = 'yearly' THEN
      v_expires_at := v_now + interval '1 year';
    ELSE
      v_expires_at := v_now + interval '1 month';
    END IF;
  END IF;

  -- Update profile.role => 'company_admin' (trigger e lejon sepse jemi ne SECURITY DEFINER me service-like context;
  -- por per siguri shtese: e bejme me update direkt te tabela duke u sjelle si admin context)
  -- Trick: caktoj request.jwt.claim.role per kete sesion
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.profiles
  SET role = 'company_admin',
      phone = COALESCE(p_phone, phone),
      country_id = COALESCE(p_country_id, country_id),
      city_id = COALESCE(p_city_id, city_id),
      updated_at = v_now
  WHERE id = v_user_id;

  -- Insert kompania
  INSERT INTO public.companies (
    owner_id, name, slug, description, phone, email, city, country,
    country_id, city_id,
    subscription_plan_id, subscription_status, subscription_expires_at,
    status, created_at, updated_at
  ) VALUES (
    v_user_id, p_name, v_slug, '', COALESCE(p_phone,''), COALESCE(p_email,''),
    COALESCE(p_city,''), COALESCE(p_country,''),
    p_country_id, p_city_id,
    p_subscription_plan_id,
    CASE WHEN p_subscription_plan_id IS NOT NULL THEN 'active' ELSE 'inactive' END,
    v_expires_at,
    'pending', v_now, v_now
  )
  RETURNING * INTO v_company;

  RETURN v_company;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_company_for_current_user(
  text, text, text, text, text, uuid, uuid, uuid, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_company_for_current_user(
  text, text, text, text, text, uuid, uuid, uuid, text
) TO authenticated;

-- ============================================================================
-- 3. RPC: lejon klientin te perditesoje vetem fushat e veta jo-te-mbrojtura
-- ============================================================================
-- Opsionale: zhvilluesit mund ta perdorin kete ne vend te UPDATE direkt
-- per te qene me eksplicit per atributet qe lejohen.

CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_country_id uuid DEFAULT NULL,
  p_city_id uuid DEFAULT NULL,
  p_preferred_language text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile public.profiles;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_preferred_language IS NOT NULL AND p_preferred_language NOT IN ('sq','en','de') THEN
    RAISE EXCEPTION 'Invalid language';
  END IF;

  -- Anasjelltas trigger-it: e fusim "service_role" claim ne sesion ne menyre qe
  -- trigger-i mos ta bllokoje update-in nese ne te ardhmen shtojme kolone te re
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    country_id = COALESCE(p_country_id, country_id),
    city_id = COALESCE(p_city_id, city_id),
    preferred_language = COALESCE(p_preferred_language, preferred_language),
    updated_at = now()
  WHERE id = v_user_id
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_own_profile(text, text, text, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_own_profile(text, text, text, uuid, uuid, text) TO authenticated;
