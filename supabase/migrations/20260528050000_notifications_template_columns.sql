/*
  # Push notifications i18n: shto template_key + template_vars ne notifications

  Aktualisht createNotification ruan title/message te resolved-ueme ne gjuhen
  e sender-it ne kohen e thirrjes. Per push, kjo do te thote qe nje company_admin
  shqiptar qe aprovon nje rezervim, ben qe klienti gjerman te marre push ne
  shqip — UX i keq.

  Ky migration shton:
   - notifications.template_key (text, nullable) — identifikues unik per nje
     template push notification (psh "booking_approved", "booking_rejected").
   - notifications.template_vars (jsonb, default '{}') — variabla per render
     (psh { vehicleName: "BMW X3" }).

  Te dyja jane NULLABLE — call sites ekzistuese vazhdojne te funksionojne pa
  ndryshim. Edge function-i send-push-notification do te check-oje kete fushe
  para se te dergoje push; nese ka, fetch-on profiles.preferred_language te
  recipient-it dhe rendon ne ate gjuhe. Pa template_key, perdor title/message
  e ruajtur (backward compat).

  Ne nje commit te dyte ne kete branch, trigger-i notify_push_on_notification_insert
  perditesohet per te kaluar keto fields ne payload-in e thirrjes.
*/

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS template_vars jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_template_key
  ON public.notifications(template_key)
  WHERE template_key IS NOT NULL;

COMMENT ON COLUMN public.notifications.template_key IS
  'Identifikues per push notification template (psh booking_approved). Kur set, edge function fetch-on profiles.preferred_language dhe rendon title/body ne ate gjuhe — push ne gjuhen e recipient-it, jo te sender-it.';

COMMENT ON COLUMN public.notifications.template_vars IS
  'JSON me variabla per render (psh {vehicleName, companyName}). Perdoret me template_key.';

-- Update trigger per te kaluar template_key + template_vars ne payload
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
      'template_key', NEW.template_key,
      'template_vars', NEW.template_vars,
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
