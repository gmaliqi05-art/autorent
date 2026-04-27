/*
  # Create invoices and notifications tables

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `invoice_number` (text, unique) - e.g., INV-2026-00001
      - `booking_id` (uuid, FK to bookings)
      - `company_id` (uuid, FK to companies)
      - `client_id` (uuid, FK to auth.users)
      - `client_name` (text)
      - `client_email` (text)
      - `client_phone` (text)
      - `company_name` (text)
      - `company_email` (text)
      - `company_phone` (text)
      - `vehicle_name` (text)
      - `pickup_date` (date)
      - `return_date` (date)
      - `total_days` (integer)
      - `price_per_day` (numeric)
      - `subtotal` (numeric)
      - `deposit_amount` (numeric)
      - `total_price` (numeric)
      - `payment_method` (text)
      - `payment_status` (text)
      - `status` (text) - draft, issued, paid, cancelled
      - `issued_at` (timestamptz)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)

    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `title` (text)
      - `message` (text)
      - `type` (text) - booking_created, booking_approved, booking_rejected, etc.
      - `reference_id` (uuid) - booking_id or invoice_id
      - `reference_type` (text) - booking, invoice
      - `is_read` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Clients can view their own invoices and notifications
    - Company admins can view invoices for their company
    - Company admins can create invoices for their bookings

  3. Indexes
    - invoices: booking_id, client_id, company_id
    - notifications: user_id, is_read
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  booking_id uuid NOT NULL REFERENCES bookings(id),
  company_id uuid NOT NULL REFERENCES companies(id),
  client_id uuid NOT NULL,
  client_name text NOT NULL DEFAULT '',
  client_email text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  company_email text NOT NULL DEFAULT '',
  company_phone text NOT NULL DEFAULT '',
  vehicle_name text NOT NULL DEFAULT '',
  pickup_date date NOT NULL,
  return_date date NOT NULL,
  total_days integer NOT NULL DEFAULT 0,
  price_per_day numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  deposit_amount numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT '',
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'draft',
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Company admins can view company invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can insert invoices for own company"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can update own company invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  reference_id uuid,
  reference_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Create invoice number sequence function
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text AS $$
DECLARE
  year_str text;
  next_num integer;
  inv_number text;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS integer)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_str || '-%';
  
  inv_number := 'INV-' || year_str || '-' || LPAD(next_num::text, 5, '0');
  RETURN inv_number;
END;
$$ LANGUAGE plpgsql;