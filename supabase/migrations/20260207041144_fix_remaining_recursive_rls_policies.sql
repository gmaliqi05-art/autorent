/*
  # Fix remaining recursive RLS policies

  1. Changes
    - Replace all remaining policies that query `profiles` table for super_admin checks
    - Use `auth.jwt() -> 'app_metadata' ->> 'role'` instead to prevent recursion
    - Affected tables: bookings, vehicles, subscription_plans

  2. Tables modified
    - bookings: SELECT and UPDATE policies
    - vehicles: SELECT policy
    - subscription_plans: DELETE, INSERT, UPDATE policies (old recursive versions)

  3. Security
    - Same access control, just using JWT claims instead of profiles table subqueries
    - Prevents potential infinite recursion during RLS evaluation
*/

-- Fix bookings SELECT policy
DROP POLICY IF EXISTS "Klienti shikon rezervimet e veta" ON bookings;
CREATE POLICY "Klienti shikon rezervimet e veta"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = bookings.company_id
      AND companies.owner_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Fix bookings UPDATE policy
DROP POLICY IF EXISTS "Perditesimi i rezervimeve" ON bookings;
CREATE POLICY "Perditesimi i rezervimeve"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = bookings.company_id
      AND companies.owner_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = bookings.company_id
      AND companies.owner_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Fix vehicles SELECT policy
DROP POLICY IF EXISTS "Automjetet e publikuara jane publike" ON vehicles;
CREATE POLICY "Automjetet e publikuara jane publike"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (
    (is_published = true AND status = 'active')
    OR EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = vehicles.company_id
      AND companies.owner_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Remove old recursive subscription_plans policies
DROP POLICY IF EXISTS "Super admin fshin planet" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin menaxhon planet" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin perditeson planet" ON subscription_plans;
