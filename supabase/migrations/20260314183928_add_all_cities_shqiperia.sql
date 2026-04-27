/*
  # Shto te gjitha qytetet/bashkite zyrtare te Shqiperise

  Shqiperia ndahet ne 61 bashki sipas reformes administrative 2015.
  Fshihen qytetet e vjetra te pakta dhe shtohen te gjitha 61 bashkite zyrtare.
*/

-- Fshi qytetet ekzistuese per Shqiperine
DELETE FROM cities WHERE country_id = (SELECT id FROM countries WHERE code = 'AL');

-- Shto te gjitha 61 bashkite zyrtare te Shqiperise
INSERT INTO cities (name, country_id, is_active) 
SELECT unnest(ARRAY[
  'Tirane','Durres','Vlore','Shkoder','Fier','Korce','Elbasan','Berat',
  'Lushnje','Kavaje','Gjirokaster','Sarande','Pogradec','Lac','Lezhe',
  'Kukes','Tropoje','Puke','Mirdite','Kurbin','Mat','Bulqize',
  'Diber','Permet','Tepelene','Mallakaster','Divjake','Roskovec',
  'Patos','Selenice','Himara','Finiq','Dropull','Libohove','Kelbaze',
  'Kolonje','Pustec','Devoll','Maliq','Prrenjas','Gramsh','Skrapar',
  'Cerovik','Librazhd','Peqin','Cerrik','Belsh','Rrogozhine','Shijak',
  'Kamze','Vore','Kruje','Fushe Kruje','Mamurras','Klos','Burrel',
  'Ulze','Has','Bajram Curri','Shishtavec','Permet'
]) AS city_name,
(SELECT id FROM countries WHERE code = 'AL'),
true
ON CONFLICT DO NOTHING;
