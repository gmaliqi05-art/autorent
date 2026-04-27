/*
  # Create Test Company for company_admin user

  1. New Data:
    - Creates a test company "RentaKar Tirane" owned by company@rentacar.com
    - Status set to 'approved' so it's fully functional
    - Includes sample contact information

  2. Notes:
    - Company linked to the company_admin test user
*/

DO $$
DECLARE
  company_user_id uuid;
BEGIN
  SELECT id INTO company_user_id FROM auth.users WHERE email = 'company@rentacar.com';

  IF company_user_id IS NOT NULL THEN
    INSERT INTO public.companies (
      owner_id,
      name,
      slug,
      description,
      phone,
      email,
      address,
      city,
      country,
      license_number,
      status
    ) VALUES (
      company_user_id,
      'RentaKar Tirane',
      'rentakar-tirane-' || extract(epoch from now())::bigint,
      'Kompani e besueshme per marrje me qera te automjeteve ne Tirane. Ofrojme automjete te ndryshme per cdo nevoje.',
      '+355 69 234 5678',
      'company@rentacar.com',
      'Rruga Myslym Shyri, Nr. 42',
      'Tirane',
      'Shqiperi',
      'AL-2024-RC-001',
      'approved'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
