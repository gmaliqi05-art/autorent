/*
  # Rate limiter ne Postgres

  ## Si funksionon
  Sliding window rate limiter me nje tabel buckets + RPC.

  - `key` = string qe identifikon kontestin (p.sh. "send-email:user_uuid" ose "send-email:ip:1.2.3.4")
  - `max_count` = nr maksimal i thirrjeve te lejuara brenda window-it
  - `window_seconds` = gjatesia e window-it (p.sh. 60 per minute)

  Kthen TRUE nese thirrja eshte e lejuar, FALSE nese eshte mbi limit.

  ## Perdorim ne edge functions
  ```ts
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_key: `send-email:${userId}`,
    p_max_count: 10,
    p_window_seconds: 60,
  });
  if (!allowed) return jsonResponse(req, { error: 'Too many requests' }, 429);
  ```

  ## Auto-cleanup
  Cron job qe heq buckets me window_start me te vjeter se 1 ore.
*/

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_window
  ON public.rate_limit_buckets(window_start);

-- Nuk i ekspozohet asnje API publike — vetem service_role
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- (asnje policy → kushdo qe nuk eshte service_role eshte i bllokuar)

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_count integer,
  p_window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_threshold timestamptz := v_now - make_interval(secs => p_window_seconds);
  v_count integer;
BEGIN
  -- Upsert: rifillon window-in nese eshte i vjetersuar, perndryshe increment
  INSERT INTO public.rate_limit_buckets (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN public.rate_limit_buckets.window_start < v_threshold THEN 1
      ELSE public.rate_limit_buckets.count + 1
    END,
    window_start = CASE
      WHEN public.rate_limit_buckets.window_start < v_threshold THEN v_now
      ELSE public.rate_limit_buckets.window_start
    END
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- ============================================================================
-- Auto-cleanup: heq buckets me te vjeter se 1 ore
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_buckets()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_buckets
  WHERE window_start < now() - interval '1 hour';
$$;

-- Skedulo cleanup-in cdo 30 minuta
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limit-buckets') THEN
    PERFORM cron.unschedule('cleanup-rate-limit-buckets');
  END IF;

  PERFORM cron.schedule(
    'cleanup-rate-limit-buckets',
    '*/30 * * * *',
    'SELECT public.cleanup_rate_limit_buckets();'
  );
END $$;
