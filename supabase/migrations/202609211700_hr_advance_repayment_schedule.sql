-- Canonical HR advance/loan repayment schedule.
-- The HR snapshot remains the compatibility envelope; this table is the
-- durable source for installment-level reconciliation and repayment history.
BEGIN;

CREATE TABLE IF NOT EXISTS public.hr_advance_repayment_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    advance_id text NOT NULL,
    employee_id text NOT NULL,
    cost_center text NOT NULL,
    installment_number integer NOT NULL,
    due_date date NOT NULL,
    amount numeric(18,2) NOT NULL,
    paid_amount numeric(18,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'scheduled',
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_hr_advance_schedule_school FOREIGN KEY (tenant_id, school_id)
      REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_hr_advance_schedule_center CHECK (cost_center IN ('kindergarten','primary','middle','secondary','admin')),
    CONSTRAINT ck_hr_advance_schedule_number CHECK (installment_number > 0),
    CONSTRAINT ck_hr_advance_schedule_amount CHECK (amount > 0 AND paid_amount >= 0 AND paid_amount <= amount),
    CONSTRAINT ck_hr_advance_schedule_status CHECK (status IN ('scheduled','paid','partial','overdue')),
    UNIQUE (school_id, advance_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_hr_advance_schedule_scope_due
  ON public.hr_advance_repayment_schedules (tenant_id, school_id, due_date, status);

ALTER TABLE public.hr_advance_repayment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_advance_repayment_schedules FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_advance_repayment_schedules FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hr_advance_repayment_schedules TO authenticated;

DROP POLICY IF EXISTS p_hr_advance_schedule_scope ON public.hr_advance_repayment_schedules;
CREATE POLICY p_hr_advance_schedule_scope ON public.hr_advance_repayment_schedules
  FOR ALL TO authenticated
  USING (tenant_id::text = current_setting('app.tenant_id', true)
     AND school_id::text = current_setting('app.school_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.tenant_id', true)
     AND school_id::text = current_setting('app.school_id', true));

NOTIFY pgrst, 'reload schema';
COMMIT;
