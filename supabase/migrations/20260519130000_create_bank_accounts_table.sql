/*
  # Create bank_accounts table

  ## Problem
  Faqja AdminBankDetails (/admin/banka) leximon dhe shkruan ne tabelen `bank_accounts`,
  por kjo tabel nuk ekziston ne Supabase — bolt gjeneroi UI-n por harroi migration-in.
  Si rezultat:
  - UI-ja deshton silently kur nje admin tenton te shtoje llogari
  - PaymentMethodSelector ka IBAN-in e hardcoded
    (Raiffeisen Bank Kosovo / XK06 1234 5678 9012 3456)

  ## Zgjidhja
  - Krijo tabelen bank_accounts me RLS
  - Vetem super_admin lexon/shkruan
  - Lejo `anon` te lexoje vetem llogarine kryesore (per t'u shfaqur ne faqen e pageses)
*/

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_holder text NOT NULL DEFAULT '',
  iban text NOT NULL,
  swift text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','ALL','USD','MKD','RSD')),
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_bank_accounts_iban
  ON public.bank_accounts(iban);

-- Vetem nje llogari mund te jete kryesore ne te njejten kohe
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bank_accounts_one_primary
  ON public.bank_accounts((TRUE))
  WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_active
  ON public.bank_accounts(is_active)
  WHERE is_active = TRUE;

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Lexim publik vetem per llogarine kryesore aktive (per t'u shfaqur ne checkout)
DROP POLICY IF EXISTS "Primary active bank account is readable by all" ON public.bank_accounts;
CREATE POLICY "Primary active bank account is readable by all"
  ON public.bank_accounts FOR SELECT
  TO authenticated, anon
  USING (is_primary = true AND is_active = true);

-- Super admin lexon te gjitha
DROP POLICY IF EXISTS "Super admin reads all bank accounts" ON public.bank_accounts;
CREATE POLICY "Super admin reads all bank accounts"
  ON public.bank_accounts FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin inserts bank accounts" ON public.bank_accounts;
CREATE POLICY "Super admin inserts bank accounts"
  ON public.bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin updates bank accounts" ON public.bank_accounts;
CREATE POLICY "Super admin updates bank accounts"
  ON public.bank_accounts FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

DROP POLICY IF EXISTS "Super admin deletes bank accounts" ON public.bank_accounts;
CREATE POLICY "Super admin deletes bank accounts"
  ON public.bank_accounts FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- updated_at trigger
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
