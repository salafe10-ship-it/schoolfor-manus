-- Student Finance Module — canonical persistence and audit projection.
-- This migration closes the gap between the StudentFinancialPortal and the
-- PostgreSQL source it already calls. The JSON snapshot remains the backwards
-- compatible read model, while the projection tables provide searchable,
-- tenant-scoped records for invoices, receipts and journal links.

BEGIN;

CREATE TABLE IF NOT EXISTS public.financial_portal_snapshots (
    tenant_id uuid NOT NULL,
    school_id uuid PRIMARY KEY,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    version bigint NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    CONSTRAINT fk_financial_snapshot_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_financial_snapshot_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_financial_snapshot_version CHECK (version >= 0),
    CONSTRAINT ck_financial_snapshot_payload_object CHECK (jsonb_typeof(data) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_financial_snapshots_tenant_updated
    ON public.financial_portal_snapshots (tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.student_fee_invoices (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    student_id text,
    student_name text NOT NULL DEFAULT '',
    item text NOT NULL DEFAULT '',
    amount numeric(14,2) NOT NULL DEFAULT 0,
    tax_amount numeric(14,2) NOT NULL DEFAULT 0,
    paid_amount numeric(14,2) NOT NULL DEFAULT 0,
    remaining_amount numeric(14,2) NOT NULL DEFAULT 0,
    invoice_date date,
    due_date date,
    status text NOT NULL DEFAULT 'unpaid',
    journal_entry_id text,
    source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_invoice_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_invoice_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_invoice_amounts CHECK (amount >= 0 AND tax_amount >= 0 AND paid_amount >= 0 AND remaining_amount >= 0),
    CONSTRAINT ck_student_fee_invoice_payload_object CHECK (jsonb_typeof(source_payload) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_student_fee_invoices_student_status
    ON public.student_fee_invoices (tenant_id, school_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_fee_invoices_due_date
    ON public.student_fee_invoices (tenant_id, school_id, due_date DESC);

CREATE TABLE IF NOT EXISTS public.student_fee_receipts (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    student_id text,
    student_name text NOT NULL DEFAULT '',
    receipt_date date,
    amount numeric(14,2) NOT NULL DEFAULT 0,
    payment_method text NOT NULL DEFAULT '',
    receiving_account text NOT NULL DEFAULT '',
    operational_type text NOT NULL DEFAULT '',
    against_text text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'draft',
    journal_entry_id text,
    receipt_voucher_id text,
    source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_receipt_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_receipt_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_receipt_amount CHECK (amount >= 0),
    CONSTRAINT ck_student_fee_receipt_payload_object CHECK (jsonb_typeof(source_payload) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_student_fee_receipts_student_date
    ON public.student_fee_receipts (tenant_id, school_id, student_id, receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_student_fee_receipts_status
    ON public.student_fee_receipts (tenant_id, school_id, status);

CREATE TABLE IF NOT EXISTS public.student_fee_journal_entries (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    entry_date date,
    description text NOT NULL DEFAULT '',
    debit_total numeric(14,2) NOT NULL DEFAULT 0,
    credit_total numeric(14,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'draft',
    document_type text,
    receipt_voucher_id text,
    source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_journal_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_journal_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_journal_totals CHECK (debit_total >= 0 AND credit_total >= 0),
    CONSTRAINT ck_student_fee_journal_payload_object CHECK (jsonb_typeof(source_payload) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_student_fee_journal_date_status
    ON public.student_fee_journal_entries (tenant_id, school_id, entry_date DESC, status);

CREATE TABLE IF NOT EXISTS public.student_fee_journal_lines (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    journal_entry_id text NOT NULL,
    id text NOT NULL,
    account_code text NOT NULL DEFAULT '',
    account_name text NOT NULL DEFAULT '',
    debit numeric(14,2) NOT NULL DEFAULT 0,
    credit numeric(14,2) NOT NULL DEFAULT 0,
    cost_center text,
    source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, journal_entry_id, id),
    CONSTRAINT fk_student_fee_journal_line_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_journal_line_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_journal_line_values CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT ck_student_fee_journal_line_payload_object CHECK (jsonb_typeof(source_payload) = 'object')
);

CREATE TABLE IF NOT EXISTS public.student_fee_configurations (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    fee_type text NOT NULL DEFAULT '',
    amount numeric(14,2) NOT NULL DEFAULT 0,
    revenue_account text NOT NULL DEFAULT '',
    order_number text NOT NULL DEFAULT '',
    activities text NOT NULL DEFAULT '',
    source_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_config_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_config_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_config_amount CHECK (amount >= 0),
    CONSTRAINT ck_student_fee_config_payload_object CHECK (jsonb_typeof(source_payload) = 'object')
);

CREATE TABLE IF NOT EXISTS public.student_fee_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    operation text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    actor_user_id uuid NOT NULL,
    before_payload jsonb,
    after_payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_student_fee_audit_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_audit_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_student_fee_audit_scope_time
    ON public.student_fee_audit_events (tenant_id, school_id, created_at DESC);

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'financial_portal_snapshots',
        'student_fee_invoices',
        'student_fee_receipts',
        'student_fee_journal_entries',
        'student_fee_journal_lines',
        'student_fee_configurations',
        'student_fee_audit_events'
    ] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'p_' || table_name || '_scope', table_name);
        EXECUTE format($policy$
            CREATE POLICY %I ON public.%I
            FOR ALL TO authenticated
            USING (
                tenant_id::text = current_setting('app.tenant_id', true)
                AND school_id::text = current_setting('app.school_id', true)
            )
            WITH CHECK (
                tenant_id::text = current_setting('app.tenant_id', true)
                AND school_id::text = current_setting('app.school_id', true)
            )
        $policy$, 'p_' || table_name || '_scope', table_name);
    END LOOP;
END $$;

-- Audit events are append-only: readers may inspect them, but authenticated
-- clients must not rewrite or delete the financial trail.
DROP POLICY IF EXISTS p_student_fee_audit_events_scope ON public.student_fee_audit_events;
CREATE POLICY p_student_fee_audit_events_select ON public.student_fee_audit_events
    FOR SELECT TO authenticated
    USING (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
    );
CREATE POLICY p_student_fee_audit_events_insert ON public.student_fee_audit_events
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id::text = current_setting('app.tenant_id', true)
        AND school_id::text = current_setting('app.school_id', true)
        AND actor_user_id::text = current_setting('app.user_id', true)
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.financial_portal_snapshots,
    public.student_fee_invoices,
    public.student_fee_receipts,
    public.student_fee_journal_entries,
    public.student_fee_journal_lines,
    public.student_fee_configurations,
    public.student_fee_audit_events TO authenticated;

COMMENT ON TABLE public.financial_portal_snapshots IS
    'Versioned compatibility read model for the Student Financial Portal; every write is tenant-scoped and audited.';
COMMENT ON TABLE public.student_fee_invoices IS
    'Searchable canonical projection of student fee claims from the financial portal.';
COMMENT ON TABLE public.student_fee_receipts IS
    'Searchable canonical projection of student receipt vouchers and their accounting links.';
COMMENT ON TABLE public.student_fee_journal_entries IS
    'Canonical projection of journal entries generated by student-fee receipt posting.';

COMMIT;
