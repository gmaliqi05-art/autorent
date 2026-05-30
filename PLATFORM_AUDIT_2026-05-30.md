# Platform Audit — Supabase + GitHub
**Project:** RentaCare (`anpspyrowaukdriwsdbs`, eu-central-1)
**Data:** 2026-05-30
**Branch:** `claude/platform-audit-supabase-github-g3MaW`
**Auditor:** Claude Code

---

## 0. Përmbledhje ekzekutive

| Zonë | Sasia | Përparësia më e lartë |
|---|---|---|
| Siguri (Supabase advisor) | 11 WARN, 0 ERROR | `partner_clicks` me `WITH CHECK (true)` për `INSERT` |
| Performancë (Supabase advisor) | 63 WARN + 91 INFO (154 total), 0 ERROR | 35 polica RLS me `auth_rls_initplan`, 27 `multiple_permissive_policies` |
| Drift kod ↔ DB | 7 edge functions + ~7 migrations në DB por jo në repo | Risk i rikrijimit aksidental, mungesë e historikut në Git |
| Higjenë DB | 82 indeksa të papërdorur, 8 FK pa indeks, 1 indeks i dyfishtë | Cleanup i mundshëm |
| `.env` & klient | OK në linje me modelin Vite (`VITE_*`); mungon validimi i prodhimit | Add Sentry/Stripe key checks |

Asnjë lint **ERROR**. Të gjitha gjetjet janë në nivel **WARN** ose **INFO** — domethënë platforma është funksionalisht e sigurt, por ka borxh teknik që duhet adresuar para një rritjeje serioze trafiku ose para auditeve të jashtme.

---

## 1. Gjendja e projektit Supabase

- **Project:** `RentaCare` (`anpspyrowaukdriwsdbs`)
- **Status:** `ACTIVE_HEALTHY`
- **Region:** `eu-central-1`
- **Postgres:** `17.6.1.063` (GA)
- **Tabela publike:** 41 (të gjitha me RLS aktive)
- **Migrations në DB:** 72
- **Edge functions aktive:** 19

---

## 2. Siguri — gjetjet e advisor-it (11 WARN)

### 2.1 P0 — Polica RLS publikisht permissive
**`partner_clicks`** ka polikën `partner clicks insert open` me `WITH CHECK (true)` për `INSERT` aktive për `anon` + `authenticated`.

> Efektivisht çdo vizitor mund të injektojë rreshta arbitrarë në `partner_clicks` (përfshirë `platform_id` të rremë, `referrer` me payload, etj.). Edhe pse tabela duket si telemetri, kjo ekspozon platformën ndaj spamit dhe falsifikimit të analitikave.

**Rekomandim:**
- Kufizo `WITH CHECK` me një predicate: p.sh. të kërkohet `platform_id IN (SELECT id FROM partner_platforms WHERE is_active = true)` dhe lloj `referrer` brenda zonës.
- Konsidero rate-limiting me ekzistueset `rate_limit_buckets` përpara INSERT-it (kalimi nga edge function).

### 2.2 P1 — Ekstension në skemën `public`
- `pg_net` është instaluar në `public` (lint `extension_in_public`). Migrimi në skemën `extensions` është në backlogun e auditit të mëparshëm; ende i pa adresuar.
- **Veprim:** Migrim i kontrolluar, sepse pg_cron / Vault e referencojnë `net.http_post`. Provo në një degë Supabase para se ta aplikosh në prod.

### 2.3 P1 — `SECURITY DEFINER` funksione të ekspozuara në PostgREST
9 funksione `SECURITY DEFINER` janë të thirrshme nëpërmjet `/rest/v1/rpc/...`:

