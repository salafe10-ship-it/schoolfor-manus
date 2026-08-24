-- Canonical ERP financial integration for student fees and accrued expenses.
-- The snapshot remains a UI/read compatibility model; these tables are the
-- authoritative posting model used by the server-side integration service.

BEGIN;

CREATE TABLE IF NOT EXISTS public.erp_chart_of_accounts (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    account_nature text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    is_leaf boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, account_code),
    CONSTRAINT fk_erp_coa_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_coa_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_erp_coa_code CHECK (length(btrim(account_code)) > 0),
    CONSTRAINT ck_erp_coa_name CHECK (length(btrim(account_name)) > 0),
    CONSTRAINT ck_erp_coa_nature CHECK (account_nature IN ('asset', 'liability', 'equity', 'revenue', 'expense'))
);

CREATE TABLE IF NOT EXISTS public.erp_account_mappings (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    mapping_key text NOT NULL,
    account_code text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, mapping_key),
    CONSTRAINT fk_erp_mapping_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_mapping_actor
        FOREIGN KEY (updated_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_mapping_account
        FOREIGN KEY (school_id, account_code)
        REFERENCES public.erp_chart_of_accounts (school_id, account_code)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_erp_mapping_key CHECK (length(btrim(mapping_key)) > 0)
);

CREATE TABLE IF NOT EXISTS public.erp_journal_entries (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    entry_date date NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'posted',
    source_type text NOT NULL,
    source_id text NOT NULL,
    idempotency_key text NOT NULL,
    total_debit numeric(14,2) NOT NULL,
    total_credit numeric(14,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_erp_journal_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_journal_actor
        FOREIGN KEY (created_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_erp_journal_source UNIQUE (school_id, source_type, source_id),
    CONSTRAINT uq_erp_journal_idempotency UNIQUE (school_id, idempotency_key),
    CONSTRAINT ck_erp_journal_status CHECK (status = 'posted'),
    CONSTRAINT ck_erp_journal_totals CHECK (
        total_debit > 0 AND total_credit > 0 AND total_debit = total_credit
    )
);

CREATE TABLE IF NOT EXISTS public.erp_journal_lines (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    journal_entry_id text NOT NULL,
    id text NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    debit numeric(14,2) NOT NULL DEFAULT 0,
    credit numeric(14,2) NOT NULL DEFAULT 0,
    cost_center text,
    PRIMARY KEY (school_id, journal_entry_id, id),
    CONSTRAINT fk_erp_line_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_line_journal
        FOREIGN KEY (school_id, journal_entry_id)
        REFERENCES public.erp_journal_entries (school_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_line_account
        FOREIGN KEY (school_id, account_code)
        REFERENCES public.erp_chart_of_accounts (school_id, account_code)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_erp_line_values CHECK (
        debit >= 0 AND credit >= 0 AND ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
    )
);

CREATE TABLE IF NOT EXISTS public.erp_general_ledger (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    journal_entry_id text NOT NULL,
    journal_line_id text NOT NULL,
    account_code text NOT NULL,
    entry_date date NOT NULL,
    debit numeric(14,2) NOT NULL DEFAULT 0,
    credit numeric(14,2) NOT NULL DEFAULT 0,
    balance_after numeric(14,2) NOT NULL DEFAULT 0,
    source_type text NOT NULL,
    source_id text NOT NULL,
    description text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_erp_gl_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_gl_journal
        FOREIGN KEY (school_id, journal_entry_id)
        REFERENCES public.erp_journal_entries (school_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_gl_account
        FOREIGN KEY (school_id, account_code)
        REFERENCES public.erp_chart_of_accounts (school_id, account_code)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_erp_gl_values CHECK (debit >= 0 AND credit >= 0)
);

CREATE TABLE IF NOT EXISTS public.erp_expense_accruals (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    accrual_date date NOT NULL,
    description text NOT NULL,
    supplier_name text NOT NULL DEFAULT '',
    amount numeric(14,2) NOT NULL,
    expense_account text NOT NULL,
    payable_account text NOT NULL DEFAULT '2101',
    status text NOT NULL DEFAULT 'accrued',
    journal_entry_id text,
    idempotency_key text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_erp_accrual_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_accrual_actor
        FOREIGN KEY (created_by)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_erp_accrual_idempotency UNIQUE (school_id, idempotency_key),
    CONSTRAINT ck_erp_accrual_amount CHECK (amount > 0),
    CONSTRAINT ck_erp_accrual_status CHECK (status IN ('accrued', 'settled', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.erp_financial_audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    operation text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    actor_user_id uuid NOT NULL,
    after_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_erp_audit_school
        FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_erp_audit_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES public.users (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_erp_audit_payload_object CHECK (jsonb_typeof(after_payload) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_erp_journal_date
    ON public.erp_journal_entries (tenant_id, school_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_erp_journal_source
    ON public.erp_journal_entries (tenant_id, school_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_erp_gl_account_date
    ON public.erp_general_ledger (tenant_id, school_id, account_code, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_erp_accrual_date_status
    ON public.erp_expense_accruals (tenant_id, school_id, accrual_date DESC, status);

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'erp_chart_of_accounts',
        'erp_account_mappings',
        'erp_journal_entries',
        'erp_journal_lines',
        'erp_general_ledger',
        'erp_expense_accruals',
        'erp_financial_audit_events'
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

GRANT SELECT, INSERT, UPDATE ON TABLE
    public.erp_chart_of_accounts,
    public.erp_account_mappings,
    public.erp_journal_entries,
    public.erp_journal_lines,
    public.erp_general_ledger,
    public.erp_expense_accruals,
    public.erp_financial_audit_events
TO authenticated;

COMMENT ON TABLE public.erp_journal_entries IS
    'Canonical posted double-entry journal for ERP source documents.';
COMMENT ON TABLE public.erp_account_mappings IS
    'School-owned mapping from ERP business functions to the chart of accounts.';
COMMENT ON TABLE public.erp_general_ledger IS
    'Immutable canonical general-ledger lines derived from posted ERP journals.';
COMMENT ON TABLE public.erp_expense_accruals IS
    'Accrued expenses subledger linked to canonical posted journals.';
COMMENT ON TABLE public.erp_financial_audit_events IS
    'Append-only audit trail for canonical ERP financial synchronization.';

COMMIT;
