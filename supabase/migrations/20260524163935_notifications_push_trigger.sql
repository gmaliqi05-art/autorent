/*
  # Auto-push trigger per notifications

  Kur insertohet nje rresht ne `notifications`, therrasim automatikisht
  edge function-in `send-push-notification` nepermjet pg_net (fire-and-forget).
  Funksioni vetem dergon push nese useri ka push_enabled=true dhe ka
  subscription aktiv. Asnje ndryshim s'duhet ne frontend ose ne ven
  qe therrasin createNotification.

  Auth midis trigger-it dhe edge function-it behet me nje secret te ri
  `push_secret` te ruajtur ne Vault. Edge function e validon permes
  RPC-se `is_push_secret_valid` (i njejti pattern si `cron_secret`).
*/

-- 1. Krijoj push_secret ne Vault nese mungon
DO $$
DECLARE
  v_secret text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'push_secret') THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    PERFORM vault.create_secret(v_secret, 'push_secret', 'Secret per autentikim te trigger-it qe therret send-push-notification');
  END IF;
END $$;

-- 2. RPC per edge function (validates secret kunder Vault)
CREATE OR REPLACE FUNCTION is_push_secret_valid(p_secret text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'push_secret' AND decrypted_secret = p_secret
  );
$$;

REVOKE EXECUTE ON FUNCTION is_push_secret_valid(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_push_secret_valid(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION is_push_secret_valid(text) TO service_role;

-- 3. Trigger function
CREATE OR REPLACE FUNCTION notify_push_on_notification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_catalog
AS $$
DECLARE
  v_push_secret text;
  v_target_url text;
  v_project_url text := 'https://anpspyrowaukdriwsdbs.supabase.co';
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_push_secret
  FROM vault.decrypted_secrets WHERE name = 'push_secret';

  IF v_push_secret IS NULL THEN
    RAISE WARNING 'push_secret missing in vault; skipping push notify';
    RETURN NEW;
  END IF;

  v_target_url := CASE
    WHEN NEW.reference_type = 'booking' THEN '/dashboard/bookings'
    WHEN NEW.type LIKE 'booking_%' THEN '/dashboard/bookings'
    WHEN NEW.type LIKE 'payment_%' THEN '/dashboard/bookings'
    WHEN NEW.type LIKE 'pickup_%' THEN '/dashboard/bookings'
    ELSE '/dashboard'
  END;

  PERFORM net.http_post(
    url := v_project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_push_secret
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'body', NEW.message,
      'url', v_target_url,
      'tag', NEW.type,
      'data', jsonb_build_object(
        'reference_id', NEW.reference_id,
        'reference_type', NEW.reference_type,
        'type', NEW.type,
        'notification_id', NEW.id
      )
    ),
    timeout_milliseconds := 3000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'push notify failed for notification %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION notify_push_on_notification_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION notify_push_on_notification_insert() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_push ON notifications;
CREATE TRIGGER trg_notify_push
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_push_on_notification_insert();
