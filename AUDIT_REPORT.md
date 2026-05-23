# Audit & Implementim — 2026-05-23

Raport i auditit dhe ndryshimet e implementuara në këtë degë
(`claude/platform-audit-supabase-github-g3MaW`).

## Përmbledhje

Platforma RentaKar/AutoRent është audituar duke marrë si bazë Sixt, Europcar,
Discover Cars dhe Rentalcars.com. U identifikuan **6 dobësi sigurie WARN**,
**12+ mangësi në modelin e të dhënave**, dhe **15+ tipare** që e ndajnë nga
konkurrentët evropianë. Ky PR përmban **migrations-et P0 dhe P1** plus
**fixe-t kritike në frontend**.

## Çfarë u ndryshua

### 1. Siguri (P0) — `20260523120000_security_p0_hardening.sql`

- Shtohet polici DENY eksplicite për `rate_limit_buckets` (anon/authenticated bllokohen).
- `REVOKE EXECUTE` për funksionet helper që nuk duhen të jenë publike:
  - `cleanup_rate_limit_buckets()` — vetëm cron/service_role.
  - `on_review_change()` — funksion trigger.
  - `prevent_protected_profile_changes()` — funksion trigger.
  - `recalc_company_rating(uuid)`, `recalc_vehicle_rating(uuid)` — helpers.
- Heq `SELECT` broad policies nga bucket-et publike `ad-images` dhe
  `company-media` (URL-të e drejtpërdrejta vazhdojnë të funksionojnë).
- Funksionet që MBETEN të aksesueshme nga publiku: `available_vehicles`,
  `vehicle_blocked_dates`, `is_super_admin`, `create_company_for_current_user`,
  `update_own_profile` — qëllim biznesi i ligjshëm.

**Nuk u aplikua** (në backlog): `pg_net` move në skemë `extensions` — risk
i thyer pg_cron, kërkon test të veçantë.

**Veprim manual i kërkuar nga super_admin:**
- Aktivizo *Leaked Password Protection* në Supabase Dashboard → Auth → Policies.

### 2. Modeli i të dhënave (P0) — `20260523121000_data_model_currency_audit.sql`

- `bookings.currency`, `invoices.currency`, `vehicles.currency` (default `EUR`,
  CHECK në EUR/ALL/USD/MKD/RSD/GBP/CHF).
- `invoices.vehicle_id` FK + backfill nga `bookings`.
- `vehicles` shtohen 8 kolona: `included_km_per_day`, `extra_km_price`,
  `fuel_policy` (4-state CHECK), `min_driver_age`, `min_license_years`,
  `young_driver_fee_per_day`, `cross_border_allowed`, `allowed_countries`.
- Tabelë e re `audit_logs` me RLS (vetëm super_admin lexon) + RPC
  `log_audit_event` për shkrim të kontrolluar.
- Tabelë e re `currency_rates` (base=EUR, quote=...) e mbushur me seed manual.
  Kandidat për cron që lexon ECB API.

### 3. Sigurim + Add-ons + Vendndodhje (P1) — `20260523122000_insurance_extras_locations.sql`

- **`insurance_plans`** — tier basic/standard/premium/platinum, çmim ditor,
  deductible, mbulime granulare (CDW, Theft, Glass, Roadside). Seed:
  3 plane platform-wide (Bazë / Standard CDW / Super Cover).
- **`vehicle_extras`** — child seat, GPS, Wi-Fi, additional driver, snow chains,
  ski rack, phone holder, booster. Seed: 8 extras platform-wide.
- **`booking_extras`** — junction (quantity, çmim, currency).
- **`pickup_locations`** — degë për kompani, tipi (office/airport/hotel/etc.),
  one-way fee, opening_hours, 24/7 flag, meet_and_greet.
- **`bookings`** shtohen: `insurance_plan_id`, `insurance_total`,
  `extras_total`, `one_way_fee`, `tax_total`, `discount_total`,
  `discount_code_id`, `pickup_location_id`, `return_location_id`,
  `included_km`, `extra_km_price`.

