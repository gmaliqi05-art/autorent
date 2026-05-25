/*
  # Hiq demo users nga production

  Migration 20260311125832 krijon 3 demo users me passwords te dobet
  (Admin123!, Company123!, Client123!) per zhvillim. Ne production
  jane risk serioz sigurie — kushdo me URL-en publike Supabase mund
  t'i provoje.

  Ky migration i fshin ne menyre idempotente. Per dev environments,
  ri-aplikoji manualisht me skriptin scripts/seed-dev-users.sql ose
  rikrijoji nga UI signup.

  Sigurte te aplikohet edhe kur jane fshire tashme (NO-OP).
*/

DO $$
DECLARE
  v_admin_id uuid;
  v_company_id uuid;
  v_client_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@rentacar.com';
  SELECT id INTO v_company_id FROM auth.users WHERE email = 'company@rentacar.com';
  SELECT id INTO v_client_id FROM auth.users WHERE email = 'client@rentacar.com';

  -- Fshi ne rendin e duhur per te respektuar FK constraints
  IF v_admin_id IS NOT NULL THEN
    DELETE FROM public.notifications WHERE user_id = v_admin_id;
    DELETE FROM public.notification_preferences WHERE user_id = v_admin_id;
    DELETE FROM public.push_subscriptions WHERE user_id = v_admin_id;
    DELETE FROM auth.identities WHERE user_id = v_admin_id;
    DELETE FROM public.profiles WHERE id = v_admin_id;
    DELETE FROM auth.users WHERE id = v_admin_id;
    RAISE NOTICE 'Demo user admin@rentacar.com u fshi';
  END IF;

  IF v_company_id IS NOT NULL THEN
    DELETE FROM public.notifications WHERE user_id = v_company_id;
    DELETE FROM public.notification_preferences WHERE user_id = v_company_id;
    DELETE FROM public.push_subscriptions WHERE user_id = v_company_id;
    -- Companies behen orphan (owner_id) — opsionalisht set NULL ose lere
    UPDATE public.companies SET owner_id = NULL WHERE owner_id = v_company_id;
    DELETE FROM auth.identities WHERE user_id = v_company_id;
    DELETE FROM public.profiles WHERE id = v_company_id;
    DELETE FROM auth.users WHERE id = v_company_id;
    RAISE NOTICE 'Demo user company@rentacar.com u fshi';
  END IF;

  IF v_client_id IS NOT NULL THEN
    DELETE FROM public.notifications WHERE user_id = v_client_id;
    DELETE FROM public.notification_preferences WHERE user_id = v_client_id;
    DELETE FROM public.push_subscriptions WHERE user_id = v_client_id;
    -- Bookings nuk fshihen automatikisht — operatori mund t'i fshije manualisht nese deshiron
    DELETE FROM auth.identities WHERE user_id = v_client_id;
    DELETE FROM public.profiles WHERE id = v_client_id;
    DELETE FROM auth.users WHERE id = v_client_id;
    RAISE NOTICE 'Demo user client@rentacar.com u fshi';
  END IF;
END $$;
