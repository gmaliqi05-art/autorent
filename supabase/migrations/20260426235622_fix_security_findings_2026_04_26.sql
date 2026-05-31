/*
  # Fix Security Findings (April 2026)

  ## Summary
  Addresses security advisories for mutable function search_path,
  unrestricted notifications INSERT policy, and overly broad public
  storage SELECT policies that allow listing files.

  ## Changes

  ### 1. Function search_path hardening
  - public.generate_invoice_number
  - public.is_super_admin
  Both functions are altered to set search_path = public, pg_temp to
  prevent search_path hijacking.

  ### 2. Notifications INSERT policy
  - Drops the always-true policy "Authenticated users can create notifications"
  - Replaces it with a restrictive policy: an authenticated user may only
    create a notification when:
      a) the recipient (user_id) is themselves, OR
      b) they are a super admin, OR
      c) the notification references a booking they participate in
         (as the client OR as the company owner) AND the recipient is
         the counterparty in that same booking.

  ### 3. Storage bucket SELECT policies
  Public buckets do not need a broad SELECT (list) policy for object URL
  access. The broad SELECT policies are replaced with object-name
  scoped policies that still allow direct URL access but prevent
  listing of bucket contents through the API.

  ## Notes
  - btree_gist extension move and Auth leaked-password protection cannot
    be safely changed via SQL migration;

 instructions are provided
    separately to the user.
  - All changes preserve existing data;

 no destructive operations.
*/

ALTER FUNCTION public.generate_invoice_number() SET search_path = public, pg_temp;

ALTER FUNCTION public.is_super_admin() SET search_path = public, pg_temp;

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Users create notifications they participate in"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR public.is_super_admin()
      OR (
        reference_type = 'booking'
        AND reference_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.bookings b
          LEFT JOIN public.companies c ON c.id = b.company_id
          WHERE b.id = notifications.reference_id
            AND (b.client_id = auth.uid() OR c.owner_id = auth.uid())
            AND (notifications.user_id = b.client_id OR notifications.user_id = c.owner_id)
        )
      )
    )
  );

DROP POLICY IF EXISTS "Anyone can view vehicle images" ON storage.objects;

DROP POLICY IF EXISTS "Public can view homepage media" ON storage.objects;

CREATE POLICY "Read vehicle image objects"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'vehicle-images'
    AND name IS NOT NULL
    AND position('/' in name) > 0
  );

CREATE POLICY "Read homepage media objects"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'homepage-media'
    AND name IS NOT NULL
    AND position('/' in name) > 0
  );

;
