/*
  # date_of_birth ne profiles per young driver fee

  Bug nga audit: calculateBookingPrice ka logjike per young_driver_fee
  (driverAge < 25 + vehicle.young_driver_fee_per_day), por driverAge
  nuk dergohej kurre. Profile nuk kishte fushe DOB.

  Solution:
  - Shto date_of_birth ne profiles (nullable; user e plotson kur do)
  - Stripe Identity OCR mund ta plotsoje automatikisht
    (shih client_documents.stripe_identity_data.dob)
  - Klient e edit-on nga /dashboard/profili

  Idempotent.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='date_of_birth') THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth date;
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.date_of_birth IS
  'Data e lindjes — perdoret per young_driver_fee (< 25 vjec) ne booking calculator. Nullable. Mund te auto-plotsohet nga Stripe Identity OCR.';
