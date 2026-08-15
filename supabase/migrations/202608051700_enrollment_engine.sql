-- Enterprise Student Platform - Enrollment Engine
-- Mission: EWP-003
-- Scope: enrollments, enrollment_history, enrollment_transfers only.
-- Package 001 and Guardian Platform tables are intentionally unchanged.
-- Intentionally excludes RLS, RPC, user-defined functions, triggers, views, and seed data.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE enrollments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    term_id uuid NOT NULL,
    enrollment_number text NOT NULL,
    admission_reference text,
    admission_status text NOT NULL DEFAULT 'pending',
    enrollment_status text NOT NULL DEFAULT 'pending',
    starts_on date NOT NULL,
    ends_on date,
    class_reference text,
    section_reference text,
    withdrawal_reason text,
    completion_reason text,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_enrollments PRIMARY KEY (id),
    CONSTRAINT fk_enrollments_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_academic_year_scope FOREIGN KEY (tenant_id, school_id, academic_year_id)
        REFERENCES academic_years (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_term_scope FOREIGN KEY (tenant_id, school_id, academic_year_id, term_id)
        REFERENCES terms (tenant_id, school_id, academic_year_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollments_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_enrollments_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_enrollments_school_number UNIQUE (school_id, enrollment_number),
    CONSTRAINT ck_enrollments_number_format CHECK (
        enrollment_number = btrim(enrollment_number)
        AND enrollment_number ~ '^[A-Z0-9][A-Z0-9._/-]*$'
    ),
    CONSTRAINT ck_enrollments_admission_status CHECK (
        admission_status IN ('pending', 'approved', 'rejected')
    ),
    CONSTRAINT ck_enrollments_status CHECK (
        enrollment_status IN ('draft', 'pending', 'active', 'completed', 'withdrawn', 'transferred', 'cancelled', 'archived')
    ),
    CONSTRAINT ck_enrollments_dates CHECK (
        ends_on IS NULL OR starts_on < ends_on
    ),
    CONSTRAINT ck_enrollments_admission_gate CHECK (
        enrollment_status IN ('draft', 'pending', 'cancelled', 'archived')
        OR (admission_status = 'approved' AND admission_reference IS NOT NULL AND length(btrim(admission_reference)) > 0)
    ),
    CONSTRAINT ck_enrollments_closed_reason CHECK (
        enrollment_status NOT IN ('withdrawn', 'completed')
        OR (
            (enrollment_status = 'withdrawn' AND withdrawal_reason IS NOT NULL AND length(btrim(withdrawal_reason)) > 0)
            OR (enrollment_status = 'completed' AND completion_reason IS NOT NULL AND length(btrim(completion_reason)) > 0)
        )
    ),
    CONSTRAINT ck_enrollments_closed_date CHECK (
        enrollment_status NOT IN ('completed', 'withdrawn', 'transferred')
        OR ends_on IS NOT NULL
    ),
    CONSTRAINT ck_enrollments_version CHECK (version >= 1),
    CONSTRAINT ck_enrollments_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_enrollments_deleted_status CHECK (
        deleted_at IS NULL OR enrollment_status = 'archived'
    )
);

ALTER TABLE enrollments
    ADD CONSTRAINT ex_enrollments_no_overlap
    EXCLUDE USING gist (
        tenant_id WITH =,
        student_id WITH =,
        daterange(starts_on, COALESCE(ends_on, 'infinity'::date), '[)') WITH &&
    )
    WHERE (
        deleted_at IS NULL
        AND enrollment_status NOT IN ('cancelled', 'archived')
    );

CREATE TABLE enrollment_transfers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    term_id uuid NOT NULL,
    from_school_id uuid NOT NULL,
    from_branch_id uuid,
    to_school_id uuid NOT NULL,
    to_branch_id uuid,
    from_enrollment_id uuid NOT NULL,
    to_enrollment_id uuid,
    transfer_status text NOT NULL DEFAULT 'requested',
    transfer_reason text NOT NULL,
    effective_on date NOT NULL,
    requested_at timestamptz NOT NULL DEFAULT now(),
    approved_at timestamptz,
    completed_at timestamptz,
    requested_by uuid,
    approved_by uuid,
    completed_by uuid,
    idempotency_key text NOT NULL,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_enrollment_transfers PRIMARY KEY (id),
    CONSTRAINT fk_enrollment_transfers_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_year_scope FOREIGN KEY (tenant_id, school_id, academic_year_id)
        REFERENCES academic_years (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_term_scope FOREIGN KEY (tenant_id, school_id, academic_year_id, term_id)
        REFERENCES terms (tenant_id, school_id, academic_year_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_from_school FOREIGN KEY (tenant_id, from_school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_from_branch FOREIGN KEY (tenant_id, from_school_id, from_branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_to_school FOREIGN KEY (tenant_id, to_school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_to_branch FOREIGN KEY (tenant_id, to_school_id, to_branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_from_enrollment FOREIGN KEY (tenant_id, from_enrollment_id)
        REFERENCES enrollments (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_to_enrollment FOREIGN KEY (tenant_id, to_enrollment_id)
        REFERENCES enrollments (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_requested_by_scope FOREIGN KEY (tenant_id, requested_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_approved_by_scope FOREIGN KEY (tenant_id, approved_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_completed_by_scope FOREIGN KEY (tenant_id, completed_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_transfers_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_enrollment_transfers_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_enrollment_transfers_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT ck_enrollment_transfers_status CHECK (
        transfer_status IN ('requested', 'approved', 'rejected', 'completed', 'cancelled', 'archived')
    ),
    CONSTRAINT ck_enrollment_transfers_reason CHECK (length(btrim(transfer_reason)) > 0),
    CONSTRAINT ck_enrollment_transfers_idempotency CHECK (length(btrim(idempotency_key)) > 0),
    CONSTRAINT ck_enrollment_transfers_destination CHECK (
        from_school_id IS DISTINCT FROM to_school_id
        OR from_branch_id IS DISTINCT FROM to_branch_id
    ),
    CONSTRAINT ck_enrollment_transfers_distinct_enrollments CHECK (
        to_enrollment_id IS NULL OR from_enrollment_id IS DISTINCT FROM to_enrollment_id
    ),
    CONSTRAINT ck_enrollment_transfers_approval_pair CHECK (
        (approved_at IS NULL AND approved_by IS NULL)
        OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)
    ),
    CONSTRAINT ck_enrollment_transfers_completion_pair CHECK (
        (completed_at IS NULL AND completed_by IS NULL)
        OR (completed_at IS NOT NULL AND completed_by IS NOT NULL)
    ),
    CONSTRAINT ck_enrollment_transfers_dates CHECK (
        requested_at <= COALESCE(approved_at, requested_at)
        AND requested_at <= COALESCE(completed_at, requested_at)
        AND (approved_at IS NULL OR completed_at IS NULL OR approved_at <= completed_at)
    ),
    CONSTRAINT ck_enrollment_transfers_status_requirements CHECK (
        (
            transfer_status NOT IN ('approved', 'completed')
            OR approved_at IS NOT NULL
        )
        AND (
            transfer_status <> 'completed'
            OR (completed_at IS NOT NULL AND to_enrollment_id IS NOT NULL)
        )
    ),
    CONSTRAINT ck_enrollment_transfers_version CHECK (version >= 1),
    CONSTRAINT ck_enrollment_transfers_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_enrollment_transfers_deleted_status CHECK (
        deleted_at IS NULL OR transfer_status = 'archived'
    )
);

CREATE TABLE enrollment_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    term_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    transfer_id uuid,
    event_type text NOT NULL,
    from_status text,
    to_status text NOT NULL,
    effective_on date NOT NULL,
    reason_code text,
    reason_notes text,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    recorded_by uuid,
    status text NOT NULL DEFAULT 'active',
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_enrollment_history PRIMARY KEY (id),
    CONSTRAINT fk_enrollment_history_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_year_scope FOREIGN KEY (tenant_id, school_id, academic_year_id)
        REFERENCES academic_years (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_term_scope FOREIGN KEY (tenant_id, school_id, academic_year_id, term_id)
        REFERENCES terms (tenant_id, school_id, academic_year_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_enrollment_scope FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES enrollments (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_transfer_scope FOREIGN KEY (tenant_id, transfer_id)
        REFERENCES enrollment_transfers (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_recorded_by_scope FOREIGN KEY (tenant_id, recorded_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_history_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_enrollment_history_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_enrollment_history_event_type CHECK (
        event_type IN ('created', 'activated', 'suspended', 'resumed', 'withdrawn', 'transferred', 'completed', 'cancelled', 'amended')
    ),
    CONSTRAINT ck_enrollment_history_from_status CHECK (
        from_status IS NULL OR from_status IN ('draft', 'pending', 'active', 'completed', 'withdrawn', 'transferred', 'cancelled', 'archived')
    ),
    CONSTRAINT ck_enrollment_history_to_status CHECK (
        to_status IN ('draft', 'pending', 'active', 'completed', 'withdrawn', 'transferred', 'cancelled', 'archived')
    ),
    CONSTRAINT ck_enrollment_history_created_event CHECK (
        (event_type = 'created' AND from_status IS NULL)
        OR (event_type <> 'created' AND from_status IS NOT NULL)
    ),
    CONSTRAINT ck_enrollment_history_status CHECK (status = 'active'),
    CONSTRAINT ck_enrollment_history_version CHECK (version >= 1),
    CONSTRAINT ck_enrollment_history_soft_delete_pair CHECK (
        deleted_at IS NULL AND deleted_by IS NULL
    )
);

CREATE UNIQUE INDEX uq_enrollments_active_student_year
    ON enrollments (tenant_id, student_id, academic_year_id)
    WHERE enrollment_status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_enrollments_current_lookup
    ON enrollments (tenant_id, school_id, branch_id, enrollment_status, academic_year_id);
CREATE INDEX idx_enrollments_student_history
    ON enrollments (tenant_id, student_id, starts_on DESC, ends_on DESC);
CREATE INDEX idx_enrollments_academic_year
    ON enrollments (tenant_id, school_id, academic_year_id, enrollment_status);

CREATE INDEX idx_enrollment_transfers_student_history
    ON enrollment_transfers (tenant_id, student_id, requested_at DESC);
CREATE INDEX idx_enrollment_transfers_reporting
    ON enrollment_transfers (tenant_id, school_id, from_school_id, to_school_id, transfer_status, effective_on);
CREATE INDEX idx_enrollment_transfers_status
    ON enrollment_transfers (tenant_id, transfer_status, effective_on);

CREATE INDEX idx_enrollment_history_student
    ON enrollment_history (tenant_id, student_id, effective_on DESC, recorded_at DESC);
CREATE INDEX idx_enrollment_history_enrollment
    ON enrollment_history (tenant_id, enrollment_id, effective_on DESC, recorded_at DESC);
CREATE INDEX idx_enrollment_history_status
    ON enrollment_history (tenant_id, school_id, to_status, effective_on DESC);

REVOKE DELETE, TRUNCATE ON enrollments, enrollment_transfers FROM PUBLIC;
REVOKE DELETE, TRUNCATE ON enrollments, enrollment_transfers FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON enrollment_history FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON enrollment_history FROM anon, authenticated;
