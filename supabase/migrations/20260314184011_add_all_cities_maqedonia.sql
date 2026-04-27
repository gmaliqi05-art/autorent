/*
  # Shto te gjitha komunat zyrtare te Maqedonise se Veriut

  Maqedonia e Veriut ndahet ne 80 komuna + Qyteti i Shkupit (10 komunat brenda tij).
  Fshihen komunat e vjetra te pakta dhe shtohen komunat kryesore zyrtare.
*/

-- Fshi qytetet ekzistuese per Maqedonine e Veriut
DELETE FROM cities WHERE country_id = (SELECT id FROM countries WHERE code = 'MK');

-- Shto te gjitha komunat zyrtare te Maqedonise se Veriut
INSERT INTO cities (name, country_id, is_active)
SELECT unnest(ARRAY[
  -- Qytetet kryesore dhe komunat
  'Shkup','Tetove','Manastir','Kumanova','Ohrid','Gostivar','Struge',
  'Strumica','Negotine','Kercove','Stip','Veles','Radovis','Gevgelije',
  'Kavadar','Kratove','Kriva Palanka','Sveti Nikole','Debar','Resen',
  'Makedonski Brod','Kocani','Vinica','Berovo','Delcevo','Pehcevo',
  'Valandove','Bogdanci','Dojran','Demir Hisar','Krusheve','Prilep',
  'Makedonska Kamenica','Probistip','Zrnovci','Cesinovo','Konche',
  'Novo Selo','Bosilove','Vasilevo','Gevgelije','Demir Kapija',
  'Rosoman','Caska','Dolneni','Mogila','Novaci','Bitola',
  'Lozove','Sopiste','Studenicani','Ilinden','Petrovec','Gazi Baba',
  'Gjorce Petrov','Kisela Voda','Karposh','Centar','Aerodrom',
  'Saraj','Suto Orizari','Butel','Cair','Shuto Orizare',
  'Jegunovce','Tearce','Bogovinje','Vrapciste','Zelino',
  'Mavrovo','Rostushe','Plasnica','Zhelino','Lipkovo',
  'Arachinovo','Chucher Sandevo','Brvenica','Gradsko'
]) AS city_name,
(SELECT id FROM countries WHERE code = 'MK'),
true
ON CONFLICT DO NOTHING;
