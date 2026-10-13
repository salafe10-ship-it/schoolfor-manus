-- Preserve allocation history while allowing an atomic receipt reversal.
-- Reversed allocations remain queryable for audit and are excluded from
-- balances and idempotency checks by the canonical student-fee commands.

BEGIN;

ALTER TABLE public.student_fee_allocations
    ADD COLUMN IF NOT EXISTS reversed_at timestamptz,
    ADD COLUMN IF NOT EXISTS reversed_by uuid,
    ADD COLUMN IF NOT EXISTS reversal_reason text,
    ADD COLUMN IF NOT EXISTS reversal_journal_id text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'fk_student_fee_allocation_reversed_by'
           AND conrelid = 'public.student_fee_allocations'::regclass
    ) THEN
        ALTER TABLE public.student_fee_allocations
            ADD CONSTRAINT fk_student_fee_allocation_reversed_by
            FOREIGN KEY (reversed_by) REFERENCES public.users (id)
            ON UPDATE RESTRICT ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_fee_allocations_active_receipt
    ON public.student_fee_allocations (tenant_id, school_id, receipt_id)
    WHERE reversed_at IS NULL;

COMMIT;
