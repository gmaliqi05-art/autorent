/*
  # Externalizo project URL ne push trigger

  Trigger-i `notify_push_on_notification_insert` aktualisht ka hard-koduar
  URL-en e projektit supabase (`anpspyrowaukdriwsdbs.supabase.co`). Kjo
  thyen:
   - Staging/dev environments (trigger thirr prod)
   - Branch databases ne Supabase
   - Test repliket lokale

  Ky migration:
   1. Cregjistron secret-in `project_url` ne Vault (idempotent).
   2. Update-on trigger function-in te lexoje URL-en nga Vault me fallback
      ne vleren e meparshme — backward compatible per prod aktual.

  Operatori duhet te vendose `project_url` ne Vault per cdo environment te ri:
    SELECT vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'project_url'),
      'https://<project-ref>.supabase.co'
    );
*/

-- 1. Sigurohu qe ekziston secret-i ne Vault (idempotent)
DO $$
DECLARE
  v_existing_id uuid;
BEGIN
  SELECT id INTO v_existing_id FROM vault.secrets WHERE name = 'project_url';
  IF v_existing_id IS NULL THEN
    -- Insert placeholder; operatori duhet ta perditesoje per cdo environment.
    PERFORM vault.create_secret(
      'https://anpspyrowaukdriwsdbs.supabase.co',
      'project_url',
      'Supabase project URL i perdorur nga DB trigger-at qe therrasin edge functions. Perditesoje per cdo environment.'
    );
  END IF;
END $$;

-- 2. Update trigger function: lexo URL-en nga Vault, fallback ne vleren e vjeter
CREATE OR REPLACE FUNCTION notify_push_on_notification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_catalog
AS $$
DECLARE
  v_push_secret text;
  v_target_url text;
  v_project_url text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Lexo URL nga Vault; fallback ne hardcode per backward compat
  SELECT decrypted_secret INTO v_project_url
  FROM vault.decrypted_secrets WHERE name = 'project_url';

  IF v_project_url IS NULL OR v_project_url = '' THEN
    v_project_url := 'https://anpspyrowaukdriwsdbs.supabase.co';
    RAISE WARNING 'project_url missing in vault; using fallback';
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
