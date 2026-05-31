/*
  # Hardening i siperfaqes SECURITY DEFINER

  1. Ndryshime view-i
    - `public.vehicle_categories_with_stats` rikrijohet me opsionin
      `security_invoker = true`. View-t ne Postgres jane `SECURITY DEFINER`
      ne menyre default;

 me kete opsion ato ekzekutohen me lejet e thirresit,
      duke u bindur RLS-se se tabelave bazike.

  2. Revoke EXECUTE per funksione te brendshme
    - Heq EXECUTE nga `anon`, `authenticated` dhe `public` per:
      - `public.handle_new_user()`     (perdoret vetem si trigger pas auth.users INSERT)
      - `public.is_super_admin()`      (perdoret vetem brenda RLS-se)
      - `public.update_updated_at_column()` (trigger BEFORE UPDATE)
    - Keto funksione mbeten `SECURITY DEFINER` (te nevojshme per trigger-at)
      por nuk mund te thirren me me /rest/v1/rpc.

  3. Siguria
    - Asnje ndryshim te dhenash. Asnje rrezik humbjeje.
    - Reduktohet siperfaqja e sulmit ne API publike.

  4. Shenime
    - "Leaked Password Protection" eshte cilesim i Supabase Auth Dashboard
      (Authentication -> Providers -> Email -> Enable HaveIBeenPwned check)
      dhe nuk mund te ndizet me SQL. Aktivizohet me dore nga paneli.
*/

-- 1) Rikrijo view-n me security_invoker per te respektuar RLS-n e thirresit
CREATE OR REPLACE VIEW public.vehicle_categories_with_stats
WITH (security_invoker = true) AS
SELECT
  c.key,
  c.sort_order,
  c.is_active,
  c.image_url,
  c.label_sq,
  c.label_en,
  c.label_de,
  c.icon,
  c.default_min_price,
  COALESCE(v.vehicle_count, 0)::int AS vehicle_count,
  COALESCE(v.min_price, c.default_min_price) AS min_price
FROM vehicle_categories c
LEFT JOIN (
  SELECT
    category,
    COUNT(*) AS vehicle_count,
    MIN(price_per_day) AS min_price
  FROM vehicles
  WHERE is_published = true
    AND is_available = true
    AND status = 'active'
  GROUP BY category
) v ON v.category = c.key;

GRANT SELECT ON public.vehicle_categories_with_stats TO anon, authenticated;

-- 2) Hiq EXECUTE nga roli publik per funksionet e brendshme/trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

;
