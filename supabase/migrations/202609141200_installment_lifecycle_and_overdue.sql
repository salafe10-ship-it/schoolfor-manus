-- Canonical installment lifecycle: immutable history plus safe cancellation.
-- This migration is additive and preserves existing plans/schedules.

CREATE TABLE IF NOT EXISTS public.student_fee_installment_plan_history (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL,
    action text NOT NULL,
    reason text NOT NULL,
    snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL,
    PRIMARY KEY (school_id, id),
    CONSTRAINT fk_student_fee_plan_history_school FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_plan_history_plan FOREIGN KEY (school_id, plan_id)
        REFERENCES public.student_fee_installment_plans (school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_fee_plan_history_actor FOREIGN KEY (created_by)
        REFERENCES public.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_plan_history_action CHECK (action IN ('created', 'amended', 'cancelled', 'completed')),
    CONSTRAINT ck_student_fee_plan_history_snapshot_object CHECK (jsonb_typeof(snapshot) = 'object')
);

CREATE INDEX IF NOT EXISTS ix_student_fee_plan_history_plan
    ON public.student_fee_installment_plan_history (school_id, plan_id, created_at DESC);

ALTER TABLE public.student_fee_installment_plan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_fee_plan_history_school_scope ON public.student_fee_installment_plan_history;
CREATE POLICY student_fee_plan_history_school_scope
    ON public.student_fee_installment_plan_history
    USING (school_id = public.dbsec004_current_school_id())
    WITH CHECK (school_id = public.dbsec004_current_school_id());

-- School-scoped numbering keeps the human-facing receipt number sequential
-- without exposing internal UUIDs or allowing two concurrent postings to
-- receive the same number.
CREATE TABLE IF NOT EXISTS public.student_fee_receipt_sequences (
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    next_number bigint NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (school_id),
    CONSTRAINT fk_student_fee_receipt_sequence_school FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_fee_receipt_sequence_positive CHECK (next_number >= 1)
);

ALTER TABLE public.student_fee_receipt_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_fee_receipt_sequences_school_scope ON public.student_fee_receipt_sequences;
CREATE POLICY student_fee_receipt_sequences_school_scope
    ON public.student_fee_receipt_sequences
    USING (school_id = public.dbsec004_current_school_id())
    WITH CHECK (school_id = public.dbsec004_current_school_id());
