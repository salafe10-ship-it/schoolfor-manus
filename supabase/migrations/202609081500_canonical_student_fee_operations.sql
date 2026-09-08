-- Canonical student-fee operations.
-- This migration is intentionally command-oriented: every financial action is
-- persisted as a tenant/school scoped record with an idempotency key and an
-- append-only audit trail. The legacy financial snapshot remains a read model
-- only and must not be used as the source of truth for new operations.

BEGIN;

ALTER TABLE public.student_fee_invoices
    ADD COLUMN IF NOT EXISTS branch_id uuid,
    ADD COLUMN IF NOT EXISTS template_id text,
    ADD COLUMN IF NOT EXISTS academic_year_id text,
    ADD COLUMN IF NOT EXISTS academic_period_id text,
    ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'SAR',
    ADD COLUMN IF NOT EXISTS idempotency_key text,
    ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_invoice_idempotency
    ON public.student_fee_invoices (school_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_fee_invoices_period_template
    ON public.student_fee_invoices (tenant_id, school_id, academic_year_id, academic_period_id, template_id);

CREATE TABLE IF NOT EXISTS public.student_fee_templates (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    amount numeric(14,2) NOT NULL,
    currency text NOT NULL DEFAULT 'SAR',
    revenue_account text NOT NULL,
    receivable_account text NOT NULL DEFAULT '1201',
    academic_year_id text NOT NULL,
    financial_period text NOT NULL,
    version integer NOT NULL DEFAULT 1,
    status text NOT NULL DEFAULT 'draft',
    effective_from date NOT NULL,
    effective_to date,
    eligibility_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    installment_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_template_school FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_template_created_by FOREIGN KEY (created_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_template_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_template_amount CHECK (amount > 0),
    CONSTRAINT ck_student_fee_template_version CHECK (version >= 1),
    CONSTRAINT ck_student_fee_template_status CHECK (status IN ('draft', 'active', 'retired')),
    CONSTRAINT ck_student_fee_template_dates CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT ck_student_fee_template_rules_object CHECK (jsonb_typeof(eligibility_rules) = 'object'),
    CONSTRAINT ck_student_fee_template_installment_object CHECK (jsonb_typeof(installment_policy) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_template_code_version
    ON public.student_fee_templates (school_id, code, academic_year_id, version);

CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    template_id text NOT NULL,
    academic_year_id text NOT NULL,
    academic_period_id text NOT NULL,
    gross_amount numeric(14,2) NOT NULL,
    discount_amount numeric(14,2) NOT NULL DEFAULT 0,
    net_amount numeric(14,2) NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'assigned',
    idempotency_key text NOT NULL,
    source text NOT NULL DEFAULT 'manual',
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_assignment_school FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_assignment_template FOREIGN KEY (school_id, template_id)
        REFERENCES public.student_fee_templates (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_assignment_student FOREIGN KEY (tenant_id, school_id, student_id)
        REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_assignment_actor FOREIGN KEY (created_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_assignment_amounts CHECK (gross_amount > 0 AND discount_amount >= 0 AND net_amount >= 0 AND discount_amount <= gross_amount),
    CONSTRAINT ck_student_fee_assignment_status CHECK (status IN ('assigned', 'invoiced', 'cancelled', 'waived'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_assignment_idempotency
    ON public.student_fee_assignments (school_id, idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_assignment_student_period
    ON public.student_fee_assignments (school_id, student_id, template_id, academic_year_id, academic_period_id)
    WHERE status <> 'cancelled';

CREATE TABLE IF NOT EXISTS public.student_fee_installment_plans (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_id text NOT NULL,
    student_id uuid NOT NULL,
    template_id text,
    total_amount numeric(14,2) NOT NULL,
    frequency text NOT NULL,
    method text NOT NULL DEFAULT 'equal',
    installment_count integer NOT NULL,
    currency text NOT NULL DEFAULT 'SAR',
    status text NOT NULL DEFAULT 'draft',
    policy jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    approved_at timestamptz,
    approved_by uuid,
    version integer NOT NULL DEFAULT 1,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_plan_school FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_plan_student FOREIGN KEY (tenant_id, school_id, student_id)
        REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_plan_invoice FOREIGN KEY (school_id, invoice_id)
        REFERENCES public.student_fee_invoices (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_plan_template FOREIGN KEY (school_id, template_id)
        REFERENCES public.student_fee_templates (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_plan_actor FOREIGN KEY (created_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_plan_amount CHECK (total_amount > 0),
    CONSTRAINT ck_student_fee_plan_count CHECK (installment_count BETWEEN 1 AND 60),
    CONSTRAINT ck_student_fee_plan_status CHECK (status IN ('draft', 'approved', 'cancelled', 'completed')),
    CONSTRAINT ck_student_fee_plan_policy_object CHECK (jsonb_typeof(policy) = 'object')
);

CREATE TABLE IF NOT EXISTS public.student_fee_installment_schedules (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    amount numeric(14,2) NOT NULL,
    paid_amount numeric(14,2) NOT NULL DEFAULT 0,
    penalty_amount numeric(14,2) NOT NULL DEFAULT 0,
    waived_penalty_amount numeric(14,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'scheduled',
    version integer NOT NULL DEFAULT 1,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_schedule_plan FOREIGN KEY (school_id, plan_id)
        REFERENCES public.student_fee_installment_plans (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_schedule_amounts CHECK (amount > 0 AND paid_amount >= 0 AND paid_amount <= amount AND penalty_amount >= 0 AND waived_penalty_amount >= 0),
    CONSTRAINT ck_student_fee_schedule_status CHECK (status IN ('scheduled', 'due', 'partially_paid', 'paid', 'overdue', 'cancelled', 'written_off'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_schedule_number
    ON public.student_fee_installment_schedules (school_id, plan_id, installment_number);

CREATE TABLE IF NOT EXISTS public.student_fee_concessions (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    guardian_id uuid,
    type text NOT NULL,
    reason text NOT NULL,
    percentage numeric(5,2) NOT NULL DEFAULT 0,
    fixed_amount numeric(14,2) NOT NULL DEFAULT 0,
    valid_from date NOT NULL,
    valid_to date,
    status text NOT NULL DEFAULT 'pending',
    evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
    approved_by uuid,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_concession_student FOREIGN KEY (tenant_id, school_id, student_id)
        REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_concession_guardian FOREIGN KEY (tenant_id, guardian_id)
        REFERENCES public.guardians (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_concession_actor FOREIGN KEY (created_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_concession_approver FOREIGN KEY (approved_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_concession_percent CHECK (percentage BETWEEN 0 AND 100),
    CONSTRAINT ck_student_fee_concession_fixed CHECK (fixed_amount >= 0),
    CONSTRAINT ck_student_fee_concession_type CHECK (type IN ('scholarship', 'sibling', 'exemption', 'staff', 'manual_adjustment')),
    CONSTRAINT ck_student_fee_concession_status CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')),
    CONSTRAINT ck_student_fee_concession_dates CHECK (valid_to IS NULL OR valid_to >= valid_from),
    CONSTRAINT ck_student_fee_concession_evidence_array CHECK (jsonb_typeof(evidence) = 'array')
);

CREATE TABLE IF NOT EXISTS public.student_fee_allocations (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    receipt_id text NOT NULL,
    invoice_id text NOT NULL,
    installment_schedule_id uuid,
    amount numeric(14,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_allocation_receipt FOREIGN KEY (school_id, receipt_id)
        REFERENCES public.student_fee_receipts (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_allocation_invoice FOREIGN KEY (school_id, invoice_id)
        REFERENCES public.student_fee_invoices (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_allocation_schedule FOREIGN KEY (school_id, installment_schedule_id)
        REFERENCES public.student_fee_installment_schedules (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_allocation_actor FOREIGN KEY (created_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_allocation_amount CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS public.student_fee_payment_attempts (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    receipt_id text,
    student_id uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    currency text NOT NULL DEFAULT 'SAR',
    provider text NOT NULL,
    provider_reference text,
    idempotency_key text NOT NULL,
    status text NOT NULL DEFAULT 'created',
    failure_code text,
    failure_message text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_payment_student FOREIGN KEY (tenant_id, school_id, student_id)
        REFERENCES public.students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_payment_receipt FOREIGN KEY (school_id, receipt_id)
        REFERENCES public.student_fee_receipts (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_payment_amount CHECK (amount > 0),
    CONSTRAINT ck_student_fee_payment_status CHECK (status IN ('created', 'pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
    CONSTRAINT ck_student_fee_payment_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_payment_idempotency
    ON public.student_fee_payment_attempts (school_id, idempotency_key);

CREATE TABLE IF NOT EXISTS public.student_fee_payment_webhooks (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    event_id text NOT NULL,
    event_type text NOT NULL,
    signature_hash text NOT NULL,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'received',
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_webhook_school FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_webhook_payload_object CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT ck_student_fee_webhook_status CHECK (status IN ('received', 'processed', 'ignored', 'failed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_student_fee_webhook_event
    ON public.student_fee_payment_webhooks (school_id, provider, event_id);

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'student_fee_templates',
        'student_fee_assignments',
        'student_fee_installment_plans',
        'student_fee_installment_schedules',
        'student_fee_concessions',
        'student_fee_allocations',
        'student_fee_payment_attempts',
        'student_fee_payment_webhooks'
    ] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'p_' || table_name || '_scope', table_name);
        EXECUTE format($policy$
            CREATE POLICY %I ON public.%I
            FOR ALL TO authenticated
            USING (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true))
            WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true) AND school_id::text = current_setting('app.school_id', true))
        $policy$, 'p_' || table_name || '_scope', table_name);
    END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE ON TABLE
    public.student_fee_templates,
    public.student_fee_assignments,
    public.student_fee_installment_plans,
    public.student_fee_installment_schedules,
    public.student_fee_concessions,
    public.student_fee_allocations,
    public.student_fee_payment_attempts,
    public.student_fee_payment_webhooks TO authenticated;

COMMIT;
