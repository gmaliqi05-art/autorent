/*
  # Expand preferred_language CHECK + update update_own_profile RPC

  Pas auditit u shtuan 4 gjuhe te reja ne i18n: it, fr, nl, pl.
  CHECK constraint i vjeter (sq/en/de) duhet zgjeruar.
  RPC update_own_profile rikrijohet me listen e re.

  Backwards compat: gjuhet ekzistuese mbeten te vlefshme.
*/

-- ============================================================================
-- 1. Zgjero CHECK constraint te profiles.preferred_language
-- ============================================================================

DO $$
BEGIN
  -- Hiq constraint-in ekzistues nese ka
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_preferred_language_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_preferred_language_check;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (preferred_language IN ('sq','en','de','it','fr','nl','pl'));

COMMENT ON COLUMN public.profiles.preferred_language IS
  'Locale i preferuar i perdoruesit. Mbeshtetet 7 gjuhe: sq, en, de, it, fr, nl, pl.';

-- ============================================================================
-- 2. Rikrijo RPC update_own_profile me listen e re
-- ============================================================================

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

  IF p_preferred_language IS NOT NULL
     AND p_preferred_language NOT IN ('sq','en','de','it','fr','nl','pl') THEN
    RAISE EXCEPTION 'Invalid language: %', p_preferred_language;
  END IF;

  -- Anasjelltas trigger-it: caktoj service_role claim per kete sesion
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

REVOKE EXECUTE ON FUNCTION public.update_own_profile(text, text, text, uuid, uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_own_profile(text, text, text, uuid, uuid, text)
  TO authenticated;

COMMENT ON FUNCTION public.update_own_profile(text, text, text, uuid, uuid, text) IS
  'Perditeson fushat e lejuara te profilit. Mbron nga role escalation. Mbeshtet 7 gjuhe.';
