/*
  # Insurance + Extras + Pickup Locations (audit 2026-05-23)

  Tre tabela kryesore qe i mungonin platformes per te qene konkurruese me
  Sixt/Europcar/Discover Cars:

  1. insurance_plans — planet e sigurimit (CDW, Theft Protection, Super Cover)
  2. vehicle_extras + booking_extras — add-ons (child seat, GPS, etj.)
  3. pickup_locations — degë / vendndodhje pickup-i (aeroport, hotel, qytet)

  Pas kesaj, struktura e bookings duhet te ruaje:
   - insurance_plan_id (cili sigurim u zgjodh)
   - pickup_location_id / return_location_id
   - extras_total, insurance_total, one_way_fee

  Te gjitha shtohen ne menyre additive — schema nuk thyhet.
*/

-- ============================================================================
-- 1. INSURANCE PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.insurance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name_sq text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  name_de text NOT NULL DEFAULT '',
  description_sq text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_de text NOT NULL DEFAULT '',
  tier text NOT NULL CHECK (tier IN ('basic','standard','premium','platinum')),
  price_per_day numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_per_day >= 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','ALL','USD','MKD','RSD','GBP','CHF')),
  deductible_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (deductible_amount >= 0),
  includes_cdw boolean NOT NULL DEFAULT false,           -- Collision Damage Waiver
  includes_theft_protection boolean NOT NULL DEFAULT false,
  includes_third_party boolean NOT NULL DEFAULT true,
  includes_personal_accident boolean NOT NULL DEFAULT false,
  includes_glass_tire boolean NOT NULL DEFAULT false,
  includes_roadside_assistance boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_insurance_plans_company ON public.insurance_plans(company_id) WHERE is_active = true;

ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insurance plans readable by all"
  ON public.insurance_plans FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Company manages own insurance plans"
  ON public.insurance_plans FOR ALL
  TO authenticated
  USING (
    company_id IS NULL
      AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = insurance_plans.company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IS NULL
      AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = insurance_plans.company_id AND c.owner_id = auth.uid()
    )
  );

CREATE TRIGGER update_insurance_plans_updated_at
  BEFORE UPDATE ON public.insurance_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: 3 plane standarde te platformes (company_id = NULL = platform-wide default)
INSERT INTO public.insurance_plans (
  company_id, code, tier,
  name_sq, name_en, name_de,
  description_sq, description_en, description_de,
  price_per_day, currency, deductible_amount,
  includes_cdw, includes_theft_protection, includes_third_party,
  includes_personal_accident, includes_glass_tire, includes_roadside_assistance,
  sort_order
) VALUES
  (NULL, 'basic_required', 'basic',
   'Sigurim Bazë (i përfshirë)', 'Basic Insurance (included)', 'Basisversicherung (inklusive)',
   'Përgjegjësi ndaj palës së tretë. Depozita e plotë në rast dëmtimi.',
   'Third-party liability only. Full deposit at risk in case of damage.',
   'Nur Haftpflichtversicherung. Volle Kaution bei Schäden gefährdet.',
   0, 'EUR', 1500,
   false, false, true, false, false, false,
   10),
  (NULL, 'standard_cdw', 'standard',
   'CDW Standard', 'CDW Standard', 'CDW Standard',
   'Lirim nga përgjegjësia për kolizion + mbrojtje vjedhjeje. Depozita reduktohet në 500€.',
   'Collision Damage Waiver + Theft Protection. Deductible reduced to €500.',
   'Kollisionsschadenversicherung + Diebstahlschutz. Selbstbeteiligung 500€.',
   12, 'EUR', 500,
   true, true, true, false, false, true,
   20),
  (NULL, 'premium_super', 'premium',
   'Super Cover (zero depozitë)', 'Super Cover (zero deposit)', 'Super Cover (keine Kaution)',
   'Mbulim i plotë: CDW + vjedhje + xhama + goma + aksident personal. Depozita = 0€.',
   'Full coverage: CDW + theft + glass + tires + personal accident. Zero deductible.',
   'Vollkasko: CDW + Diebstahl + Glas + Reifen + Insassenunfall. Keine Selbstbeteiligung.',
   22, 'EUR', 0,
   true, true, true, true, true, true,
   30)
