/*
  # Create email_logs table

  ## Purpose
  This migration creates the email_logs table that tracks all emails sent by the platform.
  The AdminEmails page queries this table to show email history.

  ## New Tables
  - `email_logs`
    - `id` (uuid, primary key)
    - `recipient_email` (text) - email address of recipient
    - `recipient_name` (text) - full name of recipient
    - `email_type` (text) - type of email (booking_confirmation, welcome_client, etc.)
    - `subject` (text) - email subject line
    - `status` (text) - sent, failed, pending, queued
    - `error_message` (text, nullable) - error details if failed
    - `sent_at` (timestamptz, nullable) - when the email was sent
    - `reference_type` (text, nullable) - e.g. 'booking', 'company'
    - `reference_id` (text, nullable) - ID of the related record
    - `created_at` (timestamptz) - when the log was created

  ## Security
  - RLS enabled
  - Only super_admin role can read email logs
  - Edge functions (service_role) can insert logs
*/

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  email_type text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  reference_type text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
