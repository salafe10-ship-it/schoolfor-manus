-- Canonical private attachments for posted financial vouchers.
-- Binary content lives in a private Supabase Storage bucket; this table is
-- the durable, tenant-scoped index and audit anchor.
CREATE TABLE IF NOT EXISTS public.financial_voucher_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    voucher_type text NOT NULL CHECK (voucher_type IN ('receipt_voucher', 'payment_voucher', 'student_fee_receipt')),
    voucher_id text NOT NULL,
    original_file_name text NOT NULL CHECK (char_length(original_file_name) BETWEEN 1 AND 200),
    object_key text NOT NULL UNIQUE,
    bucket_id text NOT NULL DEFAULT 'financial-voucher-attachments',
    media_type text NOT NULL,
    byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
    content_hash text NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    uploaded_by uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, school_id, voucher_type, voucher_id, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_financial_voucher_attachments_scope
    ON public.financial_voucher_attachments (tenant_id, school_id, voucher_type, voucher_id, status);

ALTER TABLE public.financial_voucher_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS financial_voucher_attachments_tenant_isolation ON public.financial_voucher_attachments;
CREATE POLICY financial_voucher_attachments_tenant_isolation
    ON public.financial_voucher_attachments FOR ALL
    USING (tenant_id::text = (auth.jwt()->'app_metadata'->>'tenant_id')
       AND school_id::text = (auth.jwt()->'app_metadata'->>'school_id'))
    WITH CHECK (tenant_id::text = (auth.jwt()->'app_metadata'->>'tenant_id')
       AND school_id::text = (auth.jwt()->'app_metadata'->>'school_id'));

