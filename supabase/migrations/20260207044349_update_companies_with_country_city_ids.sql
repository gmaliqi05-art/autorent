/*
  # Përditësimi i tabelës companies për të përdorur country_id dhe city_id

  1. Ndryshime
    - Shtohen kolonat country_id dhe city_id si foreign keys
    - Migron të dhënat ekzistuese nga country dhe city text në IDs
    - Mbajmë kolonat e vjetra për backward compatibility

  2. Kolonat e reja
    - country_id (uuid) - Foreign key to countries
    - city_id (uuid) - Foreign key to cities
*/

-- Shtimi i kolonave të reja në companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'country_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN country_id uuid REFERENCES countries(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE companies ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;

-- Migron të dhënat ekzistuese - përpiqet të gjejë përputhje
UPDATE companies c
SET country_id = (
  SELECT id FROM countries
  WHERE LOWER(name) = LOWER(c.country)
  OR (LOWER(c.country) = 'kosove' AND code = 'XK')
  OR (LOWER(c.country) = 'kosovo' AND code = 'XK')
  OR (LOWER(c.country) = 'shqiperi' AND code = 'AL')
  OR (LOWER(c.country) = 'albania' AND code = 'AL')
  LIMIT 1
)
WHERE c.country_id IS NULL AND c.country IS NOT NULL;

UPDATE companies c
SET city_id = (
  SELECT id FROM cities
  WHERE LOWER(name) = LOWER(c.city)
  OR (LOWER(c.city) = 'prishtine' AND LOWER(name) = 'prishtinë')
  OR (LOWER(c.city) = 'prishtina' AND LOWER(name) = 'prishtinë')
  LIMIT 1
)
WHERE c.city_id IS NULL AND c.city IS NOT NULL;

-- Indekset për performancë më të mirë
CREATE INDEX IF NOT EXISTS companies_country_id_idx ON companies(country_id);
CREATE INDEX IF NOT EXISTS companies_city_id_idx ON companies(city_id);
