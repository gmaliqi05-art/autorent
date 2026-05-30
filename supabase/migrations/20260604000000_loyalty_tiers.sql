/*
  # Loyalty tier system — Bronze / Silver / Gold / Platinum

  Tier-at llogariten dinamikisht nga `total_earned` (sum e te gjitha pikave fituar,
  jo balanca aktuale). Pra perdoruesit qe perdorin pikat nuk humbasin tier-in.

  Thresholds:
  - Bronze:   0 - 499 pikë (default per useritr e ri)
  - Silver:   500 - 1,499 pikë
  - Gold:     1,500 - 4,999 pikë
  - Platinum: 5,000+ pikë

  Sistemi e mban gjitha llogaritjet ne VIEW user_loyalty_tier:
  - tier (text)
  - tier_min (poshte e tier-it aktual)
  - tier_max (poshtë e tier-it tjeter; null per platinum)
  - points_to_next (sa pikë me duhen per tier-in tjeter)
  - progress_pct (sa % i komplet jam ne tier-in aktual)
*/

CREATE OR REPLACE VIEW user_loyalty_tier
WITH (security_invoker = true)
AS
WITH user_earned AS (
  SELECT
    p.id AS user_id,
    COALESCE(SUM(lt.points) FILTER (WHERE lt.points > 0), 0)::integer AS total_earned
  FROM profiles p
  LEFT JOIN loyalty_transactions lt ON lt.user_id = p.id
  GROUP BY p.id
)
SELECT
  user_id,
  total_earned,
  CASE
    WHEN total_earned >= 5000 THEN 'platinum'
    WHEN total_earned >= 1500 THEN 'gold'
    WHEN total_earned >= 500 THEN 'silver'
    ELSE 'bronze'
  END AS tier,
  CASE
    WHEN total_earned >= 5000 THEN 5000
    WHEN total_earned >= 1500 THEN 1500
    WHEN total_earned >= 500 THEN 500
    ELSE 0
  END AS tier_min,
  CASE
    WHEN total_earned >= 5000 THEN NULL
    WHEN total_earned >= 1500 THEN 5000
    WHEN total_earned >= 500 THEN 1500
    ELSE 500
  END AS tier_max,
  CASE
    WHEN total_earned >= 5000 THEN 0
    WHEN total_earned >= 1500 THEN 5000 - total_earned
    WHEN total_earned >= 500 THEN 1500 - total_earned
    ELSE 500 - total_earned
  END AS points_to_next,
  CASE
    WHEN total_earned >= 5000 THEN 100
    WHEN total_earned >= 1500 THEN ROUND(((total_earned - 1500.0) / (5000 - 1500)) * 100)::integer
    WHEN total_earned >= 500 THEN ROUND(((total_earned - 500.0) / (1500 - 500)) * 100)::integer
    ELSE ROUND((total_earned / 500.0) * 100)::integer
  END AS progress_pct
FROM user_earned;

COMMENT ON VIEW user_loyalty_tier IS
  'Tier i llogaritur dinamikisht nga total_earned. Bronze/Silver/Gold/Platinum @ 0/500/1500/5000.';
