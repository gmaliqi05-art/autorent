/*
  # Fix admin app_metadata and create helper function

  1. Changes
    - Set role='super_admin' in app_metadata for admin user
    - Create is_super_admin() helper function that checks profiles table
*/

UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'admin@rentacar.com';

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );

$$;

;
