/*
  # Fix recursive RLS policies across tables

  1. Changes
    - Replace recursive profiles table lookups in companies, bookings, and reviews policies
    - Use auth.jwt() -> 'app_metadata' for super_admin checks instead of querying profiles
    - This prevents potential infinite recursion and improves query performance

  2. Tables affected
    - companies: SELECT, UPDATE, DELETE policies for super_admin check
*/

DROP POLICY IF EXISTS "Kompanite e aprovuara jane publike" ON companies;
CREATE POLICY "Kompanite e aprovuara jane publike"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR owner_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

DROP POLICY IF EXISTS "Pronaret perditesojne kompanine e tyre" ON companies;
CREATE POLICY "Pronaret perditesojne kompanine e tyre"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

DROP POLICY IF EXISTS "Super admin fshin kompanite" ON companies;
CREATE POLICY "Super admin fshin kompanite"
  ON companies
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
