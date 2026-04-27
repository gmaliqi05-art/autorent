/*
  # Shto te gjitha komunat zyrtare te Kosoves

  Kosova ndahet ne 38 komuna sipas ligjit per organizimin administrativ-territorial.
  Fshihen komunat e vjetra te pakta dhe shtohen te gjitha 38 komunat zyrtare.
*/

-- Fshi qytetet ekzistuese per Kosoven
DELETE FROM cities WHERE country_id = (SELECT id FROM countries WHERE code = 'XK');

-- Shto te gjitha 38 komunat zyrtare te Kosoves
INSERT INTO cities (name, country_id, is_active)
SELECT unnest(ARRAY[
  'Prishtine','Prizren','Ferizaj','Peje','Gjakove','Mitrovice','Gjilan',
  'Podujeve','Vushtrri','Suhareke','Rahovec','Drenas','Lipjan','Malisheve',
  'Skenderaj','Kline','Decan','Istog','Kamenice','Viti','Kacanik',
  'Shtime','Fushe Kosove','Obilic','Gracanice','Novoberde','Ranillug',
  'Partesh','Kllokot','Mitrovice e Veriut','Zvecan','Zubin Potok',
  'Leposaviq','Shterpce','Hani i Elezit','Mamuse','Dragash','Junik'
]) AS city_name,
(SELECT id FROM countries WHERE code = 'XK'),
true
ON CONFLICT DO NOTHING;
