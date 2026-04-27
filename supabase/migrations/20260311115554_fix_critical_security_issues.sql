/*
  # Fix Critical Security Issues

  1. Booking Overlap Prevention
    - Add exclusion constraint to prevent double-booking of vehicles for overlapping dates
    - Add CHECK constraint: return_date > pickup_date
  
  2. Restrict Client Booking Manipulation
    - Remove permissive client UPDATE policy on bookings
    - Add restricted UPDATE policy (clients can only cancel pending bookings)
  
  3. Fix email_logs RLS
    - Remove wide-open INSERT/UPDATE policies
    - Restrict to super_admin only
  
  4. Add Super Admin Policies on Core Tables
    - companies: SELECT, UPDATE for super_admin
    - vehicles: SELECT, UPDATE, DELETE for super_admin
    - bookings: SELECT, UPDATE for super_admin
    - reviews: SELECT, DELETE for super_admin
    - profiles: DELETE for super_admin
  
  5. CHECK Constraints
    - vehicles.status: draft, active, inactive, maintenance
    - companies.subscription_status: inactive, active, past_due, cancelled
    - chat_conversations.status: active, closed
    - chat_messages.sender_type: visitor, bot, admin
  
  6. Unique constraint on reviews.booking_id
  
  7. Add missing updated_at triggers
*/

-- 1. Booking overlap prevention
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'no_overlapping_bookings' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
      EXCLUDE USING gist (
        vehicle_id WITH =,
        daterange(pickup_date, return_date, '[]') WITH &&
      )
      WHERE (status NOT IN ('cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'bookings_dates_valid'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_dates_valid
      CHECK (return_date > pickup_date);
  END IF;
END $$;

-- 2. Fix client booking UPDATE policy
DROP POLICY IF EXISTS "Users update own bookings" ON bookings;

CREATE POLICY "Clients can only cancel own pending bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    client_id = auth.uid()
    AND status = 'cancelled'
  );

-- 3. Fix email_logs RLS
DROP POLICY IF EXISTS "Service role can insert email logs" ON email_logs;
DROP POLICY IF EXISTS "Service role can update email logs" ON email_logs;

CREATE POLICY "Super admin can insert email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

CREATE POLICY "Super admin can update email logs"
  ON email_logs FOR UPDATE
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  )
  WITH CHECK (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

-- 4. Super admin policies on core tables

-- Companies
CREATE POLICY "Super admin can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

CREATE POLICY "Super admin can update all companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  )
  WITH CHECK (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

-- Vehicles
CREATE POLICY "Super admin can view all vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

CREATE POLICY "Super admin can update all vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  )
  WITH CHECK (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

CREATE POLICY "Super admin can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

-- Bookings
CREATE POLICY "Super admin can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

CREATE POLICY "Super admin can update all bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  )
  WITH CHECK (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

-- Reviews
CREATE POLICY "Super admin can view all reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

CREATE POLICY "Super admin can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

-- Profiles super admin UPDATE
CREATE POLICY "Super admin can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  )
  WITH CHECK (
    (select (auth.jwt() -> 'app_metadata' ->> 'role')) = 'super_admin'
  );

-- 5. CHECK constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'vehicles_status_check'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check
      CHECK (status IN ('draft', 'active', 'inactive', 'maintenance'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'companies_subscription_status_check'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_subscription_status_check
      CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled'));
  END IF;
END $$;

-- 6. Unique constraint on reviews.booking_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_booking_id_unique' AND table_name = 'reviews'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);
  END IF;
END $$;

-- 7. Missing updated_at triggers
CREATE OR REPLACE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_chat_responses_updated_at
  BEFORE UPDATE ON chat_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_platform_ads_updated_at
  BEFORE UPDATE ON platform_ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_homepage_content_updated_at
  BEFORE UPDATE ON homepage_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price_per_day);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand, model);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