| Funksioni | Roli i lejuar | Qëllimi i pritshëm | Veprim |
|---|---|---|---|
| `available_vehicles(p_pickup, p_return)` | anon + auth | Kërkim publik | OK — qëllim biznesi |
| `vehicle_blocked_dates(p_vehicle_id, p_from, p_to)` | anon + auth | Kalendar publik | OK — qëllim biznesi |
| `is_super_admin()` | auth | Klient check ACL | OK — verifiko që kthen vetëm `bool` |
| `create_company_for_current_user(...)` | auth | Onboard kompanie | OK — flow legjitim |
| `update_own_profile(...)` | auth | Update profili | OK |
| `log_audit_event(...)` | auth | Audit logging | ⚠️ Shqyrto: a duhet të jetë publik? Kufizo dakordësinë e `p_action`/`p_entity_type` |
| `get_partner_platform_stats(p_platform_id, p_days)` | auth | Statistika partnerësh | ⚠️ Verifiko që kthen vetëm të dhëna që përdoruesi ka të drejtë t'i shohë |

**Rekomandim i përgjithshëm:** Komento qëllimisht në çdo funksion `SECURITY DEFINER` arsyen e `definer-it` (në migrim si koment SQL `COMMENT ON FUNCTION ...`), që advisor-i të mos i sinjalizojë vazhdimisht.

---

## 3. Performancë — gjetjet e advisor-it (154 total)

### 3.1 P1 — `auth_rls_initplan` (35 polica)
Polica RLS që rivlerësojnë `auth.uid()` / `auth.role()` për çdo rresht. Zgjidhja e standardit Supabase: mbështilli në `(select auth.uid())` për të lejuar planner-in t'i evaluojë një herë.

**Tabela të prekura (35 polica):** `chat_messages`, `chat_conversations`, `email_logs`, `invoices`, `notifications`, `homepage_settings`, `vehicles`, `pickup_locations`, `audit_logs`, `vehicle_categories`, `client_documents`, `vehicle_unavailability`, `bank_accounts`, `insurance_plans`, `vehicle_extras`, `booking_extras`, `reviews`, `review_helpful_votes`, `wishlist`, `saved_searches`, `damage_reports`.

**Migration shabllon:**
```sql
ALTER POLICY "Users view own conversations or super admin"
ON public.chat_conversations
USING (
  client_id = (select auth.uid())
  OR company_id IN (select company_id from profiles where id = (select auth.uid()))
  OR (select public.is_super_admin())
);
```

### 3.2 P1 — `multiple_permissive_policies` (27 raste)
Tabelat me shumë polica permissive overlapping për të njëjtin `(role, action)` paguajnë kosto për çdo SELECT/UPDATE.

**Hotspots:**
- `bookings` SELECT — 3 polica (`Company admins view company bookings`, `Super admin can view all bookings`, `Users view own bookings`).
- `vehicles` SELECT — 3 polica (`Company admins view own vehicles`, `Published vehicles readable by all`, `Super admin can view all vehicles`).
- `vehicle_unavailability` — 4 veprime me mbivendosje super-admin × company-staff.
- `companies` SELECT — 3 polica.

**Zgjidhja:** Konsolido në një polic të vetëm permissive për çdo `(role, action)` me predicate me `OR`. P.sh. për `vehicles` SELECT:
```sql
DROP POLICY "Company admins view own vehicles" ON public.vehicles;
DROP POLICY "Published vehicles readable by all" ON public.vehicles;
DROP POLICY "Super admin can view all vehicles" ON public.vehicles;

CREATE POLICY "vehicles_select_consolidated" ON public.vehicles
FOR SELECT TO authenticated, anon
USING (
  is_published = true
  OR company_id IN (select company_id from profiles where id = (select auth.uid()))
  OR (select public.is_super_admin())
);
```

### 3.3 P2 — Indeksa
- **`duplicate_index`** (1): `public.email_logs` ka `idx_email_logs_recipient` dhe `idx_email_logs_recipient_email` identike. Drop njërin.
- **`unindexed_foreign_keys`** (8 INFO): shqyrto se cilat FK kërkojnë indeks për JOIN-et e shpeshta. Mos shtoni indeksa pa profiluar.
- **`unused_index`** (82 INFO): pastër — por mos i hiq pa konfirmuar nga prod logs (advisor mbështetet në statistika që mund të jenë të reja për tabela të reja).

