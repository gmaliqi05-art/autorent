DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='paypal_order_id') THEN
    ALTER TABLE public.bookings ADD COLUMN paypal_order_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='paypal_capture_id') THEN
    ALTER TABLE public.bookings ADD COLUMN paypal_capture_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_paypal_order_id
  ON public.bookings(paypal_order_id)
  WHERE paypal_order_id IS NOT NULL;;\n