/*
  # Web Push subscriptions + notification preferences

  Shton mbeshtetje per browser Push API:
   - `push_subscriptions` ruan tokenat e pajisjeve (endpoint + VAPID keys)
   - `notification_preferences` lejon perdoruesin te zgjedhe kanalet (email/push/in-app)

  RLS: cdo perdorues lexon/shkruan vetem te dhenat e tij.
*/

-- ============ push_subscriptions ============
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============ notification_preferences ============
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  -- per-event opt-outs (opsionale, lejon kontroll te imet)
  marketing_emails boolean NOT NULL DEFAULT false,
  pickup_reminders boolean NOT NULL DEFAULT true,
  booking_updates boolean NOT NULL DEFAULT true,
  payment_alerts boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Service role mund te shikoje cdo subscription per dergim push
CREATE POLICY "Service role full access to push_subscriptions"
  ON push_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to notification_preferences"
  ON notification_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Mos lejo anon/authenticated te thrresin RPC direkt; vetem trigger.
REVOKE EXECUTE ON FUNCTION update_notification_prefs_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_notification_prefs_updated_at() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_notification_prefs_updated_at ON notification_preferences;
CREATE TRIGGER trg_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();
