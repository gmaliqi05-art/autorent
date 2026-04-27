/*
  # Create test users with proper Supabase auth structure

  1. Users created
    - maliqigenton@gmail.com (Company admin) - Mar Maliqi
    - marbaudoo@gmail.com (Client) - Driton Berisha

  2. Password: Mymarshop@2018
  
  3. Security
    - Users created with proper email confirmation
    - Passwords hashed with bcrypt
    - Proper identities created
*/

DO $$
DECLARE
  user_mar_id uuid;
  user_driton_id uuid;
BEGIN
  -- Create Mar Maliqi (Company)
  user_mar_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    is_sso_user,
    is_anonymous
  )
  VALUES (
    user_mar_id,
    '00000000-0000-0000-0000-000000000000',
    'maliqigenton@gmail.com',
    crypt('Mymarshop@2018', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Mar Maliqi"}'::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    false,
    false
  );

  -- Create identity for Mar
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_mar_id,
    user_mar_id,
    user_mar_id,
    jsonb_build_object('sub', user_mar_id::text, 'email', 'maliqigenton@gmail.com', 'email_verified', false, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  );

  -- Update profile to company_admin (created by trigger)
  UPDATE profiles
  SET role = 'company_admin'
  WHERE id = user_mar_id;

  -- Update app_metadata to include role
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"role":"company_admin"}'::jsonb
  WHERE id = user_mar_id;

  -- Create company for Mar
  INSERT INTO companies (owner_id, name, slug, phone, email, city, country, status)
  VALUES (
    user_mar_id,
    'Mar Maliqi Rent',
    'mar-maliqi-rent',
    '',
    'maliqigenton@gmail.com',
    'Prishtine',
    'Kosove',
    'approved'
  );

  -- Create Driton Berisha (Client)
  user_driton_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    is_sso_user,
    is_anonymous
  )
  VALUES (
    user_driton_id,
    '00000000-0000-0000-0000-000000000000',
    'marbaudoo@gmail.com',
    crypt('Mymarshop@2018', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Driton Berisha"}'::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    false,
    false
  );

  -- Create identity for Driton
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_driton_id,
    user_driton_id,
    user_driton_id,
    jsonb_build_object('sub', user_driton_id::text, 'email', 'marbaudoo@gmail.com', 'email_verified', false, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  );

END $$;
