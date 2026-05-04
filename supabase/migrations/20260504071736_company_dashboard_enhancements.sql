/*
  # Company Dashboard Enhancements

  1. Vehicles: soft delete column
    - `deleted_at` timestamptz (nullable) — marks a vehicle as deleted without losing FK data

  2. Bookings: private internal notes
    - `internal_notes` text — visible only to the company that owns the booking's vehicle

  3. New table `vehicle_unavailability`
    - Stores maintenance / damage / offline-reserved windows per vehicle.
    - Used by `available_vehicles` RPC to block out datetime ranges.

  4. Update RPC `available_vehicles`
    - Exclude soft-deleted vehicles
    - Exclude vehicles with overlapping unavailability windows in the query range

  5. Security
    - RLS enabled on `vehicle_unavailability`
    - Company staff can manage only rows for their company's vehicles
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vehicles' AND column_name='deleted_at') THEN
    ALTER TABLE vehicles ADD COLUMN deleted_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='internal_notes') THEN
    ALTER TABLE bookings ADD COLUMN internal_notes text DEFAULT '';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at);

CREATE TABLE IF NOT EXISTS vehicle_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'maintenance' CHECK (type IN ('maintenance','damage','reserved_offline')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

ALTER TABLE vehicle_unavailability ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_vehicle_unavail_vehicle_id ON vehicle_unavailability(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_unavail_dates ON vehicle_unavailability(start_date, end_date);

DROP POLICY IF EXISTS "Company staff view own unavailability" ON vehicle_unavailability;
CREATE POLICY "Company staff view own unavailability"
  ON vehicle_unavailability FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company staff insert own unavailability" ON vehicle_unavailability;
CREATE POLICY "Company staff insert own unavailability"
  ON vehicle_unavailability FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company staff update own unavailability" ON vehicle_unavailability;
CREATE POLICY "Company staff update own unavailability"
  ON vehicle_unavailability FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Company staff delete own unavailability" ON vehicle_unavailability;
CREATE POLICY "Company staff delete own unavailability"
  ON vehicle_unavailability FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vehicles v
      JOIN companies c ON c.id = v.company_id
      WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admins manage unavailability" ON vehicle_unavailability;
CREATE POLICY "Super admins manage unavailability"
  ON vehicle_unavailability FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE OR REPLACE FUNCTION public.available_vehicles(p_pickup date DEFAULT NULL, p_return date DEFAULT NULL)
RETURNS SETOF vehicles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.*
  FROM vehicles v
  WHERE v.is_published = true
    AND v.is_available = true
    AND v.status = 'active'
    AND v.deleted_at IS NULL
    AND (
      p_pickup IS NULL
      OR p_return IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.vehicle_id = v.id
          AND b.status IN ('pending', 'confirmed', 'active')
          AND b.pickup_date < p_return
          AND b.return_date > p_pickup
      )
    )
    AND (
      p_pickup IS NULL
      OR p_return IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM vehicle_unavailability u
        WHERE u.vehicle_id = v.id
          AND u.start_date < p_return
          AND u.end_date > p_pickup
      )
    );
$$;
