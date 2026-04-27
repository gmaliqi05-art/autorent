/*
  # Recreate Test Users with Correct Auth Format

  Deletes old test users and recreates them with all required GoTrue fields
  so that login works properly.

  1. Users recreated:
    - admin@rentacar.com (super_admin) - Password: Admin123!
    - company@rentacar.com (company_admin) - Password: Company123!
    - client@rentacar.com (client) - Password: Client123!

  2. Notes:
    - All required GoTrue auth fields are populated
    - Identities are properly linked
    - Profiles are updated with correct roles
*/

-- First clean up old users
DO $$
DECLARE
  old_admin_id uuid;
  old_company_id uuid;
  old_client_id uuid;
BEGIN
  SELECT id INTO old_admin_id FROM auth.users WHERE email = 'admin@rentacar.com';
  SELECT id INTO old_company_id FROM auth.users WHERE email = 'company@rentacar.com';
  SELECT id INTO old_client_id FROM auth.users WHERE email = 'client@rentacar.com';

  IF old_admin_id IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = old_admin_id;
    DELETE FROM public.profiles WHERE id = old_admin_id;
    DELETE FROM auth.users WHERE id = old_admin_id;
  END IF;

  IF old_company_id IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = old_company_id;
    DELETE FROM public.profiles WHERE id = old_company_id;
    DELETE FROM auth.users WHERE id = old_company_id;
  END IF;

  IF old_client_id IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = old_client_id;
    DELETE FROM public.profiles WHERE id = old_client_id;
    DELETE FROM auth.users WHERE id = old_client_id;
  END IF;
END $$;

-- Now create users fresh with all GoTrue required fields
DO $$
DECLARE
  admin_uid uuid := gen_random_uuid();
  company_uid uuid := gen_random_uuid();
  client_uid uuid := gen_random_uuid();
BEGIN
  -- Super Admin
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    admin_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@rentacar.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Super Admin"}'::jsonb,
    false,
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    admin_uid,
    admin_uid::text,
    admin_uid,
    jsonb_build_object('sub', admin_uid::text, 'email', 'admin@rentacar.com', 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  );

  -- Company Admin
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    company_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'company@rentacar.com',
    crypt('Company123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Company Admin"}'::jsonb,
    false,
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    company_uid,
    company_uid::text,
    company_uid,
    jsonb_build_object('sub', company_uid::text, 'email', 'company@rentacar.com', 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  );

  -- Client
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    last_sign_in_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    client_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'client@rentacar.com',
    crypt('Client123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Test Client"}'::jsonb,
    false,
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    client_uid,
    client_uid::text,
    client_uid,
    jsonb_build_object('sub', client_uid::text, 'email', 'client@rentacar.com', 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  );

  -- Update profiles with correct roles
  UPDATE public.profiles SET role = 'super_admin', full_name = 'Super Admin', phone = '+355 69 123 4567' WHERE id = admin_uid;
  UPDATE public.profiles SET role = 'company_admin', full_name = 'Company Admin', phone = '+355 69 234 5678' WHERE id = company_uid;
  UPDATE public.profiles SET role = 'client', full_name = 'Test Client', phone = '+355 69 345 6789' WHERE id = client_uid;
END $$;
