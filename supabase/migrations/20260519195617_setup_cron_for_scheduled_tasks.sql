/*
  # Setup pg_cron për scheduled-tasks

  ## Çfarë bën
  - Aktivizon ekstensionet pg_cron + pg_net (nevojiten për thirrje HTTP)
  - Shton kolonën pickup_reminder_sent_at në bookings (që të mos dërgohet email dy herë)
  - Krijon cron job që çdo 15 min thërret edge function scheduled-tasks

  ## Sigurinë
  - Edge function verifikon header X-Cron-Secret
  - Vendos `vault.cron_secret` me SQL para deploy-it
  - Funksioni vault.decrypted_secrets vetëm super_admin e lexon
*/

-- Aktivizo extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Shto kolonën për të mos dërguar 2 herë kujtesën
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='pickup_reminder_sent_at'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN pickup_reminder_sent_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_pickup_reminder_pending
  ON public.bookings(pickup_date)
  WHERE status = 'confirmed' AND pickup_reminder_sent_at IS NULL;

/*
  ## Cron setup (komentuar)
  Para se ta aktivizosh kete cron, beje keto hapa manual ne Supabase Dashboard:

  1. Project Settings > Vault > Add new secret:
       Name: cron_secret
       Value: <gjenero nje string random te gjate, p.sh. permes `openssl rand -hex 32`>

  2. Project Settings > Edge Functions > Secrets > shto:
       CRON_SECRET = <i njejti value qe vendose ne Vault>

  3. Pastaj ekzekuto ne SQL Editor:

      SELECT cron.schedule(
        'scheduled-tasks-every-15min',
        '0,15,30,45 * * * *',
        $cron$
        SELECT net.http_post(
          url := 'https://<project-ref>.supabase.co/functions/v1/scheduled-tasks',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
          ),
          body := '{}'::jsonb
        );
        $cron$
      );

  4. Per ta hequr nje cron job:
       SELECT cron.unschedule('scheduled-tasks-every-15min');

  5. Per te pare cron jobs aktive:
       SELECT * FROM cron.job;
       SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
*/
