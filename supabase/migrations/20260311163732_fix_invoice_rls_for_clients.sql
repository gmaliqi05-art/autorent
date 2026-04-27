/*
  # Fix invoice RLS to allow clients to create draft invoices

  1. Security Changes
    - Add INSERT policy for clients to create invoices for their own bookings
    - This allows the booking flow to create a draft invoice automatically

  2. Important Notes
    - Clients can only insert invoices where client_id matches their auth.uid()
    - Company admins retain their existing insert capability
*/

CREATE POLICY "Clients can create own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());