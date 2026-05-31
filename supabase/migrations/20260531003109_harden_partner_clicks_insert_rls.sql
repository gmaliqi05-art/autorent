-- Hardens RLS on public.partner_clicks INSERT
-- Before: WITH CHECK (true) per roles {anon, authenticated} — pranonte cdo te dhene
-- te falsifikuar (commission_amount, partner_reference, fake platform_id) per cdo
-- person ne internet, te ruajtur ne DB pa kontroll. Nje bot mund te shtonte
-- miliona rreshta ne ndare sekonda dhe te falsifikonte konvertime.
--
-- After:
--  * platform_id duhet te ekzistoje + is_active = true
--  * slot duhet te jete brenda visible_in_slots te asaj platforme
--  * fushat e konvertimit (converted_at, conversion_*, commission_*, partner_reference)
--    duhet te jene NULL — vetem stripe-paypal webhook (qe rrjedh me service_role)
--    mund te perditesoje keto kollona pas inicimit.
--  * user_id ose NULL ose match-on me auth.uid() (s'mund te shenosh klikun
--    si te dikujt tjeter)
--  * click_token duhet te jete >= 16 karaktere (UUID v4 = 36ch ose hash-i)
--  * deeplink_url duhet te jete jashtem (https) — s'lejon javascript:/data:

ALTER POLICY "partner clicks insert open"
  ON public.partner_clicks
  RENAME TO "partner clicks insert validated";

ALTER POLICY "partner clicks insert validated"
  ON public.partner_clicks
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_platforms pp
      WHERE pp.id = partner_clicks.platform_id
        AND pp.is_active = true
        AND partner_clicks.slot = ANY(pp.visible_in_slots)
    )
    AND partner_clicks.converted_at IS NULL
    AND partner_clicks.conversion_amount IS NULL
    AND partner_clicks.conversion_currency IS NULL
    AND partner_clicks.commission_amount IS NULL
    AND partner_clicks.partner_reference IS NULL
    AND (
      partner_clicks.user_id IS NULL
      OR partner_clicks.user_id = (SELECT auth.uid())
    )
    AND char_length(partner_clicks.click_token) BETWEEN 16 AND 128
    AND partner_clicks.deeplink_url LIKE 'https://%'
    AND char_length(partner_clicks.deeplink_url) <= 2048
    AND (partner_clicks.user_agent IS NULL OR char_length(partner_clicks.user_agent) <= 512)
    AND (partner_clicks.referer IS NULL OR char_length(partner_clicks.referer) <= 2048)
  );

CREATE INDEX IF NOT EXISTS partner_clicks_platform_id_idx
  ON public.partner_clicks(platform_id);

CREATE INDEX IF NOT EXISTS partner_clicks_source_booking_id_idx
  ON public.partner_clicks(source_booking_id)
  WHERE source_booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_clicks_source_vehicle_id_idx
  ON public.partner_clicks(source_vehicle_id)
  WHERE source_vehicle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS partner_clicks_user_id_created_idx
  ON public.partner_clicks(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMENT ON POLICY "partner clicks insert validated" ON public.partner_clicks IS
  'Anon/auth perdoruesit lejohen te shenojne nje klik vetem nese platforma+slot eshte i njohur, fushat e konvertimit jane NULL (vendosen vetem nga webhook me service_role), dhe user_id eshte NULL ose i tyre.';
