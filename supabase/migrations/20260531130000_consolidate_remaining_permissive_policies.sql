-- Konsolidim i policave RLS overlapping per te eliminuar
-- `multiple_permissive_policies` warnings nga Supabase advisor (11 raste).
--
-- Problemi: kur ka >=2 polica permissive per te njejtin (role, action), Postgres
-- duhet ti vleresoje TE GJITHA per cdo rresht — koste e shtuar pa perfitim.
--
-- Pattern qe po rregullojme:
-- Shume tabela kane nje policy `FOR ALL` (psh. "Company manages own X") qe pa
-- dashje aplikohet edhe per SELECT, plus nje policy dedikuar `FOR SELECT`
-- (psh. "X readable by all"). Splittim FOR ALL → FOR INSERT/UPDATE/DELETE,
-- duke ruajtur ekzaktesisht te njejten semantike.
--
-- Tabelat e prekura: booking_extras, homepage_settings, insurance_plans,
-- partner_platforms, pickup_locations, vehicle_extras, vehicle_unavailability.

-- ============================================================================
-- 1. booking_extras (SELECT overlap)
-- ============================================================================
-- "Booking extras manage by client/company" (ALL) overlap me
-- "Booking extras visible to booking participants" (SELECT, qe ka edhe super_admin)
-- Split ALL → INSERT/UPDATE/DELETE me te njejtin predicate (pa super_admin).

DROP POLICY IF EXISTS "Booking extras manage by client/company" ON public.booking_extras;

CREATE POLICY "Booking extras insert by client/company"
ON public.booking_extras
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_extras.booking_id
      AND (
        b.client_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = b.company_id
            AND c.owner_id = (SELECT auth.uid())
        )
      )
  )
);

CREATE POLICY "Booking extras update by client/company"
ON public.booking_extras
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_extras.booking_id
      AND (
        b.client_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = b.company_id
            AND c.owner_id = (SELECT auth.uid())
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_extras.booking_id
      AND (
        b.client_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = b.company_id
            AND c.owner_id = (SELECT auth.uid())
        )
      )
  )
);

CREATE POLICY "Booking extras delete by client/company"
ON public.booking_extras
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_extras.booking_id
      AND (
        b.client_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM companies c
          WHERE c.id = b.company_id
            AND c.owner_id = (SELECT auth.uid())
        )
      )
  )
);

-- ============================================================================
-- 2. homepage_settings (SELECT + INSERT overlap)
-- ============================================================================
-- "Super admins can update homepage settings" (ALL) overlap me dedicated
-- SELECT ("Public can read") dhe INSERT ("Super admins can insert").
-- Split ALL → UPDATE + DELETE.

DROP POLICY IF EXISTS "Super admins can update homepage settings" ON public.homepage_settings;

CREATE POLICY "Super admins update homepage settings"
ON public.homepage_settings
FOR UPDATE
TO authenticated
USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
WITH CHECK (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "Super admins delete homepage settings"
ON public.homepage_settings
FOR DELETE
TO authenticated
USING (((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin');

-- ============================================================================
-- 3. insurance_plans (SELECT overlap)
-- ============================================================================
-- "Company manages own insurance plans" (ALL) overlap me
-- "Insurance plans readable by all" (SELECT).
-- Split ALL → INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS "Company manages own insurance plans" ON public.insurance_plans;

CREATE POLICY "Company inserts own insurance plans"
ON public.insurance_plans
FOR INSERT
TO authenticated
WITH CHECK (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = insurance_plans.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Company updates own insurance plans"
ON public.insurance_plans
FOR UPDATE
TO authenticated
USING (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = insurance_plans.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = insurance_plans.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Company deletes own insurance plans"
ON public.insurance_plans
FOR DELETE
TO authenticated
USING (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = insurance_plans.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- 4. partner_platforms (SELECT overlap)
-- ============================================================================
-- "partner platforms admin write" (ALL, is_super_admin()) overlap me
-- "partner platforms public read" (SELECT).
-- Split ALL → INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS "partner platforms admin write" ON public.partner_platforms;

CREATE POLICY "partner platforms admin insert"
ON public.partner_platforms
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

CREATE POLICY "partner platforms admin update"
ON public.partner_platforms
FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "partner platforms admin delete"
ON public.partner_platforms
FOR DELETE
TO authenticated
USING (is_super_admin());

-- ============================================================================
-- 5. pickup_locations (SELECT overlap)
-- ============================================================================
-- "Company manages own locations" (ALL) overlap me
-- "Pickup locations readable by all" (SELECT).
-- Split ALL → INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS "Company manages own locations" ON public.pickup_locations;

CREATE POLICY "Company inserts own locations"
ON public.pickup_locations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = pickup_locations.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Company updates own locations"
ON public.pickup_locations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = pickup_locations.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = pickup_locations.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Company deletes own locations"
ON public.pickup_locations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = pickup_locations.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- 6. vehicle_extras (SELECT overlap)
-- ============================================================================
-- "Company manages own extras" (ALL) overlap me
-- "Vehicle extras readable by all" (SELECT).
-- Split ALL → INSERT/UPDATE/DELETE.

DROP POLICY IF EXISTS "Company manages own extras" ON public.vehicle_extras;

CREATE POLICY "Company inserts own vehicle extras"
ON public.vehicle_extras
FOR INSERT
TO authenticated
WITH CHECK (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = vehicle_extras.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Company updates own vehicle extras"
ON public.vehicle_extras
FOR UPDATE
TO authenticated
USING (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = vehicle_extras.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = vehicle_extras.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Company deletes own vehicle extras"
ON public.vehicle_extras
FOR DELETE
TO authenticated
USING (
  (company_id IS NULL AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'super_admin')
  OR EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = vehicle_extras.company_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- 7. vehicle_unavailability (DELETE + INSERT + SELECT + UPDATE overlap)
-- ============================================================================
-- "Super admins manage unavailability" (ALL, is_super_admin()) overlap ne 4
-- veprime me 4 polica te dedikuara per "Company staff X own unavailability".
-- Konsolido cdo veprim ne nje policy te vetme me OR (super_admin OR company_staff).

DROP POLICY IF EXISTS "Super admins manage unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Company staff delete own unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Company staff insert own unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Company staff view own unavailability" ON public.vehicle_unavailability;
DROP POLICY IF EXISTS "Company staff update own unavailability" ON public.vehicle_unavailability;

CREATE POLICY "vehicle_unavailability select consolidated"
ON public.vehicle_unavailability
FOR SELECT
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM vehicles v
    JOIN companies c ON c.id = v.company_id
    WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "vehicle_unavailability insert consolidated"
ON public.vehicle_unavailability
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM vehicles v
    JOIN companies c ON c.id = v.company_id
    WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "vehicle_unavailability update consolidated"
ON public.vehicle_unavailability
FOR UPDATE
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM vehicles v
    JOIN companies c ON c.id = v.company_id
    WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM vehicles v
    JOIN companies c ON c.id = v.company_id
    WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "vehicle_unavailability delete consolidated"
ON public.vehicle_unavailability
FOR DELETE
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM vehicles v
    JOIN companies c ON c.id = v.company_id
    WHERE v.id = vehicle_unavailability.vehicle_id
      AND c.owner_id = (SELECT auth.uid())
  )
);
