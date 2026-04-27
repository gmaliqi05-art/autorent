/*
  # Create Homepage Media Storage Bucket

  Creates a storage bucket for homepage images (hero background, logo).
  Public read access, admin-only write access.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage-media',
  'homepage-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view homepage media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'homepage-media');

CREATE POLICY "Super admins can upload homepage media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'homepage-media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update homepage media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'homepage-media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete homepage media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'homepage-media'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );
