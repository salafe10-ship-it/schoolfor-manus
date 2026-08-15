-- Enterprise Student Platform - Package 001
-- Mission: EWP-001
-- Scope: students, guardians, student_guardians only.
-- Intentionally excludes RLS, RPC, triggers, functions, views, and seed data.

CREATE TABLE students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_number text NOT NULL,
    legal_first_name text NOT NULL,
    legal_middle_name text,
    legal_last_name text NOT NULL,
    preferred_name text,
    date_of_birth date NOT NULL,
    gender text,
    nationality text,
    birth_country_code char(2),
    status text NOT NULL DEFAULT 'applicant',
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
    CONSTRAINT pk_students PRIMARY KEY (id),
    CONSTRAINT fk_students_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_students_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_students_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_students_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_students_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_students_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_students_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_students_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_students_tenant_school_id UNIQUE (tenant_id, school_id, id),
    CONSTRAINT uq_students_school_student_number UNIQUE (school_id, student_number),
    CONSTRAINT ck_students_number_format CHECK (
        student_number = btrim(student_number)
        AND student_number ~ '^[A-Z0-9][A-Z0-9._/-]*$'
    ),
    CONSTRAINT ck_students_first_name CHECK (length(btrim(legal_first_name)) > 0),
    CONSTRAINT ck_students_last_name CHECK (length(btrim(legal_last_name)) > 0),
    CONSTRAINT ck_students_middle_name CHECK (
        legal_middle_name IS NULL OR length(btrim(legal_middle_name)) > 0
    ),
    CONSTRAINT ck_students_preferred_name CHECK (
        preferred_name IS NULL OR length(btrim(preferred_name)) > 0
    ),
    CONSTRAINT ck_students_birth_country_code CHECK (
        birth_country_code IS NULL OR birth_country_code ~ '^[A-Z]{2}$'
    ),
    CONSTRAINT ck_students_status CHECK (
        status IN ('applicant', 'admitted', 'active', 'suspended', 'withdrawn', 'graduated', 'archived')
    ),
    CONSTRAINT ck_students_version CHECK (version >= 1),
    CONSTRAINT ck_students_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_students_deleted_status CHECK (
        deleted_at IS NULL OR status = 'archived'
    )
);

CREATE TABLE guardians (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    guardian_number text NOT NULL,
    legal_first_name text NOT NULL,
    legal_middle_name text,
    legal_last_name text NOT NULL,
    phone text,
    email text,
    address_line1 text,
    address_line2 text,
    city text,
    country_code char(2),
    verification_status text NOT NULL DEFAULT 'unverified',
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
    CONSTRAINT pk_guardians PRIMARY KEY (id),
    CONSTRAINT fk_guardians_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardians_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardians_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardians_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardians_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardians_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardians_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_guardians_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_guardians_tenant_number UNIQUE (tenant_id, guardian_number),
    CONSTRAINT ck_guardians_branch_requires_school CHECK (
        branch_id IS NULL OR school_id IS NOT NULL
    ),
    CONSTRAINT ck_guardians_number_format CHECK (
        guardian_number = btrim(guardian_number)
        AND guardian_number ~ '^[A-Z0-9][A-Z0-9._/-]*$'
    ),
    CONSTRAINT ck_guardians_first_name CHECK (length(btrim(legal_first_name)) > 0),
    CONSTRAINT ck_guardians_last_name CHECK (length(btrim(legal_last_name)) > 0),
    CONSTRAINT ck_guardians_middle_name CHECK (
        legal_middle_name IS NULL OR length(btrim(legal_middle_name)) > 0
    ),
    CONSTRAINT ck_guardians_email CHECK (
        email IS NULL OR (email = btrim(email) AND position('@' IN email) > 1)
    ),
    CONSTRAINT ck_guardians_country_code CHECK (
        country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
    ),
    CONSTRAINT ck_guardians_verification_status CHECK (
        verification_status IN ('unverified', 'pending', 'verified', 'rejected')
    ),
    CONSTRAINT ck_guardians_status CHECK (
        status IN ('active', 'inactive', 'archived')
    ),
    CONSTRAINT ck_guardians_version CHECK (version >= 1),
    CONSTRAINT ck_guardians_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_guardians_deleted_status CHECK (
        deleted_at IS NULL OR status = 'archived'
    )
);

CREATE TABLE student_guardians (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    guardian_id uuid NOT NULL,
    relationship_type text NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,
    is_emergency_contact boolean NOT NULL DEFAULT false,
    can_collect_student boolean NOT NULL DEFAULT false,
    custody_status text NOT NULL DEFAULT 'unknown',
    consent_status text NOT NULL DEFAULT 'pending',
    effective_from date NOT NULL DEFAULT CURRENT_DATE,
    effective_to date,
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
    CONSTRAINT pk_student_guardians PRIMARY KEY (id),
    CONSTRAINT fk_student_guardians_student_scope FOREIGN KEY (tenant_id, school_id, student_id)
        REFERENCES students (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardians_guardian_scope FOREIGN KEY (tenant_id, guardian_id)
        REFERENCES guardians (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardians_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardians_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardians_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardians_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardians_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_guardians_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_student_guardians_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_student_guardians_relationship CHECK (
        relationship_type IN ('parent', 'legal_guardian', 'foster_parent', 'sibling', 'relative', 'sponsor', 'other')
    ),
    CONSTRAINT ck_student_guardians_custody CHECK (
        custody_status IN ('unknown', 'shared', 'sole', 'none', 'court_ordered')
    ),
    CONSTRAINT ck_student_guardians_consent CHECK (
        consent_status IN ('pending', 'granted', 'revoked', 'not_required')
    ),
    CONSTRAINT ck_student_guardians_dates CHECK (
        effective_to IS NULL OR effective_from <= effective_to
    ),
    CONSTRAINT ck_student_guardians_status CHECK (
        status IN ('active', 'inactive', 'archived')
    ),
    CONSTRAINT ck_student_guardians_primary_active CHECK (
        is_primary = false OR status = 'active'
    ),
    CONSTRAINT ck_student_guardians_version CHECK (version >= 1),
    CONSTRAINT ck_student_guardians_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_guardians_deleted_status CHECK (
        deleted_at IS NULL OR status = 'archived'
    )
);

CREATE INDEX idx_students_tenant_school_status
    ON students (tenant_id, school_id, status, deleted_at);
CREATE INDEX idx_students_tenant_school_branch_status
    ON students (tenant_id, school_id, branch_id, status, deleted_at);
CREATE INDEX idx_students_tenant_school_name
    ON students (tenant_id, school_id, legal_last_name, legal_first_name);

CREATE INDEX idx_guardians_tenant_status
    ON guardians (tenant_id, status, deleted_at);
CREATE INDEX idx_guardians_tenant_name
    ON guardians (tenant_id, legal_last_name, legal_first_name);
CREATE INDEX idx_guardians_tenant_school_status
    ON guardians (tenant_id, school_id, status, deleted_at);

CREATE UNIQUE INDEX uq_student_guardians_active_pair
    ON student_guardians (tenant_id, student_id, guardian_id)
    WHERE status = 'active' AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_student_guardians_active_primary
    ON student_guardians (tenant_id, student_id)
    WHERE is_primary = true AND status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_student_guardians_student_history
    ON student_guardians (tenant_id, student_id, effective_from DESC);
CREATE INDEX idx_student_guardians_guardian_status
    ON student_guardians (tenant_id, guardian_id, status, deleted_at);
