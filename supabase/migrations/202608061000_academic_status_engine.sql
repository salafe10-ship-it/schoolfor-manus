-- Enterprise Student Platform - Academic Status Engine
-- Mission: EWP-004
-- Scope: student_academic_status, student_status_history,
--        student_status_transitions only.
-- Previous packages are intentionally unchanged.
-- Intentionally excludes RLS, RPC, user-defined functions, triggers, views,
-- and data insertion statements.

CREATE TABLE student_academic_status (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'applicant',
    effective_on date NOT NULL,
    reason_code text NOT NULL,
    reason_notes text,
    approved_at timestamptz,
    approved_by uuid,
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
    CONSTRAINT pk_student_academic_status PRIMARY KEY (id),
    CONSTRAINT fk_student_academic_status_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_approved_by_scope FOREIGN KEY (tenant_id, approved_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_academic_status_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_student_academic_status_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_student_academic_status_current_student UNIQUE (tenant_id, student_id),
    CONSTRAINT ck_student_academic_status_value CHECK (
        status IN ('applicant', 'admitted', 'active', 'suspended', 'withdrawn', 'graduated', 'archived')
    ),
    CONSTRAINT ck_student_academic_status_reason CHECK (length(btrim(reason_code)) > 0),
    CONSTRAINT ck_student_academic_status_approval_pair CHECK (
        (approved_at IS NULL AND approved_by IS NULL)
        OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_academic_status_version CHECK (version >= 1),
    CONSTRAINT ck_student_academic_status_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_academic_status_deleted_state CHECK (
        deleted_at IS NULL OR status = 'archived'
    )
);

CREATE TABLE student_status_transitions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    from_status text,
    to_status text NOT NULL,
    transition_kind text NOT NULL DEFAULT 'ordinary',
    approval_status text NOT NULL DEFAULT 'pending',
    effective_on date NOT NULL,
    reason_code text NOT NULL,
    reason_notes text,
    correction_reference text,
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
    CONSTRAINT pk_student_status_transitions PRIMARY KEY (id),
    CONSTRAINT fk_student_status_transitions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_requested_by_scope FOREIGN KEY (tenant_id, requested_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_approved_by_scope FOREIGN KEY (tenant_id, approved_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_completed_by_scope FOREIGN KEY (tenant_id, completed_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_transitions_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_student_status_transitions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_student_status_transitions_idempotency UNIQUE (tenant_id, idempotency_key),
    CONSTRAINT ck_student_status_transitions_from_status CHECK (
        from_status IS NULL OR from_status IN ('applicant', 'admitted', 'active', 'suspended', 'withdrawn', 'graduated', 'archived')
    ),
    CONSTRAINT ck_student_status_transitions_to_status CHECK (
        to_status IN ('applicant', 'admitted', 'active', 'suspended', 'withdrawn', 'graduated', 'archived')
    ),
    CONSTRAINT ck_student_status_transitions_kind CHECK (
        transition_kind IN ('initial', 'ordinary', 'correction')
    ),
    CONSTRAINT ck_student_status_transitions_approval_status CHECK (
        approval_status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')
    ),
    CONSTRAINT ck_student_status_transitions_allowed CHECK (
        (
            transition_kind = 'initial'
            AND from_status IS NULL
            AND to_status = 'applicant'
        )
        OR (
            transition_kind = 'ordinary'
            AND (
                (from_status = 'applicant' AND to_status = 'admitted')
                OR (from_status = 'admitted' AND to_status = 'active')
                OR (from_status = 'active' AND to_status = 'suspended')
                OR (from_status = 'suspended' AND to_status = 'withdrawn')
                OR (from_status = 'withdrawn' AND to_status = 'graduated')
                OR (from_status = 'graduated' AND to_status = 'archived')
            )
        )
        OR (
            transition_kind = 'correction'
            AND correction_reference IS NOT NULL
            AND length(btrim(correction_reference)) > 0
            AND approval_status IN ('approved', 'completed')
        )
    ),
    CONSTRAINT ck_student_status_transitions_reason CHECK (length(btrim(reason_code)) > 0),
    CONSTRAINT ck_student_status_transitions_idempotency CHECK (length(btrim(idempotency_key)) > 0),
    CONSTRAINT ck_student_status_transitions_approval_pair CHECK (
        (approved_at IS NULL AND approved_by IS NULL)
        OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_status_transitions_completion_pair CHECK (
        (completed_at IS NULL AND completed_by IS NULL)
        OR (completed_at IS NOT NULL AND completed_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_status_transitions_status_requirements CHECK (
        (
            approval_status NOT IN ('approved', 'completed')
            OR approved_at IS NOT NULL
        )
        AND (
            approval_status <> 'completed'
            OR completed_at IS NOT NULL
        )
    ),
    CONSTRAINT ck_student_status_transitions_dates CHECK (
        requested_at <= COALESCE(approved_at, requested_at)
        AND requested_at <= COALESCE(completed_at, requested_at)
        AND (approved_at IS NULL OR completed_at IS NULL OR approved_at <= completed_at)
    ),
    CONSTRAINT ck_student_status_transitions_version CHECK (version >= 1),
    CONSTRAINT ck_student_status_transitions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_status_transitions_deleted_state CHECK (
        deleted_at IS NULL OR approval_status = 'cancelled'
    )
);

CREATE TABLE student_status_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    transition_id uuid NOT NULL,
    from_status text,
    to_status text NOT NULL,
    event_type text NOT NULL,
    effective_on date NOT NULL,
    reason_code text NOT NULL,
    reason_notes text,
    approved_at timestamptz,
    approved_by uuid,
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
    CONSTRAINT pk_student_status_history PRIMARY KEY (id),
    CONSTRAINT fk_student_status_history_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_transition_scope FOREIGN KEY (tenant_id, transition_id)
        REFERENCES student_status_transitions (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_approved_by_scope FOREIGN KEY (tenant_id, approved_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_recorded_by_scope FOREIGN KEY (tenant_id, recorded_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_status_history_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_student_status_history_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_student_status_history_transition UNIQUE (tenant_id, transition_id),
    CONSTRAINT ck_student_status_history_from_status CHECK (
        from_status IS NULL OR from_status IN ('applicant', 'admitted', 'active', 'suspended', 'withdrawn', 'graduated', 'archived')
    ),
    CONSTRAINT ck_student_status_history_to_status CHECK (
        to_status IN ('applicant', 'admitted', 'active', 'suspended', 'withdrawn', 'graduated', 'archived')
    ),
    CONSTRAINT ck_student_status_history_event_type CHECK (
        event_type IN ('initial', 'ordinary', 'correction')
    ),
    CONSTRAINT ck_student_status_history_transition_shape CHECK (
        (event_type = 'initial' AND from_status IS NULL AND to_status = 'applicant')
        OR (event_type <> 'initial' AND from_status IS NOT NULL AND from_status <> to_status)
    ),
    CONSTRAINT ck_student_status_history_reason CHECK (length(btrim(reason_code)) > 0),
    CONSTRAINT ck_student_status_history_approval_pair CHECK (
        (approved_at IS NULL AND approved_by IS NULL)
        OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_status_history_status CHECK (status = 'active'),
    CONSTRAINT ck_student_status_history_version CHECK (version >= 1),
    CONSTRAINT ck_student_status_history_immutable_delete CHECK (
        deleted_at IS NULL AND deleted_by IS NULL
    )
);

CREATE INDEX idx_student_academic_status_current
    ON student_academic_status (tenant_id, school_id, branch_id, status);

CREATE INDEX idx_student_status_transitions_student
    ON student_status_transitions (tenant_id, student_id, effective_on DESC, requested_at DESC);
CREATE INDEX idx_student_status_transitions_approval_queue
    ON student_status_transitions (tenant_id, school_id, approval_status, effective_on);
CREATE INDEX idx_student_status_transitions_target_status
    ON student_status_transitions (tenant_id, school_id, to_status, effective_on DESC);

CREATE INDEX idx_student_status_history_student_timeline
    ON student_status_history (tenant_id, student_id, effective_on DESC, recorded_at DESC);
CREATE INDEX idx_student_status_history_school_reporting
    ON student_status_history (tenant_id, school_id, branch_id, to_status, effective_on DESC);
CREATE INDEX idx_student_status_history_transition
    ON student_status_history (tenant_id, transition_id);

REVOKE DELETE, TRUNCATE ON student_academic_status, student_status_transitions FROM PUBLIC;
REVOKE DELETE, TRUNCATE ON student_academic_status, student_status_transitions FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON student_status_history FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON student_status_history FROM anon, authenticated;
