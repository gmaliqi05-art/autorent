/*
  # Krijimi i Storage bucket për imazhet e automjeteve

  1. Storage Bucket
    - Krijon bucket 'vehicle-images' për imazhet e automjeteve
    - Publikt i aksesueshem për lexim
    - Vetëm përdoruesit e autentifikuar mund të ngarkojnë

  2. Politikat
    - Të gjithë mund të lexojnë imazhet (publikt)
    - Vetëm company_admin mund të ngarkojnë imazhe
    - Vetëm company_admin mund të fshijnë imazhet e tyre
*/

-- Krijoni bucket për imazhet e automjeteve
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politika për lexim publik
CREATE POLICY "Imazhet janë publikisht të lexueshme"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Politika për ngarkimin e imazheve nga company admins
CREATE POLICY "Company admins mund të ngarkojnë imazhe"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images' AND
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'company_admin'
);

-- Politika për fshirjen e imazheve nga pronarët
CREATE POLICY "Company admins mund të fshijnë imazhet e tyre"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-images' AND
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'company_admin'
);

-- Politika për përditësimin e imazheve
CREATE POLICY "Company admins mund të përditësojnë imazhet e tyre"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vehicle-images' AND
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'company_admin'
)
WITH CHECK (
  bucket_id = 'vehicle-images' AND
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'company_admin'
);
