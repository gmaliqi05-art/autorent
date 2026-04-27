/*
  # Shtimi i tabelave për shtetet dhe qytetet

  1. Tabela e re: countries
    - id (uuid, primary key)
    - name (text) - Emri i shtetit
    - code (text) - Kodi i shtetit (XK, AL, MK, ME, RS)
    - created_at (timestamptz)

  2. Tabela e re: cities
    - id (uuid, primary key)
    - name (text) - Emri i qytetit
    - country_id (uuid) - Foreign key to countries
    - created_at (timestamptz)

  3. Siguria
    - RLS i aktivizuar në të dyja tabelat
    - Politikat që lejojnë lexim publik (authenticated dhe anon)
    - Vetëm super_admin mund të shtojë/përditësojë/fshijë
*/

-- Krijimi i tabelës për shtetet
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Krijimi i tabelës për qytetet
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Indekset për performancë më të mirë
CREATE INDEX IF NOT EXISTS cities_country_id_idx ON cities(country_id);
CREATE INDEX IF NOT EXISTS cities_name_idx ON cities(name);
CREATE INDEX IF NOT EXISTS countries_code_idx ON countries(code);

-- Aktivizimi i RLS
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Politikat për countries - të gjithë mund të lexojnë
CREATE POLICY "Të gjithë mund të lexojnë shtetet"
  ON countries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Super admin mund të shtojë shtete"
  ON countries FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "Super admin mund të përditësojë shtete"
  ON countries FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "Super admin mund të fshijë shtete"
  ON countries FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Politikat për cities - të gjithë mund të lexojnë
CREATE POLICY "Të gjithë mund të lexojnë qytetet"
  ON cities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Super admin mund të shtojë qytete"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "Super admin mund të përditësojë qytete"
  ON cities FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

CREATE POLICY "Super admin mund të fshijë qytete"
  ON cities FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
