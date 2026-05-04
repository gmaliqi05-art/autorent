/*
  # Client Cancellation Policy + Client Documents

  1. Bookings — cancellation policy columns (cancellation_fee, cancelled_at, cancelled_by)
  2. New table `client_documents` (driver license + ID + verification workflow)
  3. Storage bucket `client-documents` (private, owner-scoped policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cancellation_fee') THEN
    ALTER TABLE bookings ADD COLUMN cancellation_fee numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cancelled_at') THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='cancelled_by') THEN
    ALTER TABLE bookings ADD COLUMN cancelled_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_front_url text,
  license_back_url text,
  license_number text,
  license_expiry date,
  license_categories text[] DEFAULT ARRAY[]::text[],
  id_document_url text,
  id_type text CHECK (id_type IN ('passport','national_id')),
  id_number text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients view own documents" ON client_documents;
CREATE POLICY "Clients view own documents"
  ON client_documents FOR SELECT TO authenticated
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients insert own documents" ON client_documents;
CREATE POLICY "Clients insert own documents"
  ON client_documents FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients update own documents" ON client_documents;
CREATE POLICY "Clients update own documents"
  ON client_documents FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients delete own documents" ON client_documents;
CREATE POLICY "Clients delete own documents"
  ON client_documents FOR DELETE TO authenticated
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Super admins view all documents" ON client_documents;
CREATE POLICY "Super admins view all documents"
  ON client_documents FOR SELECT TO authenticated
  USING (is_super_admin());

DROP POLICY IF EXISTS "Super admins update verification" ON client_documents;
CREATE POLICY "Super admins update verification"
  ON client_documents FOR UPDATE TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_verified ON client_documents(verified);

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Clients can view own document files" ON storage.objects;
CREATE POLICY "Clients can view own document files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clients can upload own document files" ON storage.objects;
CREATE POLICY "Clients can upload own document files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clients can update own document files" ON storage.objects;
CREATE POLICY "Clients can update own document files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clients can delete own document files" ON storage.objects;
CREATE POLICY "Clients can delete own document files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Super admins view all client document files" ON storage.objects;
CREATE POLICY "Super admins view all client document files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND is_super_admin()
  );
