/*
  # Seed vehicle makes - Batch 2
  More European, Asian, and American brands
*/

-- Renault
INSERT INTO public.vehicle_makes (name) VALUES ('Renault') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Clio','Megane','Captur','Kadjar','Austral','Arkana','Scenic','Talisman','Twingo','Kangoo','Master','Zoe','Espace','Koleos']) AS model
WHERE m.name = 'Renault' ON CONFLICT (make_id, name) DO NOTHING;

-- Peugeot
INSERT INTO public.vehicle_makes (name) VALUES ('Peugeot') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['108','208','308','408','508','2008','3008','5008','Partner','Rifter','Expert','Boxer','e-208','e-2008','e-308']) AS model
WHERE m.name = 'Peugeot' ON CONFLICT (make_id, name) DO NOTHING;

-- Citroen
INSERT INTO public.vehicle_makes (name) VALUES ('Citroen') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['C1','C3','C3 Aircross','C4','C4 X','C5 Aircross','C5 X','Berlingo','SpaceTourer','Jumpy','Jumper','Ami']) AS model
WHERE m.name = 'Citroen' ON CONFLICT (make_id, name) DO NOTHING;

-- Fiat
INSERT INTO public.vehicle_makes (name) VALUES ('Fiat') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['500','500X','500L','500e','Panda','Tipo','Punto','Doblo','Ducato','Fiorino','600e']) AS model
WHERE m.name = 'Fiat' ON CONFLICT (make_id, name) DO NOTHING;

-- Seat
INSERT INTO public.vehicle_makes (name) VALUES ('Seat') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Ibiza','Leon','Arona','Ateca','Tarraco','Alhambra','Mii']) AS model
WHERE m.name = 'Seat' ON CONFLICT (make_id, name) DO NOTHING;

-- Skoda
INSERT INTO public.vehicle_makes (name) VALUES ('Skoda') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Fabia','Octavia','Superb','Scala','Kamiq','Karoq','Kodiaq','Enyaq','Citigo','Rapid','Yeti']) AS model
WHERE m.name = 'Skoda' ON CONFLICT (make_id, name) DO NOTHING;

-- Nissan
INSERT INTO public.vehicle_makes (name) VALUES ('Nissan') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Micra','Juke','Qashqai','X-Trail','Leaf','Ariya','Note','Navara','Patrol','GT-R','370Z','Kicks','Pathfinder']) AS model
WHERE m.name = 'Nissan' ON CONFLICT (make_id, name) DO NOTHING;

-- Mazda
INSERT INTO public.vehicle_makes (name) VALUES ('Mazda') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['2','3','6','CX-3','CX-30','CX-5','CX-60','CX-90','MX-5','MX-30']) AS model
WHERE m.name = 'Mazda' ON CONFLICT (make_id, name) DO NOTHING;

-- Mitsubishi
INSERT INTO public.vehicle_makes (name) VALUES ('Mitsubishi') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['ASX','Eclipse Cross','Outlander','L200','Pajero','Space Star','Colt','Lancer']) AS model
WHERE m.name = 'Mitsubishi' ON CONFLICT (make_id, name) DO NOTHING;

-- Suzuki
INSERT INTO public.vehicle_makes (name) VALUES ('Suzuki') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Swift','Vitara','S-Cross','Ignis','Jimny','Across','Swace','Baleno','Alto','Celerio']) AS model
WHERE m.name = 'Suzuki' ON CONFLICT (make_id, name) DO NOTHING;

-- Volvo
INSERT INTO public.vehicle_makes (name) VALUES ('Volvo') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['XC40','XC60','XC90','S60','S90','V40','V60','V90','C40','EX30','EX90']) AS model
WHERE m.name = 'Volvo' ON CONFLICT (make_id, name) DO NOTHING;

-- Dacia
INSERT INTO public.vehicle_makes (name) VALUES ('Dacia') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Sandero','Duster','Jogger','Spring','Logan','Lodgy','Dokker']) AS model
WHERE m.name = 'Dacia' ON CONFLICT (make_id, name) DO NOTHING;

-- Porsche
INSERT INTO public.vehicle_makes (name) VALUES ('Porsche') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['911','Cayenne','Macan','Panamera','Taycan','718 Boxster','718 Cayman']) AS model
WHERE m.name = 'Porsche' ON CONFLICT (make_id, name) DO NOTHING;

-- Land Rover
INSERT INTO public.vehicle_makes (name) VALUES ('Land Rover') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Range Rover','Range Rover Sport','Range Rover Velar','Range Rover Evoque','Defender','Discovery','Discovery Sport']) AS model
WHERE m.name = 'Land Rover' ON CONFLICT (make_id, name) DO NOTHING;

-- Jeep
INSERT INTO public.vehicle_makes (name) VALUES ('Jeep') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Renegade','Compass','Cherokee','Grand Cherokee','Wrangler','Gladiator','Avenger']) AS model
WHERE m.name = 'Jeep' ON CONFLICT (make_id, name) DO NOTHING;

-- Tesla
INSERT INTO public.vehicle_makes (name) VALUES ('Tesla') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Model 3','Model Y','Model S','Model X','Cybertruck']) AS model
WHERE m.name = 'Tesla' ON CONFLICT (make_id, name) DO NOTHING;

-- Alfa Romeo
INSERT INTO public.vehicle_makes (name) VALUES ('Alfa Romeo') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Giulia','Stelvio','Tonale','Giulietta','MiTo','4C','159','156','147']) AS model
WHERE m.name = 'Alfa Romeo' ON CONFLICT (make_id, name) DO NOTHING;

-- Subaru
INSERT INTO public.vehicle_makes (name) VALUES ('Subaru') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Impreza','Outback','Forester','XV','Legacy','WRX','BRZ','Levorg','Solterra']) AS model
WHERE m.name = 'Subaru' ON CONFLICT (make_id, name) DO NOTHING;

-- Chevrolet
INSERT INTO public.vehicle_makes (name) VALUES ('Chevrolet') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Spark','Aveo','Cruze','Malibu','Camaro','Corvette','Trax','Equinox','Tahoe','Silverado','Blazer']) AS model
WHERE m.name = 'Chevrolet' ON CONFLICT (make_id, name) DO NOTHING;

-- Lexus
INSERT INTO public.vehicle_makes (name) VALUES ('Lexus') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['UX','NX','RX','IS','ES','LS','LC','LBX','RZ']) AS model
WHERE m.name = 'Lexus' ON CONFLICT (make_id, name) DO NOTHING;

-- MINI
INSERT INTO public.vehicle_makes (name) VALUES ('MINI') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Cooper','Cooper S','Countryman','Clubman','John Cooper Works','Paceman','Cabrio']) AS model
WHERE m.name = 'MINI' ON CONFLICT (make_id, name) DO NOTHING;

-- Cupra
INSERT INTO public.vehicle_makes (name) VALUES ('Cupra') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Born','Formentor','Leon','Ateca','Tavascan']) AS model
WHERE m.name = 'Cupra' ON CONFLICT (make_id, name) DO NOTHING;

;
