/*
  # Loyalty security hardening — mbroni nga UPDATE attack ne loyalty_points_redeemed

  Audit gjeti rrezik: company admin (legjitim per rezervimet e kompanise se vet)
  mund te bente UPDATE ne bookings.loyalty_points_redeemed pa kaluar permes trigger-it
  qe validon balance-n. Trigger-i ekzistues bie vetëm ne INSERT.

  Mbrojtja: shtim i trigger-it BEFORE UPDATE qe ndalon ndryshimet ne
  loyalty_points_redeemed pasi booking-u eshte krijuar. Vetëm super_admin lejohet.

  Ndryshime te admin-it lejohen permes RPC adjust_loyalty_redemption() qe ben
  rikalkulim atomik nga loyalty_transactions (jo direkt nga UPDATE).
*/

CREATE OR REPLACE FUNCTION prevent_loyalty_redeemed_tamper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean;
BEGIN
  -- Lejo nese loyalty_points_redeemed nuk ka ndryshuar.
  IF NEW.loyalty_points_redeemed = OLD.loyalty_points_redeemed THEN
    RETURN NEW;
  END IF;

  -- Vetëm super_admin lejohet ta modifikoje (psh manual adjustment).
  v_is_super_admin := COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );

  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'loyalty_points_redeemed is immutable after booking creation. Use loyalty_transactions for adjustments.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_prevent_loyalty_tamper ON bookings;
CREATE TRIGGER trg_bookings_prevent_loyalty_tamper
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_loyalty_redeemed_tamper();

COMMENT ON FUNCTION prevent_loyalty_redeemed_tamper() IS
  'Audit fix: ndalon company_admin nga UPDATE direct i loyalty_points_redeemed. Vetëm super_admin lejohet.';