ON CONFLICT (company_id, code) DO NOTHING;

-- ============================================================================
-- 2. VEHICLE EXTRAS (add-ons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name_sq text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  name_de text NOT NULL DEFAULT '',
  description_sq text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_de text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'comfort' CHECK (category IN ('comfort','safety','equipment','driver','connectivity','winter','child')),
  icon text NOT NULL DEFAULT 'Package',
  price_per_day numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_per_day >= 0),
  price_per_rental numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_per_rental >= 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','ALL','USD','MKD','RSD','GBP','CHF')),
  max_quantity integer NOT NULL DEFAULT 1 CHECK (max_quantity > 0),
  requires_extra_license boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_extras_company ON public.vehicle_extras(company_id) WHERE is_active = true;

ALTER TABLE public.vehicle_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle extras readable by all"
  ON public.vehicle_extras FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Company manages own extras"
  ON public.vehicle_extras FOR ALL
  TO authenticated
  USING (
    company_id IS NULL
      AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = vehicle_extras.company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IS NULL
      AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = vehicle_extras.company_id AND c.owner_id = auth.uid()
    )
  );

CREATE TRIGGER update_vehicle_extras_updated_at
  BEFORE UPDATE ON public.vehicle_extras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: 8 extras standarde platform-wide
INSERT INTO public.vehicle_extras (
  company_id, code, category, icon,
  name_sq, name_en, name_de,
  description_sq, description_en, description_de,
  price_per_day, max_quantity, requires_extra_license, sort_order
) VALUES
  (NULL, 'child_seat',        'child',        'Baby',
   'Sjellëse për fëmijë', 'Child seat', 'Kindersitz',
   'Për fëmijë 9-18 kg, e instaluar.', 'For children 9-18 kg, pre-installed.', 'Für Kinder 9-18 kg, vorinstalliert.',
   5, 3, false, 10),
  (NULL, 'booster_seat',      'child',        'Baby',
   'Booster (4-8 vjeç)', 'Booster seat (4-8 years)', 'Sitzerhöhung (4-8 Jahre)',
   'Për fëmijë 15-36 kg.', 'For children 15-36 kg.', 'Für Kinder 15-36 kg.',
   4, 3, false, 11),
  (NULL, 'gps',               'equipment',    'Navigation',
   'Navigues GPS', 'GPS Navigation', 'GPS-Navigation',
   'Hartë Ballkani + Europa.', 'Balkan + Europe maps.', 'Karten Balkan + Europa.',
   6, 1, false, 20),
  (NULL, 'wifi_hotspot',      'connectivity', 'Wifi',
   'Wi-Fi Hotspot 4G', 'Wi-Fi Hotspot 4G', 'Wi-Fi Hotspot 4G',
   '10 GB në ditë.', '10 GB per day.', '10 GB pro Tag.',
   4, 1, false, 30),
  (NULL, 'additional_driver', 'driver',       'Users',
   'Shofer shtesë', 'Additional driver', 'Zusätzlicher Fahrer',
   'Patente vlefshme e dyte; mosha 21+.', 'Valid 2nd license; age 21+.', 'Gültiger Zweitführerschein; Alter 21+.',
   8, 2, true, 40),
  (NULL, 'snow_chains',       'winter',       'Snowflake',
   'Zinxhirë bore', 'Snow chains', 'Schneeketten',
   'Të detyrueshëm në disa zona alpine.', 'Required in some Alpine areas.', 'In manchen Alpenregionen Pflicht.',
   3, 1, false, 50),
  (NULL, 'ski_rack',          'winter',       'Mountain',
   'Mbajtës skish', 'Ski rack', 'Skihalter',
   'Mban 4 palë ski ose 2 snowboard.', 'Holds 4 pairs of skis or 2 snowboards.', 'Hält 4 Skipaare oder 2 Snowboards.',
   3, 1, false, 51),
  (NULL, 'phone_holder',      'connectivity', 'Smartphone',
   'Mbajtës telefoni', 'Phone holder', 'Telefonhalter',
   'Magnetik për ventilim/qelqishtën.', 'Magnetic dashboard / vent mount.', 'Magnetisch Armaturenbrett.',
   1, 1, false, 60)
ON CONFLICT (company_id, code) DO NOTHING;

-- ============================================================================
-- 3. PICKUP LOCATIONS (degë per kompani)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pickup_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'office' CHECK (type IN ('office','airport','train_station','hotel_delivery','port','custom')),
  address text NOT NULL DEFAULT '',
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  country_id uuid REFERENCES public.countries(id) ON DELETE SET NULL,
  latitude double precision,
  longitude double precision,
  pickup_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (pickup_fee >= 0),
  dropoff_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (dropoff_fee >= 0),
  one_way_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (one_way_fee >= 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','ALL','USD','MKD','RSD','GBP','CHF')),
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  phone text NOT NULL DEFAULT '',
  is_24_7 boolean NOT NULL DEFAULT false,
  meet_and_greet_available boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pickup_locations_company ON public.pickup_locations(company_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pickup_locations_city ON public.pickup_locations(city_id);
CREATE INDEX IF NOT EXISTS idx_pickup_locations_type ON public.pickup_locations(type);

ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pickup locations readable by all"
  ON public.pickup_locations FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Company manages own locations"
  ON public.pickup_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = pickup_locations.company_id AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = pickup_locations.company_id AND c.owner_id = auth.uid()
    )
  );

CREATE TRIGGER update_pickup_locations_updated_at
  BEFORE UPDATE ON public.pickup_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.pickup_locations IS
  'Degë / vendndodhje pickup-i per cdo kompani. Mundeson dropoff te ndryshem dhe one-way bookings.';

-- ============================================================================
-- 4. BOOKING — fusha te reja per insurance/extras/locations
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='insurance_plan_id') THEN
    ALTER TABLE public.bookings ADD COLUMN insurance_plan_id uuid REFERENCES public.insurance_plans(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_bookings_insurance_plan ON public.bookings(insurance_plan_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='insurance_total') THEN
    ALTER TABLE public.bookings ADD COLUMN insurance_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (insurance_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='extras_total') THEN
    ALTER TABLE public.bookings ADD COLUMN extras_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (extras_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='one_way_fee') THEN
    ALTER TABLE public.bookings ADD COLUMN one_way_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (one_way_fee >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tax_total') THEN
    ALTER TABLE public.bookings ADD COLUMN tax_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='discount_total') THEN
    ALTER TABLE public.bookings ADD COLUMN discount_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='discount_code_id') THEN
    ALTER TABLE public.bookings ADD COLUMN discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='pickup_location_id') THEN
    ALTER TABLE public.bookings ADD COLUMN pickup_location_id uuid REFERENCES public.pickup_locations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='return_location_id') THEN
    ALTER TABLE public.bookings ADD COLUMN return_location_id uuid REFERENCES public.pickup_locations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='included_km') THEN
    ALTER TABLE public.bookings ADD COLUMN included_km integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='extra_km_price') THEN
    ALTER TABLE public.bookings ADD COLUMN extra_km_price numeric(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- 5. BOOKING_EXTRAS junction (cilet extras, sa, cmim)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.booking_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  extra_id uuid NOT NULL REFERENCES public.vehicle_extras(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_per_day numeric(10,2) NOT NULL DEFAULT 0,
  unit_price_per_rental numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_extras_booking ON public.booking_extras(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_extras_extra ON public.booking_extras(extra_id);

ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking extras visible to booking participants"
  ON public.booking_extras FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_extras.booking_id
        AND (
          b.client_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = b.company_id AND c.owner_id = auth.uid())
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
        )
    )
  );

CREATE POLICY "Booking extras manage by client/company"
  ON public.booking_extras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_extras.booking_id
        AND (
          b.client_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = b.company_id AND c.owner_id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_extras.booking_id
        AND (
          b.client_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = b.company_id AND c.owner_id = auth.uid())
        )
    )
  );
