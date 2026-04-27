/*
  # Fix email_templates read policy for authenticated users and service role

  The send-email edge function (service_role) needs to read templates.
  Also authenticated users need to read templates for the admin UI.
  We add a policy so authenticated users can SELECT templates.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'email_templates' AND policyname = 'Authenticated can read email templates'
  ) THEN
    CREATE POLICY "Authenticated can read email templates"
      ON email_templates FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
