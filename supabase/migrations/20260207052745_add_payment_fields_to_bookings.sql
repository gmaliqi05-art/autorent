/*
  # Shto fushat e pageses ne tabelen bookings

  1. Kolona te reja
    - `payment_method` (text) - metoda e pageses: stripe, paypal, bank_transfer, cash
    - `payment_status` (text) - statusi i pageses: pending, paid, failed

  2. Ndryshime
    - Shtohen dy kolona te reja ne tabelen bookings
    - Default vlera per payment_method eshte 'cash'
    - Default vlera per payment_status eshte 'pending'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_method text DEFAULT 'cash';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;
END $$;
