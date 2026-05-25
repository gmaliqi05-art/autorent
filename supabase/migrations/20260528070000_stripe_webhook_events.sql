/*
  # stripe_webhook_events per idempotency

  Audit pre-lansim e identifikoi: stripe-webhook nuk ka dedup. Stripe
  mund te ri-dergoje te njejtin event (psh nese pergjigja 200 humb ne
  network), gje qe rezulton ne:
   - booking marked paid 2x
   - email/push notifications dyfish te derguara
   - invoice update-uar dy here

  Stripe garanton qe `event.id` eshte unik. Ky migration shton tabelen
  `stripe_webhook_events` me PRIMARY KEY ne `event_id`. Edge function-i
  do beje INSERT me ON CONFLICT — race-safe.
*/

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload_summary jsonb
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON public.stripe_webhook_events(processed_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Vetem super_admin lexon nga UI (per debug)
CREATE POLICY "super_admin reads stripe_webhook_events" ON public.stripe_webhook_events
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- service_role manages all (edge function)
CREATE POLICY "service_role manages stripe_webhook_events" ON public.stripe_webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Audit trail + idempotency per Stripe webhook events. event_id eshte PK; edge function-i INSERT-on me ON CONFLICT DO NOTHING — eventet duplikate skipohen.';
