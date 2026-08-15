-- Enterprise Student Platform - Guardian Platform
-- Mission: EWP-002
-- Scope: Guardian verification records and contact preferences only.
-- Package 001 tables are intentionally unchanged.
-- Intentionally excludes RLS, RPC, triggers, functions, views, and seed data.

CREATE TABLE guardian_verifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    guardian_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    verification_type text NOT NULL,
    verification_status text NOT NULL DEFAULT 'pending',
    verification_source text NOT NULL DEFAULT 'manual',
    evidence_hash text,
    external_reference_hash text,
    failure_reason text,
    requested_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    verified_at timestamptz,
    expires_at timestamptz,
    reviewed_by uuid,
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
    CONSTRAINT pk_guardian_verifications PRIMARY KEY (id),
    CONSTRAINT fk_guardian_verifications_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_guardian_scope FOREIGN KEY (tenant_id, guardian_id)
        REFERENCES guardians (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_reviewed_by_scope FOREIGN KEY (tenant_id, reviewed_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_verifications_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_guardian_verifications_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_guardian_verifications_type CHECK (
        verification_type IN ('identity', 'phone', 'email', 'address', 'custody')
    ),
    CONSTRAINT ck_guardian_verifications_status CHECK (
        verification_status IN ('pending', 'submitted', 'verified', 'rejected', 'expired', 'revoked')
    ),
    CONSTRAINT ck_guardian_verifications_source CHECK (
        verification_source IN ('manual', 'provider', 'school', 'self_service')
    ),
    CONSTRAINT ck_guardian_verifications_evidence_hash CHECK (
        evidence_hash IS NULL OR length(btrim(evidence_hash)) >= 32
    ),
    CONSTRAINT ck_guardian_verifications_reference_hash CHECK (
        external_reference_hash IS NULL OR length(btrim(external_reference_hash)) >= 32
    ),
    CONSTRAINT ck_guardian_verifications_review_pair CHECK (
        (reviewed_at IS NULL AND reviewed_by IS NULL)
        OR (reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
    ),
    CONSTRAINT ck_guardian_verifications_dates CHECK (
        requested_at <= COALESCE(reviewed_at, requested_at)
        AND (verified_at IS NULL OR verified_at >= requested_at)
        AND (expires_at IS NULL OR expires_at > requested_at)
    ),
    CONSTRAINT ck_guardian_verifications_status_timestamps CHECK (
        verified_at IS NULL OR verification_status IN ('verified', 'revoked', 'expired')
    ),
    CONSTRAINT ck_guardian_verifications_lifecycle CHECK (
        status IN ('active', 'archived')
    ),
    CONSTRAINT ck_guardian_verifications_version CHECK (version >= 1),
    CONSTRAINT ck_guardian_verifications_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_guardian_verifications_deleted_status CHECK (
        deleted_at IS NULL OR status = 'archived'
    )
);

CREATE TABLE guardian_contact_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    guardian_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    contact_channel text NOT NULL,
    purpose text NOT NULL,
    consent_status text NOT NULL DEFAULT 'pending',
    consent_source text,
    consented_at timestamptz,
    revoked_at timestamptz,
    is_preferred boolean NOT NULL DEFAULT false,
    preferred_language text,
    quiet_hours_start time,
    quiet_hours_end time,
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
    CONSTRAINT pk_guardian_contact_preferences PRIMARY KEY (id),
    CONSTRAINT fk_guardian_contact_preferences_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_contact_preferences_guardian_scope FOREIGN KEY (tenant_id, guardian_id)
        REFERENCES guardians (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_contact_preferences_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_contact_preferences_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_contact_preferences_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_contact_preferences_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_contact_preferences_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_guardian_contact_preferences_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_guardian_contact_preferences_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_guardian_contact_preferences_channel CHECK (
        contact_channel IN ('email', 'sms', 'phone', 'post', 'in_app')
    ),
    CONSTRAINT ck_guardian_contact_preferences_purpose CHECK (
        purpose IN ('general', 'admission', 'attendance', 'academic', 'emergency', 'billing')
    ),
    CONSTRAINT ck_guardian_contact_preferences_consent CHECK (
        consent_status IN ('pending', 'granted', 'revoked', 'not_required')
    ),
    CONSTRAINT ck_guardian_contact_preferences_consent_dates CHECK (
        (consent_status <> 'revoked' OR revoked_at IS NOT NULL)
        AND (revoked_at IS NULL OR consented_at IS NULL OR revoked_at >= consented_at)
    ),
    CONSTRAINT ck_guardian_contact_preferences_quiet_hours CHECK (
        (quiet_hours_start IS NULL AND quiet_hours_end IS NULL)
        OR (quiet_hours_start IS NOT NULL AND quiet_hours_end IS NOT NULL)
    ),
    CONSTRAINT ck_guardian_contact_preferences_dates CHECK (
        effective_to IS NULL OR effective_from <= effective_to
    ),
    CONSTRAINT ck_guardian_contact_preferences_lifecycle CHECK (
        status IN ('active', 'archived')
    ),
    CONSTRAINT ck_guardian_contact_preferences_version CHECK (version >= 1),
    CONSTRAINT ck_guardian_contact_preferences_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_guardian_contact_preferences_deleted_status CHECK (
        deleted_at IS NULL OR status = 'archived'
    )
);

CREATE UNIQUE INDEX uq_guardian_verifications_active_type
    ON guardian_verifications (tenant_id, guardian_id, verification_type)
    WHERE status = 'active'
      AND deleted_at IS NULL
      AND verification_status IN ('pending', 'submitted', 'verified');
CREATE INDEX idx_guardian_verifications_guardian_status
    ON guardian_verifications (tenant_id, guardian_id, verification_status, requested_at DESC);
CREATE INDEX idx_guardian_verifications_expiry
    ON guardian_verifications (tenant_id, verification_status, expires_at)
    WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_guardian_verifications_school_status
    ON guardian_verifications (tenant_id, school_id, verification_status, requested_at DESC);

CREATE UNIQUE INDEX uq_guardian_contact_preferences_active_scope
    ON guardian_contact_preferences (tenant_id, guardian_id, contact_channel, purpose)
    WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_guardian_contact_preferences_guardian
    ON guardian_contact_preferences (tenant_id, guardian_id, status, deleted_at);
CREATE INDEX idx_guardian_contact_preferences_scope
    ON guardian_contact_preferences (tenant_id, school_id, branch_id, status, deleted_at);
