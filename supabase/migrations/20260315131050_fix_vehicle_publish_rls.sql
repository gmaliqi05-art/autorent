/*
  # Fix Vehicle Publish RLS Policies

  ## Problem
  The "Company admins manage own vehicles" FOR ALL policy may conflict with
  the missing explicit UPDATE policy for company owners, preventing them from
  toggling is_published on their vehicles.

  ## Changes
  - Drop the broad FOR ALL policy and replace with explicit per-command policies
  - This ensures company owners can INSERT, UPDATE, DELETE their own vehicles
  - Keeps SELECT policies intact
*/

DROP POLICY IF EXISTS "Company admins manage own vehicles" ON vehicles;

CREATE POLICY "Company owners can insert own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can update own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can delete own vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicles.company_id
        AND companies.owner_id = auth.uid()
    )
  );
