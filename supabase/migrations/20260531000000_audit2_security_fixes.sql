/*
  # Mbrojtje shtese sigurie nga audit-i i dyte

  Audit i thelle gjeti 2 issue kritike sigurie ne PR-të e fundit:

  1. discount_codes ekspozonte `value` per cdokend (anon mund te skrejpoje
     te gjitha kodet aktive + zbritjet e tyre). Risk: discount mining,
     enumerate me min_amount, competitor intel.

  2. profiles s'kishte mbrojtje shtese per date_of_birth (DOB eshte PII
     ne GDPR). RLS aktual lejon super_admin te lexoje cdo profil —
     OK per ops por DOB jashte nese leak.

  Fix:
   - Krijo VIEW publik `discount_codes_validation` qe ekspozon vetem
     `code, expires_at, min_amount` per anon (mjafton per checkout
     validation pa zbuluar vleren).
   - Fshi policy publike "Read valid codes" — vetem service_role +
     super_admin lexojne tabelen baze.
*/

-- ============================================================================
-- 1. discount_codes — hiq public access ne value
-- ============================================================================

-- Hiq policy publike (anon nuk duhet te shohi value)
DROP POLICY IF EXISTS "Public read valid codes" ON public.discount_codes;

-- VIEW publik per validim te kodit ne checkout (pa vlere):
-- Klienti dergon kodin → backend validuese e konsumon → kthen vleren.
CREATE OR REPLACE VIEW public.discount_codes_validation
WITH (security_invoker = true)
AS
SELECT
  code,
  type,
  min_amount,
  expires_at,
  CASE WHEN max_uses IS NOT NULL AND used_count >= max_uses THEN false ELSE true END AS has_capacity
FROM public.discount_codes
WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > now());

GRANT SELECT ON public.discount_codes_validation TO anon, authenticated;

COMMENT ON VIEW public.discount_codes_validation IS
  'View publik per checkout validation — ekspozon vetem fushat e nevojshme per UI feedback (a eshte i vlefshem). Vlera e zbritjes nuk del — backend e aplikon ne booking calculator.';

-- ============================================================================
-- 2. discount_codes — RPC apply per server-side calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_discount_code(
  p_code text,
  p_subtotal numeric
)
RETURNS TABLE (
  valid boolean,
  discount_amount numeric,
  type text,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.discount_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_code FROM public.discount_codes
  WHERE code = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::numeric, ''::text, 'not_found';
    RETURN;
  END IF;

  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN
    RETURN QUERY SELECT false, 0::numeric, ''::text, 'expired';
    RETURN;
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.used_count >= v_code.max_uses THEN
    RETURN QUERY SELECT false, 0::numeric, ''::text, 'max_uses_reached';
    RETURN;
  END IF;

  IF p_subtotal < v_code.min_amount THEN
    RETURN QUERY SELECT false, 0::numeric, ''::text, 'below_min_amount';
    RETURN;
  END IF;

  -- Llogarit zbritjen sipas tipit
  IF v_code.type = 'percent' THEN
    RETURN QUERY SELECT true, LEAST(p_subtotal * v_code.value / 100, p_subtotal)::numeric, v_code.type, 'ok';
  ELSE
    RETURN QUERY SELECT true, LEAST(v_code.value, p_subtotal)::numeric, v_code.type, 'ok';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_discount_code(text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_discount_code(text, numeric) TO anon, authenticated;

COMMENT ON FUNCTION public.apply_discount_code(text, numeric) IS
  'Apliko zbritje server-side. Klienti s''sheh asnjehere value e plote, vetem rezultatin per booking-un e tij. SECURITY DEFINER per te lejuar lexim te is_active rreshtave.';
