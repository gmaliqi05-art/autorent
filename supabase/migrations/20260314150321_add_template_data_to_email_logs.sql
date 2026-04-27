/*
  # Add template_data column to email_logs

  The edge function send-email inserts `template_data` (JSONB) into email_logs.
  This column was missing from the initial creation.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_logs' AND column_name = 'template_data'
  ) THEN
    ALTER TABLE email_logs ADD COLUMN template_data jsonb;
  END IF;
END $$;
