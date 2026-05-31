/*
  # Seed vehicle makes - Batch 1
  Popular European and Japanese brands with their most common models
*/

-- Audi
INSERT INTO public.vehicle_makes (name) VALUES ('Audi') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['A1','A3','A4','A5','A6','A7','A8','Q2','Q3','Q5','Q7','Q8','e-tron','TT','RS3','RS5','RS6','RS7','S3','S4','S5','S6']) AS model
WHERE m.name = 'Audi' ON CONFLICT (make_id, name) DO NOTHING;

-- BMW
INSERT INTO public.vehicle_makes (name) VALUES ('BMW') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Seria 1','Seria 2','Seria 3','Seria 4','Seria 5','Seria 6','Seria 7','Seria 8','X1','X2','X3','X4','X5','X6','X7','Z4','M2','M3','M4','M5','M8','iX','i4','i7']) AS model
WHERE m.name = 'BMW' ON CONFLICT (make_id, name) DO NOTHING;

-- Mercedes-Benz
INSERT INTO public.vehicle_makes (name) VALUES ('Mercedes-Benz') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['A-Class','B-Class','C-Class','E-Class','S-Class','CLA','CLS','GLA','GLB','GLC','GLE','GLS','G-Class','AMG GT','EQA','EQB','EQC','EQE','EQS','V-Class','Vito','Sprinter']) AS model
WHERE m.name = 'Mercedes-Benz' ON CONFLICT (make_id, name) DO NOTHING;

-- Volkswagen
INSERT INTO public.vehicle_makes (name) VALUES ('Volkswagen') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Golf','Polo','Passat','Tiguan','Touareg','T-Roc','T-Cross','Arteon','ID.3','ID.4','ID.5','Caddy','Transporter','Multivan','Taigo','Up','Jetta','Atlas']) AS model
WHERE m.name = 'Volkswagen' ON CONFLICT (make_id, name) DO NOTHING;

-- Toyota
INSERT INTO public.vehicle_makes (name) VALUES ('Toyota') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Yaris','Corolla','Camry','Prius','RAV4','C-HR','Highlander','Land Cruiser','Hilux','Supra','Aygo','Proace','bZ4X','Yaris Cross','Avensis','Auris']) AS model
WHERE m.name = 'Toyota' ON CONFLICT (make_id, name) DO NOTHING;

-- Honda
INSERT INTO public.vehicle_makes (name) VALUES ('Honda') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Civic','Accord','CR-V','HR-V','Jazz','e:Ny1','ZR-V','City','Fit','Pilot','Odyssey']) AS model
WHERE m.name = 'Honda' ON CONFLICT (make_id, name) DO NOTHING;

-- Hyundai
INSERT INTO public.vehicle_makes (name) VALUES ('Hyundai') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['i10','i20','i30','i40','Kona','Tucson','Santa Fe','Ioniq','Ioniq 5','Ioniq 6','Bayon','Elantra','Sonata','Palisade','Staria']) AS model
WHERE m.name = 'Hyundai' ON CONFLICT (make_id, name) DO NOTHING;

-- Kia
INSERT INTO public.vehicle_makes (name) VALUES ('Kia') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Picanto','Rio','Ceed','Proceed','Sportage','Sorento','Stonic','Niro','EV6','EV9','Stinger','Seltos','Carnival','Soul','Forte']) AS model
WHERE m.name = 'Kia' ON CONFLICT (make_id, name) DO NOTHING;

-- Ford
INSERT INTO public.vehicle_makes (name) VALUES ('Ford') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Fiesta','Focus','Mondeo','Puma','Kuga','Explorer','Mustang','Mustang Mach-E','Ranger','Transit','Transit Custom','EcoSport','Galaxy','S-Max','Bronco','F-150']) AS model
WHERE m.name = 'Ford' ON CONFLICT (make_id, name) DO NOTHING;

-- Opel
INSERT INTO public.vehicle_makes (name) VALUES ('Opel') ON CONFLICT (name) DO NOTHING;

INSERT INTO public.vehicle_models (make_id, name) 
SELECT m.id, model FROM public.vehicle_makes m, 
unnest(ARRAY['Corsa','Astra','Insignia','Mokka','Grandland','Crossland','Zafira','Combo','Vivaro','Movano','Rocks-e']) AS model
WHERE m.name = 'Opel' ON CONFLICT (make_id, name) DO NOTHING;

;
