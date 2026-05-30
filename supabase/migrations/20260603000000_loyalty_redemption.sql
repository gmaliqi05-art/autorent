/*
  # Loyalty points redemption — apliko pikët si discount ne booking

  Zgjeron sistemin e loyalty-t te lëshuar ne 20260602000000:
  - Shton bookings.loyalty_points_redeemed (numri i pikave te perdorur)
  - Trigger AFTER INSERT bookings qe atomically:
    * Validon useri ka balance >= loyalty_points_redeemed
    * INSERT loyalty_transactions me type='redeemed' (negative)
    * Nese balance s'mjafton: RAISE EXCEPTION → booking rolls back
  - Trigger AFTER UPDATE bookings qe rikthen pikat nese statusi behet 'cancelled'
  - RPC get_max_redeemable_points(p_booking_total numeric):
    * Kthen pikat maksimale qe useri mund te perdore per nje total (1 pikë = €0.10)
    * Limit: total_price - 0.50 (mos lejo booking 0€), max balance e useritr

  1 pikë = €0.10 vlerë. P.sh. nese useri ka 1000 pikë dhe booking €50:
  - Max redeemable = min(1000, 500) = 500 pikë
  - Discount = €50, total e ri = €0
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS loyalty_points_redeemed integer NOT NULL DEFAULT 0
  CHECK (loyalty_points_redeemed >= 0);

CREATE INDEX IF NOT EXISTS idx_bookings_loyalty_redeemed
  ON bookings(client_id, loyalty_points_redeemed)
  WHERE loyalty_points_redeemed > 0;

-- Trigger: ne INSERT booking me pikë, validoji balance + krijo redemption tx.
CREATE OR REPLACE FUNCTION redeem_loyalty_on_booking_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  IF NEW.loyalty_points_redeemed <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(points), 0)::integer INTO v_balance
    FROM loyalty_transactions
    WHERE user_id = NEW.client_id;

  IF v_balance < NEW.loyalty_points_redeemed THEN
    RAISE EXCEPTION 'Insufficient loyalty points balance: % (need %)',
      v_balance, NEW.loyalty_points_redeemed
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO loyalty_transactions (user_id, points, type, booking_id, description)
  VALUES (
    NEW.client_id,
    -NEW.loyalty_points_redeemed,
    'redeemed',
    NEW.id,
    'Përdorur ne booking #' || substring(NEW.id::text from 1 for 8)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_redeem_loyalty ON bookings;
CREATE TRIGGER trg_bookings_redeem_loyalty
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION redeem_loyalty_on_booking_insert();

-- Trigger: nese booking cancellohet dhe ka pikë te redeem-uara, riktheji.
CREATE OR REPLACE FUNCTION refund_loyalty_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_refunded boolean;
BEGIN
  IF NEW.status <> 'cancelled' OR OLD.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  IF NEW.loyalty_points_redeemed <= 0 THEN
    RETURN NEW;
  END IF;

  -- Mbroni nga ri-rikthim (idempotency).
  SELECT EXISTS (
    SELECT 1 FROM loyalty_transactions
    WHERE booking_id = NEW.id
      AND type = 'admin_adjustment'
      AND description LIKE 'Rikthim per cancellim%'
  ) INTO v_already_refunded;

  IF v_already_refunded THEN
    RETURN NEW;
  END IF;

  INSERT INTO loyalty_transactions (user_id, points, type, booking_id, description)
  VALUES (
    NEW.client_id,
    NEW.loyalty_points_redeemed,
    'admin_adjustment',
    NEW.id,
    'Rikthim per cancellim booking #' || substring(NEW.id::text from 1 for 8)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_refund_loyalty_on_cancel ON bookings;
CREATE TRIGGER trg_bookings_refund_loyalty_on_cancel
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION refund_loyalty_on_cancel();

-- Helper RPC: kthen pikat maksimale qe useri mund te perdore per nje total.
CREATE OR REPLACE FUNCTION get_max_redeemable_points(p_booking_total numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_balance integer;
  v_max_for_total integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(points), 0)::integer INTO v_balance
    FROM loyalty_transactions
    WHERE user_id = v_user_id;

  -- Mos lejo booking te shkoje nen €0.50 (mbron Stripe min charge)
  v_max_for_total := GREATEST(0, FLOOR((p_booking_total - 0.50) * 10)::integer);

  RETURN LEAST(v_balance, v_max_for_total);
END;
$$;

GRANT EXECUTE ON FUNCTION get_max_redeemable_points(numeric) TO authenticated;

COMMENT ON FUNCTION get_max_redeemable_points(numeric) IS
  '1 pikë = €0.10. Kthen min(balance, floor((total-0.50)*10)). Mbron nga negative bookings.';
