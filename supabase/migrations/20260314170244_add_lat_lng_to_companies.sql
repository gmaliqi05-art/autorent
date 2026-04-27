/*
  # Add latitude/longitude to companies table

  ## Overview
  Adds geolocation fields to the companies table so each company can set its
  precise map location. These coordinates are used on the public homepage map
  to show nearby rent-a-car offices and to sort featured vehicles by distance
  when a client grants location permission.

  ## Changes
  - Adds `latitude` (double precision) to companies – can be null (not yet set)
  - Adds `longitude` (double precision) to companies – can be null (not yet set)

  ## Notes
  - No RLS changes needed; existing company RLS policies already cover UPDATE by owner
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE companies ADD COLUMN latitude double precision DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE companies ADD COLUMN longitude double precision DEFAULT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_lat_lng ON companies (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
