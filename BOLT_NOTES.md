# Notes for Bolt.new AI Assistant

> **Read this before making any changes to this project.**

This project has production-grade integrations (Stripe, PayPal, Resend, Sentry, Cloudflare Turnstile, Supabase realtime, pg_cron) that were carefully built outside of bolt.

## Golden rules

1. **Always pull latest from `main` before starting work.** Use the "Pull from GitHub" option in bolt UI.
2. **Never delete files** unless explicitly asked. Especially never delete:
   - Anything in `supabase/migrations/`
   - Anything in `supabase/functions/_shared/`
   - Files matching `*paypal*`, `*stripe*`, `*sentry*`, `*cron*`, `*sitemap*`, `*rateLimit*`
3. **Never revert these files** to older versions:
   - `src/contexts/AuthContext.tsx` (uses atomic RPC `create_company_for_current_user`)
   - `supabase/functions/delete-account/index.ts` (uses shared CORS helper)
   - `tsconfig.app.json` (intentionally has `noUnusedLocals: false`)
   - `README.md` (contains full setup documentation)
   - `public/robots.txt` (Sitemap line points to Supabase edge function)
4. **Migrations are append-only.** Never modify, rename, or delete existing migration files.
5. **Edge function changes must use the shared helpers** in `supabase/functions/_shared/`.

## What was built and how it works

### Email (Resend)
- `supabase/functions/send-email/index.ts` calls Resend API
- Env var: `RESEND_API_KEY` (set in Supabase Edge Function Secrets)

### Payments (Stripe + PayPal)
- Stripe Checkout: `create-checkout-session` + `stripe-webhook` edge functions
- PayPal: `create-paypal-order` + `capture-paypal-order` edge functions
- Client wrappers: `src/lib/stripeService.ts`, `src/lib/paypalService.ts`

### Security
- CAPTCHA: `src/components/auth/TurnstileWidget.tsx` on Login/Register
- Rate limiting: Postgres-backed via `_shared/rateLimit.ts` + `check_rate_limit` RPC
- Atomic company signup: RPC `create_company_for_current_user`
- Trigger that prevents role escalation on profiles

### Automation
- `scheduled-tasks` edge function runs every 15 min via pg_cron
- Sends pickup reminders, auto-cancels stale bookings, transitions statuses
- CRON_SECRET stored in Supabase Vault, verified via RPC

### UX
- `AvailabilityCalendar.tsx` — visual calendar with blocked dates
- `NotificationBell.tsx` — real-time Supabase channels for notifications
- `imageOptimizer.ts` — Supabase Storage transformations

## Where to make changes safely

| Task | File(s) |
|---|---|
| UI tweaks | `src/pages/*`, `src/components/*` |
| New page | New file in `src/pages/`, add route to `src/App.tsx` |
| Translations | `src/i18n/locales/{sq,en,de}.json` |
| Database change | New migration in `supabase/migrations/` (timestamp filename) |
| Email template | DB table `email_templates` |
| Admin settings | `platform_settings` table or relevant admin page |

## If you're unsure

**Ask before deleting anything.** A wrong revert here wastes hours of work.
