/*
  # Shto kolonat country_id dhe city_id ne tabelen profiles

  1. Kolona te reja
    - `country_id` (uuid, FK -> countries.id) - shteti i përdoruesit
    - `city_id` (uuid, FK -> cities.id) - qyteti i përdoruesit

  2. Ndryshime
    - Shtohen dy kolona te reja ne tabelen profiles
    - Krijohen FK constraints me tabelat countries dhe cities
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country_id uuid REFERENCES countries(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;
