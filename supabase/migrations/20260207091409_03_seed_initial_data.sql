/*
  # Seed Initial Platform Data
  
  Adds:
  - Countries (Kosovo, Albania, North Macedonia)
  - Major cities in each country
  - Subscription plans for rental companies
*/

-- Insert countries
INSERT INTO countries (name, code, is_active) VALUES
  ('Kosova', 'XK', true),
  ('Shqiperia', 'AL', true),
  ('Maqedonia e Veriut', 'MK', true)
ON CONFLICT (code) DO NOTHING;

-- Insert cities for Kosovo
DO $$
DECLARE
  kosovo_id uuid;
BEGIN
  SELECT id INTO kosovo_id FROM countries WHERE code = 'XK';
  
  IF kosovo_id IS NOT NULL THEN
    INSERT INTO cities (country_id, name, is_active) VALUES
      (kosovo_id, 'Prishtine', true),
      (kosovo_id, 'Prizren', true),
      (kosovo_id, 'Peje', true),
      (kosovo_id, 'Ferizaj', true),
      (kosovo_id, 'Gjilan', true),
      (kosovo_id, 'Mitrovice', true),
      (kosovo_id, 'Gjakove', true),
      (kosovo_id, 'Podujeve', true),
      (kosovo_id, 'Vushtrri', true),
      (kosovo_id, 'Suhareke', true)
    ON CONFLICT (country_id, name) DO NOTHING;
  END IF;
END $$;

-- Insert cities for Albania
DO $$
DECLARE
  albania_id uuid;
BEGIN
  SELECT id INTO albania_id FROM countries WHERE code = 'AL';
  
  IF albania_id IS NOT NULL THEN
    INSERT INTO cities (country_id, name, is_active) VALUES
      (albania_id, 'Tirane', true),
      (albania_id, 'Durres', true),
      (albania_id, 'Vlore', true),
      (albania_id, 'Shkoder', true),
      (albania_id, 'Elbasan', true),
      (albania_id, 'Korce', true),
      (albania_id, 'Fier', true),
      (albania_id, 'Berat', true),
      (albania_id, 'Sarande', true),
      (albania_id, 'Kavaje', true)
    ON CONFLICT (country_id, name) DO NOTHING;
  END IF;
END $$;

-- Insert cities for North Macedonia
DO $$
DECLARE
  macedonia_id uuid;
BEGIN
  SELECT id INTO macedonia_id FROM countries WHERE code = 'MK';
  
  IF macedonia_id IS NOT NULL THEN
    INSERT INTO cities (country_id, name, is_active) VALUES
      (macedonia_id, 'Shkup', true),
      (macedonia_id, 'Kumanova', true),
      (macedonia_id, 'Tetove', true),
      (macedonia_id, 'Gostivar', true),
      (macedonia_id, 'Struge', true),
      (macedonia_id, 'Manastir', true),
      (macedonia_id, 'Ohrid', true)
    ON CONFLICT (country_id, name) DO NOTHING;
  END IF;
END $$;

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_vehicles, max_bookings_monthly, features, is_active, sort_order) VALUES
  (
    'Basic',
    'Perfekt per kompani te vogla qe jane duke filluar',
    29.99,
    299.99,
    10,
    50,
    '["10 automjete", "50 rezervime/muaj", "Suport email", "Profil kompanie"]'::jsonb,
    true,
    1
  ),
  (
    'Professional',
    'Zgjidhja ideale per kompani ne rritje',
    79.99,
    799.99,
    50,
    200,
    '["50 automjete", "200 rezervime/muaj", "Suport prioritar", "Profil i plote", "Analitika avancuar", "Logo dhe foto"]'::jsonb,
    true,
    2
  ),
  (
    'Enterprise',
    'Per kompani te medha me nevoja te veçanta',
    199.99,
    1999.99,
    999,
    9999,
    '["Automjete te pakufizuara", "Rezervime te pakufizuara", "Suport 24/7", "Manager personal", "API access", "Integrimi custom", "Raportim i avancuar"]'::jsonb,
    true,
    3
  )
ON CONFLICT (name) DO NOTHING;