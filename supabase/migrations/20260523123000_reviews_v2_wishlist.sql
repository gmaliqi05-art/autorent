/*
  # Reviews v2 + Wishlist + Saved Searches (audit 2026-05-23)

  1. reviews v2: shtohen kolona vehicle_id, ratings_breakdown, company_reply,
     helpful_count, photos.

  2. wishlist: tabele e re per ruajtjen e automjeteve te preferuara.

  3. saved_searches: ruan kerkimet me alert email.

  4. damage_reports: pre/post inspection me foto (kerkese e industrise).
*/

-- ============================================================================
-- 1. REVIEWS v2 — fusha shtese
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='vehicle_id') THEN
    ALTER TABLE public.reviews ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id ON public.reviews(vehicle_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='cleanliness_rating') THEN
    ALTER TABLE public.reviews ADD COLUMN cleanliness_rating integer CHECK (cleanliness_rating BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='value_rating') THEN
    ALTER TABLE public.reviews ADD COLUMN value_rating integer CHECK (value_rating BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='service_rating') THEN
    ALTER TABLE public.reviews ADD COLUMN service_rating integer CHECK (service_rating BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='condition_rating') THEN
    ALTER TABLE public.reviews ADD COLUMN condition_rating integer CHECK (condition_rating BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='photos') THEN
    ALTER TABLE public.reviews ADD COLUMN photos text[] NOT NULL DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='company_reply') THEN
    ALTER TABLE public.reviews ADD COLUMN company_reply text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='company_reply_at') THEN
    ALTER TABLE public.reviews ADD COLUMN company_reply_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='helpful_count') THEN
    ALTER TABLE public.reviews ADD COLUMN helpful_count integer NOT NULL DEFAULT 0 CHECK (helpful_count >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='is_verified_booking') THEN
    ALTER TABLE public.reviews ADD COLUMN is_verified_booking boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='is_hidden') THEN
    ALTER TABLE public.reviews ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='hidden_reason') THEN
    ALTER TABLE public.reviews ADD COLUMN hidden_reason text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='updated_at') THEN
    ALTER TABLE public.reviews ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Backfill vehicle_id nga bookings
UPDATE public.reviews r
SET vehicle_id = b.vehicle_id
FROM public.bookings b
WHERE r.booking_id = b.id AND r.vehicle_id IS NULL;

-- Lejo kompanise te shtoje pergjigje
DROP POLICY IF EXISTS "Companies reply to own reviews" ON public.reviews;
CREATE POLICY "Companies reply to own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = reviews.company_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies c WHERE c.id = reviews.company_id AND c.owner_id = auth.uid())
  );

-- Helpful votes table
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (review_id, user_id)
);

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read helpful votes" ON public.review_helpful_votes
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Add own helpful vote" ON public.review_helpful_votes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Remove own helpful vote" ON public.review_helpful_votes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- 2. WISHLIST
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wishlist (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_vehicle ON public.wishlist(vehicle_id);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own wishlist"
  ON public.wishlist FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "User adds to own wishlist"
  ON public.wishlist FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "User removes from own wishlist"
  ON public.wishlist FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- 3. SAVED SEARCHES + PRICE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  alert_enabled boolean NOT NULL DEFAULT false,
  max_price numeric(10,2),
  currency text NOT NULL DEFAULT 'EUR',
  last_alerted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alert ON public.saved_searches(alert_enabled) WHERE alert_enabled = true;

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own saved searches"
  ON public.saved_searches FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. DAMAGE REPORTS (pre/post inspection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('pickup','return')),
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mileage integer,
  fuel_level text CHECK (fuel_level IN ('empty','quarter','half','three_quarter','full')),
  cleanliness text CHECK (cleanliness IN ('poor','fair','good','excellent')),
  exterior_notes text NOT NULL DEFAULT '',
  interior_notes text NOT NULL DEFAULT '',
  photos text[] NOT NULL DEFAULT ARRAY[]::text[],
  damage_marks jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_signature text,
  staff_signature text,
  acknowledged_by_client boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_damage_reports_booking ON public.damage_reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_vehicle ON public.damage_reports(vehicle_id);

ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Damage reports visible to participants"
  ON public.damage_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = damage_reports.booking_id
        AND (
          b.client_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = b.company_id AND c.owner_id = auth.uid())
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
        )
    )
  );

CREATE POLICY "Company creates damage reports"
  ON public.damage_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.companies c ON c.id = b.company_id
      WHERE b.id = damage_reports.booking_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Company updates damage reports"
  ON public.damage_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.companies c ON c.id = b.company_id
      WHERE b.id = damage_reports.booking_id AND c.owner_id = auth.uid()
    )
  );

-- Storage bucket per foto te damage reports (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('damage-reports', 'damage-reports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Damage report photos: company writes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'damage-reports'
    AND EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = auth.uid())
  );

CREATE POLICY "Damage report photos: participants read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'damage-reports'
  );
