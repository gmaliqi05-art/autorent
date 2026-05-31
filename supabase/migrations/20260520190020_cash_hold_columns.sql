/*
  # Cash Hold (Stripe Authorization) columns ne bookings

  Modeli: kur klienti zgjedh "cash", Stripe AUTORIZON nje shume (jo i tërheq)
  ne karte si garanci. Kompania e liron pas pages kesh ne lokal, ose e kap
  nese klienti nuk shfaqet.

  Kolonat e reja:
  - cash_hold_payment_intent_id: ID e PaymentIntent Stripe
  - cash_hold_amount: shuma e autorizuar (default = vehicle.deposit_amount)
  - cash_hold_status: 'authorized' | 'released' | 'captured' | 'expired' | 'failed'
  - cash_hold_authorized_at: kur u krijua autorizimi
  - cash_hold_resolved_at: kur u released/captured/expired

  cash_hold_status mund te jete NULL = booking-u kesh nuk ka hold (i vjeter)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cash_hold_payment_intent_id') THEN
    ALTER TABLE public.bookings ADD COLUMN cash_hold_payment_intent_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cash_hold_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN cash_hold_amount numeric(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cash_hold_status') THEN
    ALTER TABLE public.bookings ADD COLUMN cash_hold_status text
      CHECK (cash_hold_status IN ('authorized', 'released', 'captured', 'expired', 'failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cash_hold_authorized_at') THEN
    ALTER TABLE public.bookings ADD COLUMN cash_hold_authorized_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cash_hold_resolved_at') THEN
    ALTER TABLE public.bookings ADD COLUMN cash_hold_resolved_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_cash_hold_intent
  ON public.bookings(cash_hold_payment_intent_id)
  WHERE cash_hold_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_cash_hold_authorized
  ON public.bookings(cash_hold_status)
  WHERE cash_hold_status = 'authorized';
