/*
  # Create Test Users

  Creates three test users for all roles:
  1. Super Admin - admin@rentacar.com
  2. Company Admin - company@rentacar.com
  3. Client - client@rentacar.com

  Each user is created in auth.users and their profile role is updated accordingly.
*/

DO $$
DECLARE
  admin_uid uuid := gen_random_uuid();
  company_uid uuid := gen_random_uuid();
  client_uid uuid := gen_random_uuid();
BEGIN
  -- Create Super Admin user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    admin_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@rentacar.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Super Admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    now(),
    now(),
    '',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_uid,
    admin_uid::text,
    jsonb_build_object('sub', admin_uid::text, 'email', 'admin@rentacar.com'),
    'email',
    now(),
    now(),
    now()
  );

  -- Create Company Admin user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    company_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'company@rentacar.com',
    crypt('Company123!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Company Admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    now(),
    now(),
    '',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    company_uid,
    company_uid::text,
    jsonb_build_object('sub', company_uid::text, 'email', 'company@rentacar.com'),
    'email',
    now(),
    now(),
    now()
  );

  -- Create Client user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  ) VALUES (
    client_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'client@rentacar.com',
    crypt('Client123!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Test Client'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    now(),
    now(),
    '',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    client_uid,
    client_uid::text,
    jsonb_build_object('sub', client_uid::text, 'email', 'client@rentacar.com'),
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
