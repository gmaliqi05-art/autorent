/*
  # RPC: vehicle_blocked_dates

  Kthen daterange-et e bllokuara per nje vetur ne nje interval kohor.
  Perdoret nga komponenti AvailabilityCalendar ne front-end.

  Burime te bllokimit:
    1. Rezervime active/pending/confirmed
    2. vehicle_unavailability windows (maintenance/damage/reserved_offline)
*/

CREATE OR REPLACE FUNCTION public.vehicle_blocked_dates(
  p_vehicle_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  start_date date,
  end_date date,
  reason text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    GREATEST(b.pickup_date, p_from) AS start_date,
    LEAST(b.return_date, p_to) AS end_date,
    'booked'::text AS reason
  FROM public.bookings b
  WHERE b.vehicle_id = p_vehicle_id
    AND b.status IN ('pending', 'confirmed', 'active')
    AND b.pickup_date <= p_to
    AND b.return_date >= p_from

  UNION ALL

  SELECT
    GREATEST(u.start_date, p_from) AS start_date,
    LEAST(u.end_date, p_to) AS end_date,
    u.type AS reason
  FROM public.vehicle_unavailability u
  WHERE u.vehicle_id = p_vehicle_id
    AND u.start_date <= p_to
    AND u.end_date >= p_from
  ORDER BY start_date;
$$;

REVOKE EXECUTE ON FUNCTION public.vehicle_blocked_dates(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vehicle_blocked_dates(uuid, date, date) TO anon, authenticated;