### 4. Reviews v2 + Wishlist + Saved Searches (P1) — `20260523123000_reviews_v2_wishlist.sql`

- `reviews` shtohen: `vehicle_id` FK (+ backfill), 4 nën-rating-e
  (cleanliness, value, service, condition), `photos[]`, `company_reply`,
  `helpful_count`, `is_verified_booking`, moderation flags. Policy
  shtesë për përgjigje nga kompania.
- `review_helpful_votes` — junction për thumbs-up.
- `wishlist` — automjetet e ruajtura.
- `saved_searches` — kërkime me alert email (cron mund t'i lexojë).
- `damage_reports` — pre/post pickup inspection, foto, nënshkrime,
  damage_marks (jsonb me x/y/severity për diagram). Bucket privat
  `damage-reports` me storage policies.

### 5. Frontend fixes

- `src/lib/supabase.ts` — validim i `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
  me mesazh të qartë gabimi; opsione eksplicite për `persistSession`,
  `autoRefreshToken`; `x-client-info` header.
- `src/contexts/AuthContext.tsx` — race-condition fix me `activeUserIdRef`,
  `try/catch` për fetchProfile, `void` për fire-and-forget, përdor RPC
  `update_own_profile` në vend të direct UPDATE.
- `src/lib/types.ts` — interface-t e reja: `InsurancePlan`, `VehicleExtra`,
  `BookingExtra`, `PickupLocation`, `Review` v2, `CurrencyRate`,
  `WishlistItem`, `SavedSearch`, `DamageReport`, `AuditLog`. `Vehicle` &
  `Booking` zgjeruar me fushat e reja.
- `src/lib/currency.ts` — helper i ri për formatim me `Intl.NumberFormat`
  (locale i zgjedhur sipas valutës) + konvertim FX me cache 30min.

## Çfarë mbetet (backlog)

### P1 — Tipare që duhen para se të hapet për turistët evropianë
- UI për sigurimin & extras në `VehicleDetailPage` (flow i ri rezervimi).
- Edge function `update-currency-rates` që thirr ECB Reference Rates ditore.
- OCR i patentës (Stripe Identity ose Onfido) në `ClientProfile`.
- Përkthime: it, fr, nl, pl (locale të rinj).
- PDF invoices si edge function.

### P2 — Diferencim Ballkan
- "Balkan Road Trip" multi-country packages.
- Loyalty / Referral program.
- P2P marketplace pilot.
- Push notifications native (Capacitor + FCM/APNs).
- Real-time chat klient↔kompani (Supabase Realtime është aktiv).

### Performancë (i pa eksploruar plotësisht)
- Performance advisor raporti përmban ~84k karaktere me probleme
  (auth_rls_initplan, unindexed FKs, duplicate indexes, multiple
  permissive policies). Kërkon migration të dedikuar.

## Si t'i aplikoni migrations në DB

```bash
# Lokal:
supabase db push

# Ose në dashboard, ngarko çdo file në SQL Editor.
```

Të gjitha migrations janë **idempotente** dhe **additive** — ekzekutimi i
dyfishtë nuk thyen asgjë.

## Si të testoni

1. `npm install` (asnjë dependency e re; vetëm types të rishikuara).
2. `npm run typecheck` — duhet të kalojë.
3. `npm run build` — verifiko bundle size.
4. Ekzekuto migrations në një DB të zhvillimit dhe testo:
   - Krijo një vehicle me `cross_border_allowed=true`, `fuel_policy='full_to_full'`.
   - Krijo një insurance_plan dhe një vehicle_extra për kompaninë.
   - Krijo një pickup_location.
   - Krijo një booking që përdor të gjitha të mësipërmet.
5. Verifiko advisors: `mcp__supabase__get_advisors type=security` — duhet
   të heqë lints për `rate_limit_buckets` dhe `public_bucket_allows_listing`.
