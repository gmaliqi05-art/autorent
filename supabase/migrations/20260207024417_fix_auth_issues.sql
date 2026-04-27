/*
  # Fix authentication issues

  1. Changes
    - Fix `handle_new_user` function to have explicit search_path (security best practice)
    - Replace recursive "Super admin" RLS policy on profiles table that was causing infinite recursion
    - Use `raw_app_meta_data` based approach for admin policy instead of querying profiles table recursively
  
  2. Security
    - Super admin check now uses auth.jwt() instead of recursive profiles query
    - Function search_path explicitly set to prevent search_path attacks
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Super admin mund te shikoje te gjitha profilet" ON profiles;

CREATE POLICY "Super admin mund te shikoje te gjitha profilet"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
