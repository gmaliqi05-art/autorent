/*
  # Points expiration — pikat skadojne pas 12 muajsh

  Standard industri: pikat e fituar skadojne pas 12 muajsh nga data e fitimit
  nese nuk perdoren. Kjo motivon perdorimin dhe ben kontabilitetin me te paster.

  Logjika:
  - Vetëm pikat e tipave 'booking_earned', 'referral_bonus', 'welcome_bonus' skadojne
  - Pikat 'admin_adjustment' nuk skadojne (sjellje admini eshte explicit)
  - Pikat 'redeemed' jane negative — s'kane nevoje per expiration
  - 'expired' jane vete trace-i i expirimit

  Implementim:
  - Kolone expires_at timestamptz NULL ne loyalty_transactions
  - Trigger BEFORE INSERT qe vendos expires_at = created_at + 12 months
    per tipat qe skadojne
  - Funksion expire_loyalty_points() qe processon ekspirimet ne batch:
    * Gjen tx me expires_at < now() qe s'kane nje 'expired' korresponduese
    * INSERT 'expired' negative tx me te njejten vlere
    * Per audit: 'expired' description permban tx_id origjinal
  - pg_cron schedule: çdo ditë në 02:00 UTC

  Backfill:
  - Cdo tx ekzistuese me tipat qe skadojne merr expires_at = created_at + 12 mo
*/

ALTER TABLE loyalty_transactions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_expires
  ON loyalty_transactions(expires_at)
  WHERE expires_at IS NOT NULL;

-- Trigger BEFORE INSERT: cakto expires_at automatik per tipat qe skadojne.
CREATE OR REPLACE FUNCTION set_loyalty_expires_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expires_at IS NULL
     AND NEW.points > 0
     AND NEW.type IN ('booking_earned', 'referral_bonus', 'welcome_bonus')
  THEN
    NEW.expires_at := COALESCE(NEW.created_at, now()) + INTERVAL '12 months';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_tx_set_expires ON loyalty_transactions;
CREATE TRIGGER trg_loyalty_tx_set_expires
  BEFORE INSERT ON loyalty_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_loyalty_expires_at();

-- Backfill për tx ekzistuese pa expires_at.
UPDATE loyalty_transactions
  SET expires_at = created_at + INTERVAL '12 months'
  WHERE expires_at IS NULL
    AND points > 0
    AND type IN ('booking_earned', 'referral_bonus', 'welcome_bonus');

-- Funksion qe processon ekspirimet — i thirret nga pg_cron.
CREATE OR REPLACE FUNCTION expire_loyalty_points()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed_count integer := 0;
  v_total_expired integer := 0;
  rec record;
BEGIN
  FOR rec IN
    SELECT lt.id, lt.user_id, lt.points, lt.type
    FROM loyalty_transactions lt
    WHERE lt.expires_at IS NOT NULL
      AND lt.expires_at < now()
      AND lt.points > 0
      AND NOT EXISTS (
        SELECT 1 FROM loyalty_transactions exp
        WHERE exp.user_id = lt.user_id
          AND exp.type = 'expired'
          AND exp.description LIKE 'Skadim tx-id ' || lt.id::text || '%'
      )
  LOOP
    INSERT INTO loyalty_transactions (user_id, points, type, description, expires_at)
    VALUES (
      rec.user_id,
      -rec.points,
      'expired',
      'Skadim tx-id ' || rec.id::text || ' (' || rec.type || ')',
      NULL  -- 'expired' tx s'kane expires_at te tyret
    );
    v_processed_count := v_processed_count + 1;
    v_total_expired := v_total_expired + rec.points;
  END LOOP;

  RETURN jsonb_build_object(
    'processed_count', v_processed_count,
    'total_points_expired', v_total_expired,
    'run_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION expire_loyalty_points() TO postgres;

COMMENT ON FUNCTION expire_loyalty_points() IS
  'Cron job: skadon pikat e fituar pas 12 muajsh. Insert-on tx negative me type=expired.';

-- pg_cron schedule (Supabase mbeshtet pg_cron). Ekzekutohet çdo ditë në 02:00 UTC.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule previous version nese ekziston
    PERFORM cron.unschedule('expire-loyalty-points-daily')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-loyalty-points-daily');
    PERFORM cron.schedule(
      'expire-loyalty-points-daily',
      '0 2 * * *',
      $cron$ SELECT expire_loyalty_points(); $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron jo i instaluar — funksioni expire_loyalty_points() duhet te thirret manualisht ose nga aplikacioni.';
  END IF;
END $$;

-- VIEW per perdoruesin: pikat qe skadojne shpejt (next 30 dite).
CREATE OR REPLACE VIEW user_loyalty_expiring_soon
WITH (security_invoker = true)
AS
SELECT
  user_id,
  SUM(points) FILTER (WHERE expires_at <= now() + INTERVAL '30 days')::integer AS expiring_in_30d,
  SUM(points) FILTER (WHERE expires_at <= now() + INTERVAL '90 days')::integer AS expiring_in_90d,
  MIN(expires_at) FILTER (WHERE expires_at > now()) AS next_expiry_date
FROM loyalty_transactions
WHERE points > 0
  AND expires_at IS NOT NULL
  AND expires_at > now()
  AND NOT EXISTS (
    SELECT 1 FROM loyalty_transactions exp
    WHERE exp.user_id = loyalty_transactions.user_id
      AND exp.type = 'expired'
      AND exp.description LIKE 'Skadim tx-id ' || loyalty_transactions.id::text || '%'
  )
GROUP BY user_id;

COMMENT ON VIEW user_loyalty_expiring_soon IS
  'Per UI: tregon sa pikë do te skadojnë ne 30/90 ditet e ardhshme + data e ardhshme e skadimit.';
