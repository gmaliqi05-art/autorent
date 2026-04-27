/*
  # Fix Remaining Security Issues

  ## Changes

  1. **Consolidate Multiple Permissive Policies on Profiles**
     - Merge the two SELECT policies into one with OR condition
     - This eliminates the "multiple permissive policies" warning
     - Maintains the same security logic

  2. **Fix email_logs RLS Policies**
     - Change service role policies from `authenticated` to `service_role`
     - This ensures only edge functions with service role can insert/update logs
     - More secure and appropriate for the use case

  ## Note on Unused Indexes
  
  The "unused indexes" are NOT removed because:
  - They are essential for production performance
  - They will be used when there is real data and traffic
  - Indexes on foreign keys prevent slow joins
  - Indexes on filter columns (status, dates, category) speed up queries
  - Geographic indexes (city, country) enable location-based searches
  
  These indexes are currently unused because the database is new with minimal data.
*/

-- Fix multiple permissive policies on profiles table
-- Drop the two separate SELECT policies and create one combined policy
DROP POLICY IF EXISTS "Perdoruesit mund te lexojne profilin e tyre" ON profiles;
DROP POLICY IF EXISTS "Super admin mund te shikoje te gjitha profilet" ON profiles;

CREATE POLICY "Users and super admins can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (select auth.uid())
      AND p.role = 'super_admin'
    )
  );

-- Fix email_logs RLS policies
-- Change from authenticated to service_role for edge function access
DROP POLICY IF EXISTS "Service role can insert email logs" ON email_logs;
DROP POLICY IF EXISTS "Service role can update email logs" ON email_logs;

CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update email logs"
  ON email_logs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
