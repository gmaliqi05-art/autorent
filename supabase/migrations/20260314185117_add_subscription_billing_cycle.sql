/*
  # Shto fushen subscription_billing_cycle tek tabela companies

  ## Ndryshimet
  - Shtohet kolona `subscription_billing_cycle` (monthly | yearly) per te ruajtur ciklin e faturimit
  - Shtohet kolona `subscription_renewed_at` per te ruajtur daten e fundit te rinovimit
  - Shtohet kolona `subscription_auto_renew` per te aktivizuar/çaktivizuar rinovimin automatik

  ## Siguria
  - Kolonat e reja pasojne te njejtat politika RLS si kompania
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'subscription_billing_cycle'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_billing_cycle text DEFAULT 'monthly' CHECK (subscription_billing_cycle IN ('monthly', 'yearly'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'subscription_renewed_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_renewed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'subscription_auto_renew'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_auto_renew boolean DEFAULT true;
  END IF;
END $$;
