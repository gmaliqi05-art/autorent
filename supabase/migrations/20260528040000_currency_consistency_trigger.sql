/*
  # Currency consistency: invoice.currency = booking.currency

  Migration 20260523121000 shtoi kolonen `currency` ne bookings dhe invoices,
  por nuk e validon perdoresheen midis tyre. Klient (ose bug ne kod) mund
  te inserto-je nje invoice me EUR per nje booking me ALL — reconciliation
  thyhet.

  Ky migration shton trigger qe:
   - Para INSERT/UPDATE ne invoices, lexon booking.currency
   - Nese nuk perputhen → RAISE EXCEPTION

  Idempotent: CREATE OR REPLACE FUNCTION, DROP TRIGGER IF EXISTS para krijimit.
*/

CREATE OR REPLACE FUNCTION public.enforce_invoice_currency_matches_booking()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_currency text;
BEGIN
  IF NEW.booking_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT currency INTO v_booking_currency
  FROM public.bookings
  WHERE id = NEW.booking_id;

  IF v_booking_currency IS NULL THEN
    -- Booking pa currency (data e vjeter) — lejo, mos blockoji
    RETURN NEW;
  END IF;

  IF NEW.currency IS NULL THEN
    -- Auto-set ne currency-n e booking-ut
    NEW.currency := v_booking_currency;
  ELSIF NEW.currency <> v_booking_currency THEN
    RAISE EXCEPTION 'invoice.currency (%) duhet te perputhet me booking.currency (%) per booking %',
      NEW.currency, v_booking_currency, NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_invoice_currency ON public.invoices;
CREATE TRIGGER trg_enforce_invoice_currency
  BEFORE INSERT OR UPDATE OF currency, booking_id ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_currency_matches_booking();

COMMENT ON FUNCTION public.enforce_invoice_currency_matches_booking() IS
  'Garanton qe invoice.currency = booking.currency. Auto-set nese invoice.currency eshte NULL.';
