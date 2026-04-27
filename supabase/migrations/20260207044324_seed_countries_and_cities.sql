/*
  # Seed data për shtetet dhe qytetet e rajonit

  Shton të dhënat për:
  1. Kosova (XK) - me qytetet kryesore
  2. Shqipëria (AL) - me qytetet kryesore
  3. Maqedonia e Veriut (MK) - me qytetet kryesore
  4. Mali i Zi (ME) - me qytetet kryesore
  5. Krahina e Kosovës - Serbi (RS-KM) - me qytetet kryesore
*/

DO $$
DECLARE
  kosovo_id uuid;
  albania_id uuid;
  north_macedonia_id uuid;
  montenegro_id uuid;
  kosovo_metohija_id uuid;
BEGIN
  -- Shtimi i shteteve
  INSERT INTO countries (name, code) VALUES ('Kosova', 'XK') RETURNING id INTO kosovo_id;
  INSERT INTO countries (name, code) VALUES ('Shqipëria', 'AL') RETURNING id INTO albania_id;
  INSERT INTO countries (name, code) VALUES ('Maqedonia e Veriut', 'MK') RETURNING id INTO north_macedonia_id;
  INSERT INTO countries (name, code) VALUES ('Mali i Zi', 'ME') RETURNING id INTO montenegro_id;
  INSERT INTO countries (name, code) VALUES ('Krahina e Kosovës (Serbi)', 'RS-KM') RETURNING id INTO kosovo_metohija_id;

  -- Qytetet e Kosovës
  INSERT INTO cities (name, country_id) VALUES
    ('Prishtinë', kosovo_id),
    ('Prizren', kosovo_id),
    ('Pejë', kosovo_id),
    ('Gjakovë', kosovo_id),
    ('Gjilan', kosovo_id),
    ('Mitrovicë', kosovo_id),
    ('Ferizaj', kosovo_id),
    ('Vushtrri', kosovo_id),
    ('Suharekë', kosovo_id),
    ('Rahovec', kosovo_id),
    ('Podujëvë', kosovo_id),
    ('Lipjan', kosovo_id),
    ('Klinë', kosovo_id),
    ('Kaçanik', kosovo_id),
    ('Deçan', kosovo_id),
    ('Dragash', kosovo_id),
    ('Istog', kosovo_id),
    ('Fushë Kosovë', kosovo_id),
    ('Skenderaj', kosovo_id),
    ('Shtime', kosovo_id),
    ('Viti', kosovo_id),
    ('Kamenicë', kosovo_id),
    ('Malishevë', kosovo_id),
    ('Obiliq', kosovo_id),
    ('Graçanicë', kosovo_id),
    ('Hani i Elezit', kosovo_id),
    ('Mamushë', kosovo_id),
    ('Junik', kosovo_id),
    ('Ranillug', kosovo_id),
    ('Partesh', kosovo_id),
    ('Kllokot', kosovo_id),
    ('Novobërdë', kosovo_id),
    ('Shtërpcë', kosovo_id),
    ('Zubin Potok', kosovo_id),
    ('Zveçan', kosovo_id),
    ('Leposaviq', kosovo_id),
    ('Mitrovicë e Veriut', kosovo_id);

  -- Qytetet e Shqipërisë
  INSERT INTO cities (name, country_id) VALUES
    ('Tiranë', albania_id),
    ('Durrës', albania_id),
    ('Vlorë', albania_id),
    ('Shkodër', albania_id),
    ('Elbasan', albania_id),
    ('Korçë', albania_id),
    ('Fier', albania_id),
    ('Berat', albania_id),
    ('Lushnjë', albania_id),
    ('Kavajë', albania_id),
    ('Pogradec', albania_id),
    ('Gjirokastër', albania_id),
    ('Sarandë', albania_id),
    ('Laç', albania_id),
    ('Kukës', albania_id),
    ('Krujë', albania_id),
    ('Lezhë', albania_id),
    ('Patos', albania_id),
    ('Çorovodë', albania_id),
    ('Peshkopi', albania_id),
    ('Kuçovë', albania_id),
    ('Burrel', albania_id),
    ('Ballsh', albania_id),
    ('Gramsh', albania_id),
    ('Bulqizë', albania_id),
    ('Tepelenë', albania_id),
    ('Mamurras', albania_id),
    ('Përmet', albania_id),
    ('Librazhd', albania_id),
    ('Pukë', albania_id),
    ('Rrëshen', albania_id),
    ('Selenicë', albania_id),
    ('Ersekë', albania_id),
    ('Bajram Curri', albania_id),
    ('Divjakë', albania_id),
    ('Maliq', albania_id),
    ('Vlorë e Re', albania_id);

  -- Qytetet e Maqedonisë së Veriut
  INSERT INTO cities (name, country_id) VALUES
    ('Shkup', north_macedonia_id),
    ('Tetovë', north_macedonia_id),
    ('Gostivar', north_macedonia_id),
    ('Kumanovë', north_macedonia_id),
    ('Strugë', north_macedonia_id),
    ('Ohër', north_macedonia_id),
    ('Dibër', north_macedonia_id),
    ('Velës', north_macedonia_id),
    ('Prilep', north_macedonia_id),
    ('Manastir (Bitola)', north_macedonia_id),
    ('Negotinë', north_macedonia_id),
    ('Shtip', north_macedonia_id),
    ('Kërçovë', north_macedonia_id),
    ('Radovish', north_macedonia_id),
    ('Kavadar', north_macedonia_id),
    ('Strugë', north_macedonia_id),
    ('Kriva Pallankë', north_macedonia_id),
    ('Sveti Nikollë', north_macedonia_id),
    ('Resnjë', north_macedonia_id),
    ('Delçevë', north_macedonia_id),
    ('Gevgelji', north_macedonia_id),
    ('Proshtan', north_macedonia_id),
    ('Gjevgjeli', north_macedonia_id),
    ('Valandovë', north_macedonia_id),
    ('Konçë', north_macedonia_id),
    ('Bogdanci', north_macedonia_id),
    ('Dojran', north_macedonia_id);

  -- Qytetet e Malit të Zi
  INSERT INTO cities (name, country_id) VALUES
    ('Podgoricë', montenegro_id),
    ('Nikshiq', montenegro_id),
    ('Plav', montenegro_id),
    ('Guci', montenegro_id),
    ('Rozhajë', montenegro_id),
    ('Ulqin', montenegro_id),
    ('Bar', montenegro_id),
    ('Budva', montenegro_id),
    ('Kotor', montenegro_id),
    ('Tivat', montenegro_id),
    ('Herceg Novi', montenegro_id),
    ('Cetinje', montenegro_id),
    ('Berane', montenegro_id),
    ('Bijelo Polje', montenegro_id),
    ('Pljevlja', montenegro_id),
    ('Mojkovac', montenegro_id),
    ('Kolašin', montenegro_id),
    ('Andrijevica', montenegro_id),
    ('Petnjica', montenegro_id),
    ('Tuzi', montenegro_id);

  -- Qytetet e Krahinës së Kosovës (Serbi)
  INSERT INTO cities (name, country_id) VALUES
    ('Mitrovicë e Veriut', kosovo_metohija_id),
    ('Zubin Potok', kosovo_metohija_id),
    ('Zveçan', kosovo_metohija_id),
    ('Leposaviq', kosovo_metohija_id);

END $$;
