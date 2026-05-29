/*
  # Tabela dhe views te munguara — fresh DB stability

  Audit i thelle identifikoi 6 tabela/views qe referencohen ne frontend
  (HomePage + admin pages) por nuk jane krijuar ne asnje migration. Ne
  prodhimin aktual mund te jene krijuar manualisht permes SQL editor,
  por nje fresh deploy do crashtonte (HomePage CategoriesSection
  kerkon `vehicle_categories_with_stats` view).

  Ky migration eshte idempotent (IF NOT EXISTS gjithkund).

  Tabela te shtuara:
  - vehicle_categories (bazë) + seed me 7 kategori
  - daily_offers
  - discount_codes
  - legal_pages
  - notification_logs

  Views te shtuara:
  - vehicle_categories_with_stats (aggregate count + min_price per category)
*/

-- ============================================================================
-- 1. vehicle_categories (referenced ne RLS migrations por kurre s'u krijua)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_categories (
  key text PRIMARY KEY,
  sort_order int NOT NULL DEFAULT 99,
  is_active boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  label_sq text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  label_de text NOT NULL DEFAULT '',
  default_min_price numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_categories_active_sort
  ON public.vehicle_categories(is_active, sort_order);

ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Seed me kategoriete default qe perdor frontend-i (per match me fallback images).
INSERT INTO public.vehicle_categories (key, sort_order, label_sq, label_en, label_de, default_min_price) VALUES
  ('ekonomike', 1, 'Ekonomike',  'Economy',  'Economy',  20),
  ('kompakte',  2, 'Kompakte',   'Compact',  'Kompakt',  25),
  ('sedan',     3, 'Sedan',      'Sedan',    'Limousine', 35),
  ('suv',       4, 'SUV',        'SUV',      'SUV',      45),
  ('luksoz',    5, 'Luksoze',    'Luxury',   'Luxus',    80),
  ('minivan',   6, 'Minivan',    'Minivan',  'Minivan',  55),
  ('furgon',    7, 'Furgon',     'Van',      'Transporter', 60)
ON CONFLICT (key) DO NOTHING;

-- Read public + super_admin write (mocked nga 20260427125525)
DROP POLICY IF EXISTS "Public read active categories" ON public.vehicle_categories;
CREATE POLICY "Public read active categories"
  ON public.vehicle_categories FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Super admin read all categories" ON public.vehicle_categories;
CREATE POLICY "Super admin read all categories"
  ON public.vehicle_categories FOR SELECT
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

DROP POLICY IF EXISTS "Super admin manages categories" ON public.vehicle_categories;
CREATE POLICY "Super admin manages categories"
  ON public.vehicle_categories FOR ALL
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

-- ============================================================================
-- 2. vehicle_categories_with_stats VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.vehicle_categories_with_stats
WITH (security_invoker = true)
AS
SELECT
  c.key,
  c.sort_order,
  c.is_active,
  c.image_url,
  c.label_sq,
  c.label_en,
  c.label_de,
  c.default_min_price,
  COALESCE(s.min_price, NULL) AS min_price,
  COALESCE(s.vehicle_count, 0) AS vehicle_count
FROM public.vehicle_categories c
LEFT JOIN LATERAL (
  SELECT
    MIN(price_per_day) AS min_price,
    COUNT(*) AS vehicle_count
  FROM public.vehicles v
  WHERE v.category = c.key
    AND v.is_published = true
    AND v.is_available = true
    AND v.deleted_at IS NULL
) s ON true;

GRANT SELECT ON public.vehicle_categories_with_stats TO anon, authenticated;

-- ============================================================================
-- 3. daily_offers
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_percent int NOT NULL DEFAULT 10 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_offers_active_window
  ON public.daily_offers(is_active, starts_at, ends_at)
  WHERE is_active = true;

ALTER TABLE public.daily_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active offers" ON public.daily_offers;
CREATE POLICY "Public read active offers"
  ON public.daily_offers FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND starts_at <= now() AND ends_at >= now());

DROP POLICY IF EXISTS "Super admin manages offers" ON public.daily_offers;
CREATE POLICY "Super admin manages offers"
  ON public.daily_offers FOR ALL
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

-- ============================================================================
-- 4. discount_codes (referenced as FK ne bookings — kritike!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'percent' CHECK (type IN ('percent', 'fixed')),
  value numeric(10, 2) NOT NULL CHECK (value > 0),
  min_amount numeric(10, 2) NOT NULL DEFAULT 0,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code) WHERE is_active = true;

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Public mund te lexoje (per validim ne checkout) por vetem aktiv + jo skaduar
DROP POLICY IF EXISTS "Public read valid codes" ON public.discount_codes;
CREATE POLICY "Public read valid codes"
  ON public.discount_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

DROP POLICY IF EXISTS "Super admin manages codes" ON public.discount_codes;
CREATE POLICY "Super admin manages codes"
  ON public.discount_codes FOR ALL
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

-- ============================================================================
-- 5. legal_pages (CMS per Terms/Privacy/Cookies/etj.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.legal_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Cdokush mund t'i lexoje ligjore (perfshire anon — krijon faqe publike)
DROP POLICY IF EXISTS "Public read legal pages" ON public.legal_pages;
CREATE POLICY "Public read legal pages"
  ON public.legal_pages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Super admin manages legal pages" ON public.legal_pages;
CREATE POLICY "Super admin manages legal pages"
  ON public.legal_pages FOR ALL
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin')
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

-- ============================================================================
-- 6. notification_logs (admin audit trail per dergesa)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_filter text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'broadcast',
  recipient_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created
  ON public.notification_logs(created_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin reads notification logs" ON public.notification_logs;
CREATE POLICY "Super admin reads notification logs"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

DROP POLICY IF EXISTS "Super admin writes notification logs" ON public.notification_logs;
CREATE POLICY "Super admin writes notification logs"
  ON public.notification_logs FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

DROP POLICY IF EXISTS "service_role manages notification_logs" ON public.notification_logs;
CREATE POLICY "service_role manages notification_logs"
  ON public.notification_logs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- Updated_at trigger (re-use existing helper nese ekziston)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vehicle_categories_updated_at') THEN
    CREATE TRIGGER trg_vehicle_categories_updated_at
      BEFORE UPDATE ON public.vehicle_categories
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- set_updated_at function nuk ekziston ne kete DB; krijoji nje minimal.
  CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $func$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
  $func$;
  CREATE TRIGGER trg_vehicle_categories_updated_at
    BEFORE UPDATE ON public.vehicle_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_legal_pages_updated_at') THEN
    CREATE TRIGGER trg_legal_pages_updated_at
      BEFORE UPDATE ON public.legal_pages
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
