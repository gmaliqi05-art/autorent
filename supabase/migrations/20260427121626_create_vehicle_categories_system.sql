/*
  # Vehicle Categories System

  Creates a managed list of vehicle categories so the homepage, listing page, and
  company publish form all share the same source of truth, and so live published
  vehicle counts and minimum prices flow automatically into the homepage tiles.

  1. New Tables
    - `vehicle_categories`
      - `key` (text, primary key) - canonical lowercase identifier
      - `sort_order` (int) - display order on homepage
      - `is_active` (bool) - hide/show on homepage and as filter
      - `image_url` (text) - hero image for the category card
      - `label_sq`, `label_en`, `label_de` (text) - localized names
      - `icon` (text, optional) - lucide icon name
      - `default_min_price` (numeric) - shown when no published vehicle yet
      - `created_at`, `updated_at` (timestamptz)

  2. New Views
    - `vehicle_categories_with_stats` - joins categories with live counts and min price
      from vehicles where is_published, is_available, status='active'

  3. Seed Data
    - 7 canonical categories: ekonomike, kompakte, sedan, suv, luksoz, minivan, furgon

  4. Security
    - Enable RLS on `vehicle_categories`
    - Public SELECT (anon + authenticated) for active categories
    - Admin-only INSERT, UPDATE, DELETE
    - View inherits permissions; granted to anon and authenticated

  5. Performance
    - Index on `vehicles(category)` if missing for faster join in stats view

  Notes
    - Existing `vehicles.category` text column is preserved; categories.key matches values.
*/

CREATE TABLE IF NOT EXISTS vehicle_categories (
  key text PRIMARY KEY,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  label_sq text NOT NULL DEFAULT '',
  label_en text NOT NULL DEFAULT '',
  label_de text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Car',
  default_min_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vehicle_categories'
      AND policyname = 'Public can read active categories'
  ) THEN
    CREATE POLICY "Public can read active categories"
      ON vehicle_categories FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vehicle_categories'
      AND policyname = 'Admin can read all categories'
  ) THEN
    CREATE POLICY "Admin can read all categories"
      ON vehicle_categories FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vehicle_categories'
      AND policyname = 'Admin can insert categories'
  ) THEN
    CREATE POLICY "Admin can insert categories"
      ON vehicle_categories FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vehicle_categories'
      AND policyname = 'Admin can update categories'
  ) THEN
    CREATE POLICY "Admin can update categories"
      ON vehicle_categories FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vehicle_categories'
      AND policyname = 'Admin can delete categories'
  ) THEN
    CREATE POLICY "Admin can delete categories"
      ON vehicle_categories FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);

INSERT INTO vehicle_categories (key, sort_order, image_url, label_sq, label_en, label_de, default_min_price)
VALUES
  ('ekonomike', 1, 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop', 'Ekonomike', 'Economy', 'Economy', 15),
  ('kompakte',  2, 'https://images.pexels.com/photos/100656/pexels-photo-100656.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',  'Kompakte', 'Compact', 'Kompakt', 25),
  ('sedan',     3, 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',  'Sedan', 'Sedan', 'Limousine', 35),
  ('suv',       4, 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',  'SUV', 'SUV', 'SUV', 45),
  ('luksoz',    5, 'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop',  'Luksoz', 'Luxury', 'Luxus', 65),
  ('minivan',   6, 'https://images.pexels.com/photos/14674670/pexels-photo-14674670.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop','Minivan', 'Minivan', 'Minivan', 40),
  ('furgon',    7, 'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop', 'Furgon', 'Van', 'Transporter', 40)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE VIEW vehicle_categories_with_stats AS
SELECT
  c.key,
  c.sort_order,
  c.is_active,
  c.image_url,
  c.label_sq,
  c.label_en,
  c.label_de,
  c.icon,
  c.default_min_price,
  COALESCE(v.vehicle_count, 0)::int AS vehicle_count,
  COALESCE(v.min_price, c.default_min_price) AS min_price
FROM vehicle_categories c
LEFT JOIN (
  SELECT
    category,
    COUNT(*) AS vehicle_count,
    MIN(price_per_day) AS min_price
  FROM vehicles
  WHERE is_published = true
    AND is_available = true
    AND status = 'active'
  GROUP BY category
) v ON v.category = c.key;

GRANT SELECT ON vehicle_categories_with_stats TO anon, authenticated;
