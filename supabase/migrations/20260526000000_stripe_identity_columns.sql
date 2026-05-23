/*
  # Stripe Identity Integration — OCR i automatizuar i patentes

  Backlog #3 nga audit-i. Mundeson verifikim automatik te patentes & ID-se
  permes Stripe Identity (OCR + face match + database checks).

  Workflow:
  1. Klienti kliko "Verifiko me Stripe" -> edge function create-identity-verification
  2. Krijohet nje verification session ne Stripe; klienti ridrejtohet
  3. Klienti ngarkon foton e patentes + selfie ne Stripe
  4. Stripe ben OCR + face match
  5. Webhook stripe-identity-webhook merr event-in dhe perditeson client_documents

  Kolonat e reja:
  - stripe_verification_session_id  — vs_xxx ID
  - stripe_verification_status       — requires_input | processing | verified | canceled
  - stripe_extracted_data            — jsonb me te dhena nga OCR (firstName, lastName, etj)
  - verified_via                     — 'manual' (admin verify) ose 'stripe_identity'
  - stripe_verified_at               — timestamp
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_documents' AND column_name='stripe_verification_session_id') THEN
    ALTER TABLE public.client_documents ADD COLUMN stripe_verification_session_id text;
    CREATE INDEX IF NOT EXISTS idx_client_documents_stripe_session
      ON public.client_documents(stripe_verification_session_id)
      WHERE stripe_verification_session_id IS NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_documents' AND column_name='stripe_verification_status') THEN
    ALTER TABLE public.client_documents
      ADD COLUMN stripe_verification_status text
      CHECK (stripe_verification_status IN (
        'requires_input', 'processing', 'verified', 'canceled', 'requires_action'
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_documents' AND column_name='stripe_extracted_data') THEN
    ALTER TABLE public.client_documents
      ADD COLUMN stripe_extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_documents' AND column_name='verified_via') THEN
    ALTER TABLE public.client_documents
      ADD COLUMN verified_via text
      CHECK (verified_via IN ('manual', 'stripe_identity'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_documents' AND column_name='stripe_verified_at') THEN
    ALTER TABLE public.client_documents
      ADD COLUMN stripe_verified_at timestamptz;
  END IF;
END $$;

COMMENT ON COLUMN public.client_documents.stripe_verification_session_id IS
  'Stripe Identity Verification Session ID (vs_xxx). Lidhet me sesion specific.';
COMMENT ON COLUMN public.client_documents.stripe_extracted_data IS
  'Dhena te nxjerra nga Stripe OCR: first_name, last_name, dob, license_number, expiry, address.';
COMMENT ON COLUMN public.client_documents.verified_via IS
  'Si u verifikua: nga admin manualisht ose nga Stripe Identity automatikisht.';
