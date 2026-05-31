/*
  # Create discount_codes table

  1. New Tables
    - `discount_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - the discount code string
      - `description` (text) - description of the discount
      - `discount_type` (text) - 'percentage' or 'fixed'
      - `discount_value` (numeric) - the discount amount
      - `min_order_amount` (numeric) - minimum order to apply
      - `max_uses` (integer) - maximum number of uses
      - `current_uses` (integer) - current number of uses
      - `is_active` (boolean) - whether the code is active
      - `starts_at` (timestamptz) - start date
      - `expires_at` (timestamptz) - expiration date
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on discount_codes
    - Authenticated users can read active codes
    - Super admin can manage all codes
*/

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_uses integer DEFAULT 0,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active discount codes"
  ON public.discount_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_super_admin());

CREATE POLICY "Super admin can insert discount codes"
  ON public.discount_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can update discount codes"
  ON public.discount_codes
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin can delete discount codes"
  ON public.discount_codes
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

;
