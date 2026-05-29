/*
  # Refund columns ne bookings

  Aktualisht cancelBooking thjesht shenon status='cancelled' por nuk
  ben refund ne Stripe. Per refund flow te plote duhen kolona shtese.

  Idempotent: IF NOT EXISTS ne secilen kolone.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='refund_amount') THEN
    ALTER TABLE public.bookings ADD COLUMN refund_amount numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='refunded_at') THEN
    ALTER TABLE public.bookings ADD COLUMN refunded_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='stripe_refund_id') THEN
    ALTER TABLE public.bookings ADD COLUMN stripe_refund_id text;
  END IF;
END $$;

COMMENT ON COLUMN public.bookings.refund_amount IS
  'Shuma e kthyer pas anulimit. Kur > 0, klienti merr refund (te pjesshem nese ka cancellation_fee).';

COMMENT ON COLUMN public.bookings.stripe_refund_id IS
  'ID e Stripe Refund (re_xxx) per audit + idempotency. NULL nese pagesa s'ishte me karte ose s'eshte kthyer.';