### 3.4 P2 — `auth_db_connections_absolute` (1 INFO)
Sugjeron strategjinë alokuese me përqindje për Auth pool. Lë si është derisa të rritet trafiku.

---

## 4. Drift kod ↔ DB

### 4.1 Edge functions: 7 të deployuara në Supabase por mungojnë në repo
Direktoria `supabase/functions/` ka **12** nën-direktori, kurse Supabase ka **19** edge functions aktive. Mungojnë në Git:

| Slug | Verify JWT | Versioni i fundit |
|---|---|---|
| `notify-subscription-expiry` | false | v3 |
| `create-identity-verification` | true | v2 |
| `stripe-identity-webhook` | false | v2 |
| `generate-invoice-pdf` | true | v2 |
| `send-push-notification` | false | v4 |
| `update-currency-rates` | false | v2 |
| `refund-booking` | true | v1 |

**Risk:**
- Nuk ka historik Git, code review, ose CI për këto funksione.
- Versionet e ardhshme mund të mbishkruajnë funksionalitete pa qenë vërejtur.
- Disa janë webhooks për shërbime financiare (Stripe Identity, Refund) — borxh teknik kritik.

**Veprim:** Tërhiqi nga Supabase me `supabase functions download <slug>` dhe i committo në repo. Vendos rregull për releset e ardhshme që edhe funksionet të kalojnë nga repo.

### 4.2 Migrations: ~7 në DB por jo si file në repo
Lista nga `mcp__supabase__list_migrations` (72) krahasuar me `supabase/migrations/*.sql` (70 file) — disa migrations janë aplikuar direkt nëpërmjet Dashboard SQL Editor ose `apply_migration` RPC pa qenë committuar në repo:

- `20260524073213_expand_preferred_languages`
- `20260524073247_stripe_identity_columns`
- `20260524084828_revoke_rls_auto_enable`
- `20260524093520_push_notifications_and_prefs`
- `20260524100129_harden_notification_prefs_trigger_fn`
- `20260524163935_notifications_push_trigger`
- `20260529221427_partner_platforms`

Disa nga këto kanë analogët në repo me timestamp tjetër (p.sh. `20260523120000_security_p0_hardening.sql` lokalisht vs `20260523213818 security_p0_hardening` në DB) — sugjeron që migrations janë rriduplikuar nga Dashboard pa u sinkronizuar.

**Veprim:** Eksporto nga Supabase me `supabase db pull --schema public` dhe rikoncilio numërimin. Pastaj vendos `lock-in` ku të gjitha ndryshimet kalojnë nga PR-të në repo.

### 4.3 Tabela të reja jo në `src/lib/types.ts`?
DB ka `partner_platforms`, `partner_clicks`, `push_subscriptions`, `notification_preferences`. Verifiko që TypeScript types janë rigjeneruar (`supabase gen types typescript`) pas migrimeve të fundit, ndryshe klienti e ka type-system jo në sinkron.

---

## 5. Higjenë e migrations dhe i kodit

### 5.1 `package.json` — emri default
`"name": "vite-react-typescript-starter"` — duhet riemëruar në `rentacare` ose `autorent`. Ndikon në `npm ls`, `cap sync` etj.

### 5.2 Dependency vërejtje
- **Capacitor:** `@capacitor/core` `^8.3.4` dhe `@capacitor/cli` `^7.6.5` janë në major të ndryshëm. Mospërputhja shkakton sjellje të papritur (lint warnings nga vetë Capacitor). Bumpe `cli` në `^8`.
- **Vitest:** `^4.1.6` është shumë i ri (RC); për një projekt prod më mirë `vitest@^2.x` deri sa 4 të bëhet stable.
- **i18next:** `^26.0.8` është major prerelease; verifiko se nuk po humbet ndonjë namespace në `src/i18n/`.

