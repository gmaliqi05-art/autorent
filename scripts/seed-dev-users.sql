/*
  Seed dev users — JO PER PRODUCTION

  Krijon 3 demo users me passwords te dobet per zhvillim/testim.
  Ekzekutoji manualisht ne dev:

    psql -h <host> -U postgres -d postgres -f scripts/seed-dev-users.sql

  Ose nga Supabase SQL Editor (vetem ne dev project).

  Migration 20260528060000_remove_demo_users.sql i fshin keto users
  ne cdo deploy te ardhshem — kjo eshte e qellimshme per production.
*/

DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
  v_company_id uuid := gen_random_uuid();
  v_client_id uuid := gen_random_uuid();
BEGIN
  -- admin@rentacar.com / Admin123!
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@rentacar.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@rentacar.com',
      crypt('Admin123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"super_admin"}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb,
      'authenticated', 'authenticated', now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@rentacar.com'),
      'email', v_admin_id::text, now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (v_admin_id, 'admin@rentacar.com', 'Super Admin', 'super_admin', true);
  END IF;

  -- company@rentacar.com / Company123!
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'company@rentacar.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_company_id, '00000000-0000-0000-0000-000000000000', 'company@rentacar.com',
      crypt('Company123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"company_admin"}'::jsonb,
      '{"full_name":"Demo Company"}'::jsonb,
      'authenticated', 'authenticated', now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_company_id,
      jsonb_build_object('sub', v_company_id::text, 'email', 'company@rentacar.com'),
      'email', v_company_id::text, now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (v_company_id, 'company@rentacar.com', 'Demo Company', 'company_admin', true);
  END IF;

  -- client@rentacar.com / Client123!
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'client@rentacar.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_client_id, '00000000-0000-0000-0000-000000000000', 'client@rentacar.com',
      crypt('Client123!', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"client"}'::jsonb,
      '{"full_name":"Demo Client"}'::jsonb,
      'authenticated', 'authenticated', now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_client_id,
      jsonb_build_object('sub', v_client_id::text, 'email', 'client@rentacar.com'),
      'email', v_client_id::text, now(), now());
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (v_client_id, 'client@rentacar.com', 'Demo Client', 'client', true);
  END IF;
END $$;
