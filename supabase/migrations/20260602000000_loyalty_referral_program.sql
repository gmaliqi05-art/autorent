/*
  # Programi i besnikërisë + referimet

  Sisten i thjeshte points-based:
  - Useri merr 1 point per cdo €1 te shpenzuar ne booking 'completed'
  - Useri merr 100 bonus points kur dikush e referon dhe ai bën booking-un e parë
  - Useri qe është referuar merr 50 welcome points pas booking-ut të parë
  - Points mund të redempt-ohen si discount (1 point = €0.10) ne checkout (UI vije me vone)

  Schema:
  - profiles += referral_code (unique, generated auto)
  - profiles += referred_by uuid (kush e ka referuar)
  - loyalty_transactions: ledger of all earn/spend events
  - referrals: tracking referrals (one row per (referrer, referee) pair)
  - VIEW user_loyalty_balance: aggregated balance per user

  Triggers:
  - assign_referral_code: BEFORE INSERT profiles → set referral_code
  - award_booking_points: AFTER UPDATE bookings → kur status=completed
  - process_referral_reward: AFTER UPDATE bookings → kur user referee bën booking-un e parë completed
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON profiles(referred_by) WHERE referred_by IS NOT NULL;

-- Generim i kodit te referimit nga UUID — 8 chars hex, lowercase, prefiks 'RK'.
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN 'RK' || upper(substring(replace(p_user_id::text, '-', '') from 1 for 6));
END;
$$;

CREATE OR REPLACE FUNCTION assign_referral_code_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_assign_referral_code ON profiles;
CREATE TRIGGER trg_profiles_assign_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_referral_code_trigger();

-- Backfill per profile-t ekzistuese qe nuk kane kod.
UPDATE profiles
  SET referral_code = generate_referral_code(id)
  WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('booking_earned', 'referral_bonus', 'welcome_bonus', 'redeemed', 'admin_adjustment', 'expired')),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_created
  ON loyalty_transactions(user_id, created_at DESC);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users view own loyalty transactions"
  ON loyalty_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin inserts loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Super admin inserts loyalty transactions"
  ON loyalty_transactions FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded', 'cancelled')),
  first_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  reward_points integer DEFAULT 0,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referee_id),
  CHECK (referrer_id <> referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_referee
  ON referrals(referee_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own referrals" ON referrals;
CREATE POLICY "Users view own referrals"
  ON referrals FOR SELECT TO authenticated
  USING (
    referrer_id = auth.uid()
    OR referee_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- VIEW: balanca aktuale e useritr (sum të të gjitha transaksioneve)
CREATE OR REPLACE VIEW user_loyalty_balance
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  COALESCE(SUM(lt.points), 0)::integer AS total_points,
  COALESCE(SUM(lt.points) FILTER (WHERE lt.points > 0), 0)::integer AS total_earned,
  COALESCE(ABS(SUM(lt.points) FILTER (WHERE lt.points < 0)), 0)::integer AS total_spent,
  COUNT(lt.id) FILTER (WHERE lt.points > 0)::integer AS earn_count,
  MAX(lt.created_at) AS last_activity_at
FROM profiles p
LEFT JOIN loyalty_transactions lt ON lt.user_id = p.id
GROUP BY p.id;

-- Trigger: jep points kur booking transitions ne 'completed'.
-- Atomic & idempotent — kontrollon nese kane ne tabele transaksion 'booking_earned' per booking-un.
CREATE OR REPLACE FUNCTION award_booking_points_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_awarded boolean;
  v_points integer;
  v_referral referrals;
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM loyalty_transactions
    WHERE booking_id = NEW.id AND type = 'booking_earned'
  ) INTO v_already_awarded;

  IF v_already_awarded THEN
    RETURN NEW;
  END IF;

  -- 1 point per €1 (rrumbullakimi poshte)
  v_points := floor(COALESCE(NEW.total_price, 0))::integer;

  IF v_points > 0 THEN
    INSERT INTO loyalty_transactions (user_id, points, type, booking_id, description)
    VALUES (NEW.client_id, v_points, 'booking_earned', NEW.id,
            'Pikë te fituara nga booking #' || substring(NEW.id::text from 1 for 8));
  END IF;

  -- Process referral reward nese ky eshte booking-u i pare i useritr referee.
  SELECT r.* INTO v_referral
  FROM referrals r
  WHERE r.referee_id = NEW.client_id
    AND r.status = 'pending';

  IF FOUND THEN
    -- Referrer merr 100 pikë, referee merr 50 pikë welcome.
    INSERT INTO loyalty_transactions (user_id, points, type, booking_id, description)
    VALUES
      (v_referral.referrer_id, 100, 'referral_bonus', NEW.id,
       'Bonus per referim — useri kreu booking-un e parë'),
      (v_referral.referee_id, 50, 'welcome_bonus', NEW.id,
       'Bonus mirëseardhjeje nga programi i referimit');

    UPDATE referrals
      SET status = 'rewarded',
          first_booking_id = NEW.id,
          reward_points = 100,
          rewarded_at = now()
      WHERE id = v_referral.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_award_loyalty ON bookings;
CREATE TRIGGER trg_bookings_award_loyalty
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_booking_points_trigger();

-- RPC: apliko nje kod referimi (vetëm njëherë, vetëm para booking-ut të parë).
CREATE OR REPLACE FUNCTION apply_referral_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_referrer profiles;
  v_existing_bookings integer;
  v_already_referred boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_required');
  END IF;

  -- Mos pranoji kodin nese useri ka tashmë booking-e (rrezikon abuzim).
  SELECT COUNT(*) INTO v_existing_bookings
    FROM bookings
    WHERE client_id = v_user_id
      AND status IN ('completed', 'active', 'confirmed');

  IF v_existing_bookings > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'has_prior_bookings');
  END IF;

  -- Mos lejo te ndryshohet referuesi pasi është caktuar tashmë.
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_user_id AND referred_by IS NOT NULL
  ) INTO v_already_referred;

  IF v_already_referred THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_referred');
  END IF;

  -- Gjej referuesin
  SELECT * INTO v_referrer
    FROM profiles
    WHERE referral_code = upper(trim(p_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  IF v_referrer.id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_referral');
  END IF;

  -- Set referred_by ne profil
  UPDATE profiles SET referred_by = v_referrer.id WHERE id = v_user_id;

  -- Krijo referral-in (use ON CONFLICT per safety)
  INSERT INTO referrals (referrer_id, referee_id, status)
  VALUES (v_referrer.id, v_user_id, 'pending')
  ON CONFLICT (referrer_id, referee_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'referrer_name', v_referrer.full_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION apply_referral_code(text) TO authenticated;

COMMENT ON VIEW user_loyalty_balance IS 'Aggregated loyalty balance per user. security_invoker so RLS on loyalty_transactions applies.';
COMMENT ON FUNCTION apply_referral_code(text) IS 'Apply a referral code to current user. Validates: not own code, no prior bookings, not already referred.';
