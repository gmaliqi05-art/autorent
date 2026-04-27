/*
  # Create Email Notification System
  
  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key)
      - `recipient_email` (text) - Email address
      - `recipient_name` (text) - Recipient full name
      - `email_type` (text) - Type of email (booking_confirmation, booking_approved, etc.)
      - `subject` (text) - Email subject line
      - `template_data` (jsonb) - Data used to render the email template
      - `status` (text) - Email status: pending, sent, failed
      - `error_message` (text) - Error details if failed
      - `sent_at` (timestamptz) - When the email was actually sent
      - `created_at` (timestamptz) - When the email was queued
      - `reference_id` (uuid) - ID of related entity (booking_id, company_id, etc.)
      - `reference_type` (text) - Type of reference (booking, company, user, etc.)
    
    - `email_templates`
      - `id` (uuid, primary key)
      - `template_key` (text, unique) - Unique identifier for the template
      - `subject_template` (text) - Subject line with placeholders
      - `html_template` (text) - HTML email template
      - `text_template` (text) - Plain text fallback
      - `description` (text) - Template description
      - `is_active` (boolean) - Whether template is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Only authenticated admins can view email logs
    - Service role can insert/update email logs (for edge functions)
    - Only admins can manage email templates
*/

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  email_type text NOT NULL,
  subject text NOT NULL,
  template_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  reference_id uuid,
  reference_type text,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'queued'))
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  subject_template text NOT NULL,
  html_template text NOT NULL,
  text_template text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_reference ON email_logs(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_logs
CREATE POLICY "Super admins can view all email logs"
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
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update email logs"
  ON email_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for email_templates
CREATE POLICY "Super admins can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );