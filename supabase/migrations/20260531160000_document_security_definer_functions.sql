-- Dokumentim i qellimit per SECURITY DEFINER funksione (audit 2.3 P1).
--
-- Advisor po raporton warnings (0028/0029) per 9 funksione SECURITY DEFINER te
-- ekspozuara nepermjet PostgREST. COMMENT ON FUNCTION dokumenton arsyen biznesi
-- ne db, qe reviewer-at e ardhshem te kuptojne pse DEFINER eshte i nevojshem.
--
-- SHENIM: Advisor warning-et VAZHDOJNE te shfaqen pas ketij migrimi.
-- Per t'i hequr, do duhej REVOKE EXECUTE FROM anon/authenticated, gje qe
-- prish flow-n e biznesit. Cdo funksion ne kete liste eshte audituar dhe
-- konfirmuar qe DEFINER eshte i nevojshem.

-- ============================================================================
-- Funksione publike (anon + authenticated) — kerkim publik, kalendar publik
-- ============================================================================

COMMENT ON FUNCTION public.available_vehicles(p_pickup date, p_return date) IS
'SECURITY DEFINER: i nevojshem qe anon te shohe vetura te publikuara pa lexuar
direkt tabelat e brendshme bookings/vehicle_unavailability (te cilat kane RLS
strikt). Funksioni filtron vetem vetura te publikuara/aktive dhe kthen vetem
ato qe nuk kane konflikt me bookings/unavailability ne intervalin e dhene.
Asnje informacion i ndjeshem nuk ekspozohet.';

COMMENT ON FUNCTION public.vehicle_blocked_dates(p_vehicle_id uuid, p_from date, p_to date) IS
'SECURITY DEFINER: i nevojshem qe anon te lexoje data te bllokuara per
kalendarin publik. Kthen vetem (start_date, end_date, reason) — pa client_id,
pa pagese, pa info personale. Bookings RLS do bllokonte direkt anon, ndaj
funksioni eshte i shtypur per te kthyer vetem date ranges.';

-- ============================================================================
-- Funksione vetem per authenticated
-- ============================================================================

COMMENT ON FUNCTION public.is_super_admin() IS
'SECURITY DEFINER: i ruajtur per kompatibilitet me thirrjet ekzistuese ne
polica RLS. Pyetja WHERE id = auth.uid() AND role = ''super_admin'' eshte
vete-perqendrore (vetem rreshti i perdoruesit). Mund t''i kthehet SECURITY
INVOKER ne te ardhmen kur te kontrollohen te gjitha thirrjet.';

COMMENT ON FUNCTION public.create_company_for_current_user(
  p_name text, p_phone text, p_email text, p_city text, p_country text,
  p_city_id uuid, p_country_id uuid, p_subscription_plan_id uuid, p_billing_cycle text
) IS
'SECURITY DEFINER: i nevojshem sepse funksioni UPDATE-on profiles.role nga
"client" ne "company_admin" — RLS nuk lejon ndryshim role-i nga vete
perdoruesi. Authz e brendshme: kerkon auth.uid() NOT NULL, validon emrin/
billing_cycle, kontrollon qe perdoruesi nuk ka tashme kompani. Per onboarding
flow te kompanive te reja.';

COMMENT ON FUNCTION public.update_own_profile(
  p_full_name text, p_phone text, p_avatar_url text,
  p_country_id uuid, p_city_id uuid, p_preferred_language text
) IS
'SECURITY DEFINER: i nevojshem per te kapercyer disa kontrolle RLS te
ndera-veprimit me profiles. Authz e brendshme: kerkon auth.uid() NOT NULL,
validon preferred_language kunder whitelist (sq/en/de/it/fr/nl/pl), update-i
behet vetem ne profile WHERE id = auth.uid().';

COMMENT ON FUNCTION public.log_audit_event(
  p_action text, p_entity_type text, p_entity_id uuid, p_changes jsonb
) IS
'SECURITY DEFINER: i nevojshem per te shkruar ne public.audit_logs, qe ka
RLS qe lejon vetem service_role/super_admin. Authz e brendshme: refuzon
nese caller nuk eshte service_role OSE super_admin (kontrollohet nga
request.jwt.claim.role dhe auth.jwt() -> app_metadata).';

COMMENT ON FUNCTION public.get_partner_platform_stats(p_platform_id uuid, p_days integer) IS
'SECURITY DEFINER: i nevojshem per agregim statistikash nga partner_clicks
(RLS bllokon leximin direct). Authz e brendshme: refuzon caller-at qe nuk
jane super_admin (kthen jsonb me error="unauthorized").';
