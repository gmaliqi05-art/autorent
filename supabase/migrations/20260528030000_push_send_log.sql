/*
  # push_send_log per observability te push notifications

  Aktualisht trigger-i thirr edge function-in send-push-notification
  ne fire-and-forget. Nese deshton (VAPID i ndryshuar, network, etj.),
  s'ka asnje gjurme. Audit-i e flagged si P1.

  Ky migration:
   - Krijon tabelen push_send_log
   - RLS: vetem super_admin lexon; service_role shkruan (edge function)
   - Index per query-t tipike (per useri + ne kohe)

  Edge function-i do te update-ohet ne nje commit te dyte ne kete branch
  per te inserted nje rresht pas cdo procesimi.
*/

CREATE TABLE IF NOT EXISTS public.push_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('sent', 'partial', 'failed', 'no_subscriptions', 'push_disabled', 'no_vapid')),
  subscriptions_total int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  expired_count int NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_send_log_user_created
  ON public.push_send_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_push_send_log_status_created
  ON public.push_send_log(status, created_at DESC)
  WHERE status IN ('failed', 'partial');

ALTER TABLE public.push_send_log ENABLE ROW LEVEL SECURITY;

-- Vetem super_admin lexon nga client
CREATE POLICY "super_admin reads push_send_log" ON public.push_send_log
  FOR SELECT TO authenticated
  USING (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
  );

-- service_role: full access (edge function shkruan)
CREATE POLICY "service_role manages push_send_log" ON public.push_send_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.push_send_log IS
  'Audit trail per cdo push notification dergesa nga send-push-notification edge function. Super_admin lexon per debug/observability.';