### 5.3 Mungesa në CI/CD
- `.github/workflows/` ka skedarë por nuk u verifikua që ekzekutojnë `npm run typecheck && npm run test && npm run build` për çdo PR.
- **Veprim:** Verifiko/shto workflow `pr-checks.yml` me këto tri hapa minimale.

---

## 6. Konfigurimi i klientit (Vite/Sentry/Stripe)

### 6.1 `src/lib/supabase.ts` — OK
Audit i mëparshëm ka shtuar validim të `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` me throw të qartë në fillim. Vazhdojeni këtë model.

### 6.2 `src/lib/sentry.ts`
- Sentry init me `import.meta.env.VITE_SENTRY_DSN` dhe `MODE` — OK.
- **Mungesë:** `replaysSessionSampleRate` / `tracesSampleRate` — verifiko që janë në limit prod (p.sh. 0.1 për traces, 0 për replay default), përndryshe kosto Sentry rritet shumë.

### 6.3 Stripe & PayPal
- `VITE_STRIPE_PUBLISHABLE_KEY` — OK në klient.
- **Webhooks** (`stripe-webhook`, `stripe-identity-webhook`, `release-cash-hold`, `capture-cash-hold`) — `verify_jwt: false` është i saktë sepse Stripe vendos `Stripe-Signature` header. **Por:** Sigurohuni që funksioni verifikon nënshkrimin para se të procesojë body. (Jo i verifikuar në këtë audit — duhet shqyrtuar `supabase/functions/stripe-webhook/index.ts`).

### 6.4 PWA & Capacitor
- `VITE_SHOW_DEMO_ACCOUNTS` flag i shtuar — bukur, e fsheh në prod (audit i mëparshëm).
- `capacitor.config.ts` është committed — OK.

---

## 7. Përfundime dhe prioritetet

### P0 (këtë sprint)
1. **Mbylle `partner_clicks` INSERT polikën** me një predicate më të rreptë.
2. **Sinkronizo edge functions në Git** — pull 7 funksionet që mungojnë.
3. **Sinkronizo migrations në repo** — `supabase db pull` dhe rikoncilio numërimin.
4. **Bashko polikat overlap** për `vehicles`, `bookings`, `companies` (më e dukshmja për performancë në SELECT).

### P1 (në 2-4 javë)
5. Refaktoro 35 polikat `auth_rls_initplan` me `(select auth.<fn>())`.
6. Migro `pg_net` te skema `extensions`.
7. Drop indeksin e dyfishtë në `email_logs`.
8. Shto CI workflow që ekzekuton `typecheck + test + build` për çdo PR.

### P2 (backlog)
9. Rishqyrto 9 `SECURITY DEFINER` funksionet me koment shpjegues + ndoshta switch në `SECURITY INVOKER` kur është e mundur.
10. Rishqyrto 82 indeksat e papërdorur pasi të ketë statistika prod të reja.
11. Bump Capacitor CLI në v8 për sinkron me runtime.
12. Riemëro `package.json#name`.

---

## 8. Si t'i verifikojmë gjetjet

```bash
# Re-run advisors pasi të aplikohen migrations
mcp__supabase__get_advisors type=security
mcp__supabase__get_advisors type=performance

# Sinkronizo edge functions
supabase functions download notify-subscription-expiry
supabase functions download create-identity-verification
supabase functions download stripe-identity-webhook
supabase functions download generate-invoice-pdf
supabase functions download send-push-notification
supabase functions download update-currency-rates
supabase functions download refund-booking

# Sinkronizo migrations
supabase db pull --schema public

# Rigjenero types
supabase gen types typescript --project-id anpspyrowaukdriwsdbs > src/lib/database.types.ts
```

---

*Asnjë ndryshim kodi në këtë degë — vetëm raport. PR-i është draft; vendimet e implementimit (cilat P0 të bëhen para release-it) presin shqyrtimin e produktit.*
