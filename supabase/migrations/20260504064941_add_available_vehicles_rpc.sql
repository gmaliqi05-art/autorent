/*
  # Available Vehicles RPC + Booking Index

  1. New RPC
    - `available_vehicles(p_pickup date, p_return date)` returns only published & active
      vehicles that have no conflicting bookings (pending/confirmed/active)
      in the requested date range. If either date is NULL, availability is
      not filtered.
    - Marked SECURITY DEFINER so it can read from bookings table without RLS
      blocking anonymous visitors, while only returning non-sensitive vehicle rows.
    - Granted EXECUTE to anon and authenticated.

  2. New Index
    - `idx_bookings_vehicle_dates` on bookings(vehicle_id, pickup_date, return_date)
      accelerates the availability conflict lookup used both by the RPC and by
      VehicleDetailPage booking flow.

  3. Security
    - Function body is read-only (SELECT). It exposes only already-published
      vehicles (the same rows already visible to anonymous users via RLS).
    - No mutation capability added.
*/

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates
  ON bookings (vehicle_id, pickup_date, return_date);

CREATE OR REPLACE FUNCTION available_vehicles(
  p_pickup date DEFAULT NULL,
  p_return date DEFAULT NULL
)
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
    AND (
      p_pickup IS NULL
      OR p_return IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM bookings b
        WHERE b.vehicle_id = v.id
          AND b.status IN ('pending', 'confirmed', 'active')
          AND b.pickup_date < p_return
          AND b.return_date > p_pickup
      )
    );
$$;

GRANT EXECUTE ON FUNCTION available_vehicles(date, date) TO anon, authenticated;
