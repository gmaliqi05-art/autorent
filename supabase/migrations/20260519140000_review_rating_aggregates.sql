/*
  # Review rating aggregates

  ## Problem
  Klientet shkruajne recensione (`reviews` table) por `companies.rating` dhe
  `vehicles.rating` nuk perditesohen kurre — vleresimet ekzistojne ne DB por
  nuk shfaqen ne lista (sepse aggregates jane gjithmone 0).

  ## Zgjidhja
  - Trigger AFTER INSERT/UPDATE/DELETE ne `reviews` qe:
    1. Rikalkulon AVG(rating) + COUNT per kompanine
    2. Rikalkulon AVG(rating) + COUNT per veturen (perms booking)

  ## Note
  Triggers jane `SECURITY DEFINER` me search_path fiks per t'i bere te
  ekzekutohen edhe kur RLS e bllokon update-in nga klienti.
*/

CREATE OR REPLACE FUNCTION public.recalc_company_rating(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies c
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM public.reviews r
      WHERE r.company_id = c.id
    ), 0),
    total_reviews = (
      SELECT COUNT(*) FROM public.reviews r WHERE r.company_id = c.id
    )
  WHERE c.id = p_company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalc_vehicle_rating(p_vehicle_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vehicles v
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 2)
      FROM public.reviews r
      JOIN public.bookings b ON b.id = r.booking_id
      WHERE b.vehicle_id = v.id
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews r
      JOIN public.bookings b ON b.id = r.booking_id
      WHERE b.vehicle_id = v.id
    )
  WHERE v.id = p_vehicle_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_review_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle_id uuid;
BEGIN
  -- Kompania
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_company_rating(OLD.company_id);
  ELSE
    PERFORM public.recalc_company_rating(NEW.company_id);
    IF TG_OP = 'UPDATE' AND OLD.company_id IS DISTINCT FROM NEW.company_id THEN
      PERFORM public.recalc_company_rating(OLD.company_id);
    END IF;
  END IF;

  -- Vetura (permes booking)
  IF TG_OP = 'DELETE' THEN
    SELECT b.vehicle_id INTO v_vehicle_id FROM public.bookings b WHERE b.id = OLD.booking_id;
    IF v_vehicle_id IS NOT NULL THEN
      PERFORM public.recalc_vehicle_rating(v_vehicle_id);
    END IF;
  ELSE
    SELECT b.vehicle_id INTO v_vehicle_id FROM public.bookings b WHERE b.id = NEW.booking_id;
    IF v_vehicle_id IS NOT NULL THEN
      PERFORM public.recalc_vehicle_rating(v_vehicle_id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS reviews_aggregate_trigger ON public.reviews;
CREATE TRIGGER reviews_aggregate_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.on_review_change();

-- Backfill: rikalkulim per te gjitha kompanite & veturat ekzistuese
DO $$
DECLARE
  c_row record;
  v_row record;
BEGIN
  FOR c_row IN SELECT DISTINCT company_id FROM public.reviews LOOP
    PERFORM public.recalc_company_rating(c_row.company_id);
  END LOOP;

  FOR v_row IN
    SELECT DISTINCT b.vehicle_id
    FROM public.reviews r
    JOIN public.bookings b ON b.id = r.booking_id
  LOOP
    PERFORM public.recalc_vehicle_rating(v_row.vehicle_id);
  END LOOP;
END $$;
