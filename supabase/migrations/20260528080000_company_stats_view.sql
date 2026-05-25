/*
  # company_stats view per AdminCompanies performance

  AdminCompanies aktualisht fetch-on TE GJITHA bookings + vehicles + companies
  ne client, pastaj agregon ne JS. Per platforma me 10k+ bookings, kjo
  prodhon ~500KB+ payload JSON dhe slowdown te dukshem ne UI.

  Ky migration krijon nje VIEW `company_stats` qe agregon ne DB:
   - bookings_count, completed_bookings, cancelled_bookings, active_bookings
   - vehicles_count, published_vehicles
   - revenue (sum paid), pending_revenue

  AdminCompanies thirr `select * from company_stats` + JOIN ne `companies`
  per detajet — kalon vetem 1 rresht per company ne wire.

  Sigurte: VIEW respekton RLS te tables se vejtra (companies, bookings, vehicles).
  Super_admin sheh te gjitha; company_admin sheh vetem te vetin.
*/

CREATE OR REPLACE VIEW public.company_stats
WITH (security_invoker = true)
AS
SELECT
  c.id AS company_id,
  COALESCE(b.bookings_count, 0) AS bookings_count,
  COALESCE(b.completed_bookings, 0) AS completed_bookings,
  COALESCE(b.cancelled_bookings, 0) AS cancelled_bookings,
  COALESCE(b.active_bookings, 0) AS active_bookings,
  COALESCE(b.revenue, 0) AS revenue,
  COALESCE(b.pending_revenue, 0) AS pending_revenue,
  COALESCE(v.vehicles_count, 0) AS vehicles_count,
  COALESCE(v.published_vehicles, 0) AS published_vehicles
FROM public.companies c
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS bookings_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
    COUNT(*) FILTER (WHERE status IN ('active', 'confirmed')) AS active_bookings,
    SUM(total_price) FILTER (WHERE status = 'completed' OR payment_status = 'paid') AS revenue,
    SUM(total_price) FILTER (WHERE status IN ('confirmed', 'active')) AS pending_revenue
  FROM public.bookings
  WHERE company_id = c.id
) b ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS vehicles_count,
    COUNT(*) FILTER (WHERE is_published) AS published_vehicles
  FROM public.vehicles
  WHERE company_id = c.id AND deleted_at IS NULL
) v ON true;

COMMENT ON VIEW public.company_stats IS
  'Statistika te agreguara per company — perdorur nga AdminCompanies per te shmangur fetch te te gjitha bookings/vehicles ne client. Security invoker garanton RLS respect.';

GRANT SELECT ON public.company_stats TO authenticated;
