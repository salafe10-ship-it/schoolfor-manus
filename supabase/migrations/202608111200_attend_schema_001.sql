-- ATTEND-SCHEMA-001
-- Canonical Student Attendance schema preparation only.
-- This migration is intentionally not executed by this mission.
-- RLS, triggers, functions, roles, seed data, and views are excluded.

CREATE TABLE attendance_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    term_id uuid NOT NULL,
    class_reference text NOT NULL,
    section_reference text NOT NULL,
    attendance_date date NOT NULL,
    period_reference text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_attendance_sessions PRIMARY KEY (id),
    CONSTRAINT fk_attendance_sessions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_sessions_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_sessions_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_sessions_academic_year_scope FOREIGN KEY (tenant_id, school_id, academic_year_id)
        REFERENCES academic_years (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_sessions_term_scope FOREIGN KEY (tenant_id, school_id, academic_year_id, term_id)
        REFERENCES terms (tenant_id, school_id, academic_year_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_sessions_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_sessions_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_sessions_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_attendance_sessions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_attendance_sessions_scope_id UNIQUE (tenant_id, school_id, branch_id, id),
    CONSTRAINT uq_attendance_sessions_occurrence UNIQUE (
        tenant_id,
        school_id,
        branch_id,
        academic_year_id,
        term_id,
        class_reference,
        section_reference,
        attendance_date,
        period_reference
    ),
    CONSTRAINT ck_attendance_sessions_class_reference CHECK (length(btrim(class_reference)) > 0),
    CONSTRAINT ck_attendance_sessions_section_reference CHECK (length(btrim(section_reference)) > 0),
    CONSTRAINT ck_attendance_sessions_period_reference CHECK (length(btrim(period_reference)) > 0),
    CONSTRAINT ck_attendance_sessions_status CHECK (status IN ('open', 'locked')),
    CONSTRAINT ck_attendance_sessions_version CHECK (version >= 1)
);

CREATE TABLE attendance_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    attendance_session_id uuid NOT NULL,
    student_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    attendance_status text NOT NULL,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    recorded_by uuid NOT NULL,
    corrected_at timestamptz,
    corrected_by uuid,
    correction_reason text,
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_attendance_records PRIMARY KEY (id),
    CONSTRAINT fk_attendance_records_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_session_scope FOREIGN KEY (tenant_id, school_id, branch_id, attendance_session_id)
        REFERENCES attendance_sessions (tenant_id, school_id, branch_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_student_scope FOREIGN KEY (tenant_id, school_id, student_id)
        REFERENCES students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_enrollment_scope FOREIGN KEY (tenant_id, enrollment_id)
        REFERENCES enrollments (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_recorded_by_scope FOREIGN KEY (tenant_id, recorded_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_corrected_by_scope FOREIGN KEY (tenant_id, corrected_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_records_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_attendance_records_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_attendance_records_session_student UNIQUE (tenant_id, attendance_session_id, student_id),
    CONSTRAINT ck_attendance_records_status CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
    CONSTRAINT ck_attendance_records_version CHECK (version >= 1),
    CONSTRAINT ck_attendance_records_correction CHECK (
        (corrected_at IS NULL AND corrected_by IS NULL AND correction_reason IS NULL)
        OR (
            corrected_at IS NOT NULL
            AND corrected_by IS NOT NULL
            AND correction_reason IS NOT NULL
            AND length(btrim(correction_reason)) > 0
        )
    )
);

CREATE INDEX idx_attendance_sessions_scope_date
    ON attendance_sessions (tenant_id, school_id, branch_id, attendance_date, status);
CREATE INDEX idx_attendance_sessions_class_date
    ON attendance_sessions (tenant_id, school_id, branch_id, class_reference, section_reference, attendance_date);
CREATE INDEX idx_attendance_sessions_academic_context
    ON attendance_sessions (tenant_id, school_id, academic_year_id, term_id, attendance_date);
CREATE INDEX idx_attendance_records_student_history
    ON attendance_records (tenant_id, school_id, branch_id, student_id, recorded_at DESC);
CREATE INDEX idx_attendance_records_enrollment
    ON attendance_records (tenant_id, enrollment_id, recorded_at DESC);
CREATE INDEX idx_attendance_records_session_status
    ON attendance_records (tenant_id, attendance_session_id, attendance_status);
