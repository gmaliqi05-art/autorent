/*
  # Fix vehicle_categories RLS to match super_admin role

  Problem
    - Policies were created against `profiles.role = 'admin'` but the actual
      admin role in this project is `super_admin`. As a result, admin writes
      to `vehicle_categories` were silently rejected by RLS, causing the UI
      to optimistically show the change and then revert on the next fetch.

  Fix
    - Drop the four `admin` policies and recreate them against `super_admin`.
    - Public read of active rows is unchanged.
*/

DROP POLICY IF EXISTS "Admin can read all categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Admin can insert categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Admin can update categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Admin can delete categories" ON vehicle_categories;

CREATE POLICY "Super admin can read all categories"
  ON vehicle_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can insert categories"
  ON vehicle_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can update categories"
  ON vehicle_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can delete categories"
  ON vehicle_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );
