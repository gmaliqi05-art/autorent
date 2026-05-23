/*
  # Data Model Fixes (audit 2026-05-23)

  ## Probleme te identifikuara

  1. bookings/invoices nuk kishin fushe `currency` — cmimet ishin numeric pa
     specifikim te valutes. Klientet evropiane nuk dinin EUR vs ALL.

  2. invoices nuk kishin FK te vehicle_id — pamundeson raportet agregate
     per automjet.

  3. Nuk kishte audit_logs — pa trail per ndryshimet e statusit te kompanise,
     fshirjen e automjeteve, etj.

  4. vehicles mungonin politika kerkim industrie:
       - fuel_policy (full-to-full / full-to-empty / same-to-same / prepaid)
       - mileage policy (included km + extra km price)
       - cross_border_allowed
       - moshe minimale shoferi

  5. companies.country dhe companies.country_id ishin te dyja kolona aktive
     (dy burime te vertetes) — shenohet country/city tekst si DEPRECATED ne
     komente; nuk fshihen per backwards compat.

  Shtimet ketu jane te gjitha ADDITIVE — pa nje ALTER destruktiv.
*/

-- ============================================================================
-- 1. CURRENCY ne bookings dhe invoices
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='currency'
  ) THEN
    ALTER TABLE public.bookings
      ADD COLUMN currency text NOT NULL DEFAULT 'EUR'
      CHECK (currency IN ('EUR','ALL','USD','MKD','RSD','GBP','CHF'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='invoices' AND column_name='currency'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN currency text NOT NULL DEFAULT 'EUR'
      CHECK (currency IN ('EUR','ALL','USD','MKD','RSD','GBP','CHF'));
  END IF;
END $$;

COMMENT ON COLUMN public.bookings.currency IS 'ISO 4217 currency code per total_price / deposit_amount.';
COMMENT ON COLUMN public.invoices.currency IS 'ISO 4217 currency code; duhet te perputhet me bookings.currency.';

-- ============================================================================
-- 2. INVOICES — FK te vehicle_id (per raporte)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='invoices' AND column_name='vehicle_id'
  ) THEN
    ALTER TABLE public.invoices
      ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_id ON public.invoices(vehicle_id);
  END IF;
END $$;

-- Backfill nga bookings ku eshte e mundur
UPDATE public.invoices i
SET vehicle_id = b.vehicle_id
FROM public.bookings b
WHERE i.booking_id = b.id
  AND i.vehicle_id IS NULL;

-- ============================================================================
-- 3. VEHICLES — politika tipike industri rent-a-car
-- ============================================================================

DO $$
BEGIN
  -- Mileage policy
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='included_km_per_day') THEN
    ALTER TABLE public.vehicles ADD COLUMN included_km_per_day integer NOT NULL DEFAULT 0;
    COMMENT ON COLUMN public.vehicles.included_km_per_day IS '0 = unlimited; >0 = km te perfshira ne cmimin baze per dite.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='extra_km_price') THEN
    ALTER TABLE public.vehicles ADD COLUMN extra_km_price numeric(10,2) NOT NULL DEFAULT 0;
  END IF;

  -- Fuel policy
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='fuel_policy') THEN
    ALTER TABLE public.vehicles
      ADD COLUMN fuel_policy text NOT NULL DEFAULT 'full_to_full'
      CHECK (fuel_policy IN ('full_to_full','full_to_empty','same_to_same','prepaid'));
  END IF;

  -- Moshe / patente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='min_driver_age') THEN
    ALTER TABLE public.vehicles ADD COLUMN min_driver_age integer NOT NULL DEFAULT 21 CHECK (min_driver_age BETWEEN 16 AND 99);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='min_license_years') THEN
    ALTER TABLE public.vehicles ADD COLUMN min_license_years integer NOT NULL DEFAULT 1 CHECK (min_license_years BETWEEN 0 AND 50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='young_driver_fee_per_day') THEN
    ALTER TABLE public.vehicles ADD COLUMN young_driver_fee_per_day numeric(10,2) NOT NULL DEFAULT 0;
  END IF;

  -- Cross-border (kerkesa kryesore per Ballkanin)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='cross_border_allowed') THEN
    ALTER TABLE public.vehicles ADD COLUMN cross_border_allowed boolean NOT NULL DEFAULT false;
    COMMENT ON COLUMN public.vehicles.cross_border_allowed IS 'A lejohet dalja ndërkufitare? Per Kosove<->Serbi etj. duhet kontroll i veçantë.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='allowed_countries') THEN
    ALTER TABLE public.vehicles ADD COLUMN allowed_countries text[] NOT NULL DEFAULT ARRAY[]::text[];
    COMMENT ON COLUMN public.vehicles.allowed_countries IS 'ISO codes ku lejohet automjeti. Bosh = vetem countries ku eshte regjistruar.';
  END IF;

  -- Valuta baze (per kompani me cmime ne ALL ne vend te EUR)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='currency') THEN
    ALTER TABLE public.vehicles
      ADD COLUMN currency text NOT NULL DEFAULT 'EUR'
      CHECK (currency IN ('EUR','ALL','USD','MKD','RSD','GBP','CHF'));
  END IF;
END $$;

-- ============================================================================
-- 4. AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role text,
  action text NOT NULL CHECK (action IN ('create','update','delete','login','logout','status_change','approve','reject','suspend','restore','export','import')),
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Vetem super_admin lexon
CREATE POLICY "Super admin reads audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Insert vetem nga service_role (edge functions / RPC) — nuk ka policy per insert publik
-- Kjo do te thote: anon/authenticated nuk mund te shkruajne direkt.

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

COMMENT ON TABLE public.audit_logs IS
  'Audit trail per veprime te ndjeshme. Insert behet vetem nga service_role / RPC me SECURITY DEFINER.';

-- ============================================================================
-- 5. RPC per log audit (callable nga edge functions / trigger-a)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_changes jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Vetem service_role ose super_admin mund te logojne audit
  IF current_setting('request.jwt.claim.role', true) NOT IN ('service_role')
     AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'super_admin' THEN
    RAISE EXCEPTION 'Permission denied for audit log';
  END IF;

  INSERT INTO public.audit_logs (user_id, user_role, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'anonymous'),
    p_action,
    p_entity_type,
    p_entity_id,
    p_changes
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, jsonb) TO authenticated;

-- ============================================================================
-- 6. CURRENCY RATES (per konvertim FX ne kohe reale)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.currency_rates (
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  rate numeric(18,8) NOT NULL CHECK (rate > 0),
  source text NOT NULL DEFAULT 'manual',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (base_currency, quote_currency)
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Currency rates readable by all"
  ON public.currency_rates FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed default (manual; cron mund te perditesoje me ECB)
INSERT INTO public.currency_rates (base_currency, quote_currency, rate, source) VALUES
  ('EUR','ALL', 100.0, 'seed'),
  ('EUR','MKD', 61.5,  'seed'),
  ('EUR','USD', 1.08,  'seed'),
  ('EUR','RSD', 117.0, 'seed'),
  ('EUR','GBP', 0.85,  'seed'),
  ('EUR','CHF', 0.96,  'seed'),
  ('EUR','EUR', 1.0,   'seed')
ON CONFLICT (base_currency, quote_currency) DO NOTHING;

COMMENT ON TABLE public.currency_rates IS
  'Konvertim valutash. Perditesohet nga cron qe lexon ECB API.';
