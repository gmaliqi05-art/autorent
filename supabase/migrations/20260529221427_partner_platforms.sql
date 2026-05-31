-- Cross-platform deep-link bridge (Plan A) — sister to Balkania.
CREATE TABLE IF NOT EXISTS public.partner_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  logo_url text,
  base_url text NOT NULL,
  deeplink_template text NOT NULL DEFAULT '/',
  commission_pct numeric(5,2) DEFAULT 0,
  brand_color text DEFAULT '#0EA5E9',
  visible_in_slots text[] NOT NULL DEFAULT ARRAY['booking_confirmation'],
  webhook_secret text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_platforms_active
  ON public.partner_platforms(is_active, display_order)
  WHERE is_active = true;

ALTER TABLE public.partner_platforms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner platforms public read" ON public.partner_platforms;
CREATE POLICY "partner platforms public read"
  ON public.partner_platforms FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "partner platforms admin write" ON public.partner_platforms;
CREATE POLICY "partner platforms admin write"
  ON public.partner_platforms FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.partner_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid NOT NULL REFERENCES public.partner_platforms(id) ON DELETE CASCADE,
  click_token text NOT NULL UNIQUE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  slot text NOT NULL,
  source_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  source_vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  deeplink_url text NOT NULL,
  converted_at timestamptz,
  conversion_amount numeric(10,2),
  conversion_currency text,
  commission_amount numeric(10,2),
  partner_reference text,
  user_agent text,
  referer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_clicks_platform_date
  ON public.partner_clicks(platform_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_user
  ON public.partner_clicks(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_clicks_converted
  ON public.partner_clicks(converted_at)
  WHERE converted_at IS NOT NULL;

ALTER TABLE public.partner_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner clicks insert open" ON public.partner_clicks;
CREATE POLICY "partner clicks insert open"
  ON public.partner_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "partner clicks owner read" ON public.partner_clicks;
CREATE POLICY "partner clicks owner read"
  ON public.partner_clicks FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_super_admin());

CREATE OR REPLACE FUNCTION public.get_partner_platform_stats(p_platform_id uuid, p_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_clicks int;
  v_total_conversions int;
  v_conversion_rate numeric;
BEGIN
  IF NOT public.is_super_admin() THEN
    RETURN jsonb_build_object('error', 'unauthorized');
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE converted_at IS NOT NULL)
  INTO v_total_clicks, v_total_conversions
  FROM public.partner_clicks
  WHERE platform_id = p_platform_id
    AND created_at >= (now() - (p_days || ' days')::interval);

  v_conversion_rate := CASE WHEN v_total_clicks > 0
    THEN ROUND((v_total_conversions::numeric / v_total_clicks) * 100, 2)
    ELSE 0
  END;

  RETURN jsonb_build_object(
    'platform_id', p_platform_id,
    'window_days', p_days,
    'clicks', v_total_clicks,
    'conversions', v_total_conversions,
    'conversion_rate_pct', v_conversion_rate
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_partner_platform_stats(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_partner_platform_stats(uuid, int) TO authenticated, service_role;

INSERT INTO public.partner_platforms (
  slug, name, tagline, base_url, deeplink_template,
  commission_pct, brand_color, visible_in_slots, is_active, display_order
) VALUES (
  'balkania',
  'Balkania',
  'Gjej dhe rezervo akomodimin tënd për këtë udhëtim — apartamente, hotele dhe vila në mbarë Ballkanin',
  'https://balkania.life',
  '/properties?city={city}&check_in={check_in}&check_out={check_out}&guests={guests}&utm_source=rentacar&utm_medium=suggestion&utm_campaign={slot}&ref={click_token}',
  0,
  '#0F766E',
  ARRAY['booking_confirmation', 'booking_invoice', 'vehicle_detail'],
  true,
  1
)
ON CONFLICT (slug) DO NOTHING;;\n