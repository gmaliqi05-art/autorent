# RentaKar / AutoRent

Platformë qira automjetesh për Kosovë, Shqipëri dhe Maqedoni — multi-tenant me role: **client**, **company_admin**, **super_admin**.

🌐 **Production:** [rentcars.life](https://rentcars.life)

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-nphdo3us)

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + Lucide React
- **Routing:** react-router-dom v7
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Email:** [Resend](https://resend.com)
- **Pagesa:** Stripe Checkout (kartë), PayPal, transfer bankar, kesh
- **i18n:** sq / en / de me i18next
- **Hartat:** Leaflet + react-leaflet

---

## Setup lokal

### 1. Kërkesat
- Node.js 18+
- Llogari në [Supabase](https://supabase.com)
- Llogari në [Resend](https://resend.com) (për email)
- Llogari në [Stripe](https://stripe.com) (për pagesa kartë)
- (opsionale) [Supabase CLI](https://supabase.com/docs/guides/cli) për migrations & edge functions

### 2. Klono dhe instalo
```bash
git clone https://github.com/gmaliqi05-art/autorent.git
cd autorent
npm install
```

### 3. Konfiguro `.env`
```bash
cp .env.example .env
```
Hape `.env` dhe vendos vlerat — shih [`.env.example`](.env.example) për të gjitha variablat e nevojshëm.

### 4. Konfiguro Supabase

#### a) Aplikoni migrations
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

#### b) Vendos secrets për Edge Functions
```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RESEND_FROM_EMAIL="RentaKar <no-reply@rentcars.life>"
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set CORS_ALLOWED_ORIGINS=https://rentcars.life,http://localhost:5173
```

#### b1) Web Push (VAPID)
Gjenero ciftin e cesave:
```bash
node scripts/generate-vapid-keys.cjs
```
Pastaj:
```bash
# E njejta publicKey ne te dyja:
supabase secrets set VAPID_PUBLIC_KEY=<publicKey>
supabase secrets set VAPID_PRIVATE_KEY=<privateKey>
supabase secrets set VAPID_SUBJECT=mailto:contact@rentcars.life

# Dhe ne .env:
# VITE_VAPID_PUBLIC_KEY=<publicKey>
```
Sistemi i push notifications eshte i lidhur automatikisht me events permes DB trigger ne `notifications` (shih `supabase/migrations/20260527130000_notifications_push_trigger.sql`). Asnje thirrje shtese nuk nevojitet nga frontend-i — cdo insert ne `notifications` prodhon push.

#### c) Deploy Edge Functions
```bash
supabase functions deploy send-email
supabase functions deploy delete-account
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy send-push-notification --no-verify-jwt
supabase functions deploy scheduled-tasks --no-verify-jwt
```
> ⚠️ `stripe-webhook`, `send-push-notification` dhe `scheduled-tasks` **duhet** të deploy-ohen me `--no-verify-jwt` — secila ka autentikim te brendshem (Stripe signature, x-push-secret, x-cron-secret).

#### d) Stripe Webhook
1. Shko në [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Zgjidh ngjarjet: `checkout.session.completed`, `payment_intent.payment_failed`
4. Kopjo "Signing secret" → vendose si `STRIPE_WEBHOOK_SECRET`

### 5. Krijo super_admin-in e parë
Pas regjistrimit nga UI:
```sql
-- ne SQL Editor te Supabase
UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';

-- vendos edhe ne JWT app_metadata (kerkohet per RLS policies)
-- Kjo behet permes Supabase Auth API ose nga Dashboard > Authentication > Users > [user] > Raw User Meta Data
```

### 6. Run
```bash
npm run dev          # dev server (http://localhost:5173)
npm run typecheck    # kontroll tipesh
npm run lint         # ESLint
npm run build        # build per production
```

---

## Strukturë

```
autorent/
├── src/
│   ├── components/     # UI components (booking, layout, vehicles, ...)
│   ├── contexts/       # AuthContext
│   ├── i18n/           # sq/en/de translations
│   ├── lib/            # Supabase client, helpers, services
│   ├── pages/
│   │   ├── admin/      # super_admin dashboard (30+ faqe)
│   │   ├── company/    # company_admin dashboard
│   │   └── dashboard/  # client dashboard
│   └── App.tsx         # routes
├── supabase/
│   ├── migrations/     # SQL migrations
│   └── functions/      # Edge functions (Deno)
└── public/             # static (robots.txt, sitemap.xml)
```

---

## Role & autorizim

| Role | Akses |
|---|---|
| `client` | Shfleton vetura, bën rezervime, sheh historinë e pagesave |
| `company_admin` | Menaxhon kompaninë, veturat, rezervimet, abonimin |
| `super_admin` | Akses i plotë admin: kompani, përdorues, plane, faqe, email, etj. |

> **E rëndësishme:** Roli `super_admin` duhet të vendoset si në kolonën `profiles.role` AS edhe në `auth.users.raw_app_meta_data.role`, sepse RLS policies e kontrollojnë në JWT app_metadata. Shih [migration 04_fix_security_and_performance_issues](supabase/migrations/20260207091826_04_fix_security_and_performance_issues.sql).

---

## Booking flow

1. Klienti zgjedh datat te `VehicleDetailPage`
2. Sistemi kontrollon: (a) klienti ka patentë të verifikuar (`client_documents.verified=true`), (b) nuk ka konflikt datash
3. Klienti sheh faturën pro-forma
4. Klienti zgjedh metodën e pagesës:
   - **Kartë (Stripe Checkout)** → redirect në Stripe → webhook konfirmon → status='confirmed', payment_status='paid'
   - **PayPal** → (në zhvillim)
   - **Transfer bankar** → status='pending', kompania konfirmon manualisht pas verifikimit
   - **Kesh në lokal** → status='pending', paguhet kur merret vetura
5. Email konfirmimi dërgohen klientit dhe kompanisë (përmes Resend)
6. Notification krijohet në DB për të dy

---

## Test users

Migrations përfshijnë skedarë seed për test users. Verifiko në [`supabase/migrations/`](supabase/migrations/) për detaje.

---

## Sigurinë

- Të gjitha tabelat kanë **RLS** të aktivizuar
- Politikat super_admin kontrollohen përmes `auth.jwt() -> app_metadata -> role`
- Booking overlap parandalohet me PostgreSQL `EXCLUDE` constraint
- Client documents (patenta + ID) ruhen në bucket privat me storage policies
- Edge functions kanë CORS të rreptë (vetëm origin-et e lejuara)
- `stripe-webhook` verifikon signature për të parandaluar forge

---

## Kontribut

Ky është projekt privat. Për pyetje / bug reports kontaktoni `info@rentcars.life`.
