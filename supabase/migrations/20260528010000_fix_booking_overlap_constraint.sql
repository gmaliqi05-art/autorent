/*
  # Fix booking overlap constraint per back-to-back bookings

  Constraint-i `no_overlapping_bookings` u krijua me `daterange(..., '[]')`
  qe e ben fundin INCLUSIVE. Per qira makinash, semantika eshte:
   - Pickup-i fillon ne ditën X
   - Return-i mbaron ne ditën Y (return dorezohet brenda dites)
   - Nje user tjeter mund te marrë makinen ne ditën Y vone

  Me `'[]'`, dy bookings legjitime back-to-back (psh maj 10-15 dhe 15-20)
  u flag-onin si overlap dhe i dyti refuzohej.

  Ky migration drop-on dhe re-create-on constraint-in me `'[)'`
  (mbyllur start, hapur end) — semantika korrekte e qirave.

  Idempotent: drop me IF EXISTS, krijim vetem nese mungon.
*/

DO $$
BEGIN
  -- Drop versionin e vjeter
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'no_overlapping_bookings' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT no_overlapping_bookings;
  END IF;

  -- Re-create me semantike te sakte
  ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING gist (
      vehicle_id WITH =,
      daterange(pickup_date, return_date, '[)') WITH &&
    )
    WHERE (status NOT IN ('cancelled'));
END $$;
