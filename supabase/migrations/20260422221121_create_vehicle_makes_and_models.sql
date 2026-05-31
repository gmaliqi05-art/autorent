/*
  # Create vehicle_makes and vehicle_models tables

  1. New Tables
    - `vehicle_makes`
      - `id` (uuid, primary key)
      - `name` (text, unique) - brand name (e.g. "Toyota", "BMW")
      - `logo_url` (text) - optional brand logo
      - `created_at` (timestamptz)
    - `vehicle_models`
      - `id` (uuid, primary key)
      - `make_id` (uuid, FK to vehicle_makes)
      - `name` (text) - model name (e.g. "Corolla", "X5")
      - `created_at` (timestamptz)
      - Unique constraint on (make_id, name)

  2. Security
    - Enable RLS on both tables
    - All authenticated users can read
    - Super admins can manage (insert/update/delete)
*/

CREATE TABLE IF NOT EXISTS public.vehicle_makes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.vehicle_makes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read vehicle makes"
  ON public.vehicle_makes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin can insert vehicle makes"
  ON public.vehicle_makes FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update vehicle makes"
  ON public.vehicle_makes FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete vehicle makes"
  ON public.vehicle_makes FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.vehicle_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id uuid NOT NULL REFERENCES public.vehicle_makes(id),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(make_id, name)
);

ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read vehicle models"
  ON public.vehicle_models FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin can insert vehicle models"
  ON public.vehicle_models FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update vehicle models"
  ON public.vehicle_models FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete vehicle models"
  ON public.vehicle_models FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_vehicle_models_make_id ON public.vehicle_models(make_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_makes_name ON public.vehicle_makes(name);

;
