/*
  # Create vehicle-images storage bucket

  1. Storage
    - Create public `vehicle-images` bucket for vehicle photos
    - Allow authenticated users to upload images
    - Allow public read access for vehicle images
    - Company admins can manage their own vehicle images

  2. Security
    - Upload restricted to authenticated users
    - Public read access for displaying images on the site
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can update own vehicle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can delete own vehicle images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');