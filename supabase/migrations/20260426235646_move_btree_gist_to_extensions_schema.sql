/*
  # Move btree_gist extension out of public schema

  ## Summary
  Moves the btree_gist extension from the public schema to the dedicated
  extensions schema, following Supabase security best practices.

  ## Changes
  1. Creates extensions schema if it does not exist
  2. Grants USAGE on extensions schema to authenticated and anon roles
  3. Moves btree_gist extension into the extensions schema

  ## Notes
  No data is destroyed. All existing GIST/EXCLUDE constraints that rely
  on btree_gist continue to function because the operator classes are
  resolved by OID, not by schema name.
*/

CREATE SCHEMA IF NOT EXISTS extensions;

GRANT USAGE ON SCHEMA extensions TO authenticated, anon, service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'btree_gist' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION btree_gist SET SCHEMA extensions';

  END IF;

END $$;

;
