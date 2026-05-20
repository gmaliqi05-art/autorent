/*
  # Krijon storage buckets per media te ndryshme

  - company-media (public): per logo + cover image te kompanive
  - ad-images (public): per reklama + oferta ditore

  RLS policies:
  - Lexim publik (te dyja jane public buckets)
  - Upload: vetem super_admin (per ad-images) ose owner i kompanise (per company-media)
*/

-- ============================================================================
-- 1. company-media bucket
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-media', 'company-media', true)
ON CONFLICT (id) DO NOTHING;

-- Lexim publik (cilido)
DROP POLICY IF EXISTS "Company media public read" ON storage.objects;
CREATE POLICY "Company media public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'company-media');

-- Upload nga owner i kompanise: path strukturohet si <company_id>/<filename>
-- Owner i kompanise mund te ngarkoje ne folder-in e tij
DROP POLICY IF EXISTS "Company owners can upload media" ON storage.objects;
CREATE POLICY "Company owners can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-media'
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id::text = (storage.foldername(name))[1]
        AND companies.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company owners can update media" ON storage.objects;
CREATE POLICY "Company owners can update media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-media'
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id::text = (storage.foldername(name))[1]
        AND companies.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company owners can delete media" ON storage.objects;
CREATE POLICY "Company owners can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-media'
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id::text = (storage.foldername(name))[1]
        AND companies.owner_id = auth.uid()
    )
  );

-- Super admin mund te beje cdo gje
DROP POLICY IF EXISTS "Super admin manages company media" ON storage.objects;
CREATE POLICY "Super admin manages company media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'company-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    bucket_id = 'company-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- ============================================================================
-- 2. ad-images bucket (per platform_ads + daily_offers)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO NOTHING;

-- Lexim publik
DROP POLICY IF EXISTS "Ad images public read" ON storage.objects;
CREATE POLICY "Ad images public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ad-images');

-- Vetem super_admin uploads
DROP POLICY IF EXISTS "Super admin manages ad images" ON storage.objects;
CREATE POLICY "Super admin manages ad images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'ad-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    bucket_id = 'ad-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
