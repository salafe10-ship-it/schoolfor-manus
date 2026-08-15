-- Enterprise Student Platform - Student Documents & Attachments Platform
-- Mission: EWP-005
-- Scope: student_documents, student_document_versions,
--        student_document_categories, student_document_access_log only.
-- Previous packages are intentionally unchanged.
-- Intentionally excludes storage integration, RLS, RPC, triggers, views,
-- policies, seed data, binary content, OCR, and external providers.

CREATE TABLE student_document_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    category_code text NOT NULL,
    display_name text NOT NULL,
    description text,
    sort_order integer NOT NULL DEFAULT 0,
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
    CONSTRAINT pk_student_document_categories PRIMARY KEY (id),
    CONSTRAINT fk_student_document_categories_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_categories_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_categories_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_categories_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_categories_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_student_document_categories_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_student_document_categories_code UNIQUE (tenant_id, category_code),
    CONSTRAINT ck_student_document_categories_code CHECK (
        category_code = btrim(category_code)
        AND length(btrim(category_code)) > 0
        AND category_code ~ '^[A-Z0-9][A-Z0-9._/-]*$'
    ),
    CONSTRAINT ck_student_document_categories_name CHECK (length(btrim(display_name)) > 0),
    CONSTRAINT ck_student_document_categories_sort_order CHECK (sort_order >= 0),
    CONSTRAINT ck_student_document_categories_status CHECK (
        status IN ('active', 'inactive', 'archived')
    ),
    CONSTRAINT ck_student_document_categories_version CHECK (version >= 1),
    CONSTRAINT ck_student_document_categories_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_document_categories_deleted_status CHECK (
        deleted_at IS NULL OR status = 'archived'
    )
);

CREATE TABLE student_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    category_id uuid NOT NULL,
    document_reference text NOT NULL,
    title text NOT NULL,
    description text,
    lifecycle_status text NOT NULL DEFAULT 'draft',
    verification_status text NOT NULL DEFAULT 'not_required',
    classification text NOT NULL DEFAULT 'internal',
    current_version_number integer NOT NULL DEFAULT 1,
    retention_until date,
    legal_hold boolean NOT NULL DEFAULT false,
    archive_eligible_on date,
    verified_at timestamptz,
    verified_by uuid,
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
    CONSTRAINT pk_student_documents PRIMARY KEY (id),
    CONSTRAINT fk_student_documents_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_category_scope FOREIGN KEY (tenant_id, category_id)
        REFERENCES student_document_categories (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_verified_by_scope FOREIGN KEY (tenant_id, verified_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_documents_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_student_documents_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_student_documents_reference UNIQUE (tenant_id, document_reference),
    CONSTRAINT ck_student_documents_reference CHECK (
        document_reference = btrim(document_reference)
        AND length(btrim(document_reference)) > 0
    ),
    CONSTRAINT ck_student_documents_title CHECK (length(btrim(title)) > 0),
    CONSTRAINT ck_student_documents_lifecycle CHECK (
        lifecycle_status IN ('draft', 'pending_verification', 'verified', 'expired', 'archived')
    ),
    CONSTRAINT ck_student_documents_verification CHECK (
        verification_status IN ('not_required', 'pending', 'verified', 'rejected', 'expired')
    ),
    CONSTRAINT ck_student_documents_classification CHECK (
        classification IN ('public', 'internal', 'confidential', 'restricted', 'highly_confidential')
    ),
    CONSTRAINT ck_student_documents_current_version CHECK (current_version_number >= 1),
    CONSTRAINT ck_student_documents_retention CHECK (
        retention_until IS NULL OR archive_eligible_on IS NULL OR archive_eligible_on <= retention_until
    ),
    CONSTRAINT ck_student_documents_verification_pair CHECK (
        (verified_at IS NULL AND verified_by IS NULL)
        OR (verified_at IS NOT NULL AND verified_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_documents_verified_state CHECK (
        verification_status <> 'verified'
        OR (verified_at IS NOT NULL AND verified_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_documents_version CHECK (version >= 1),
    CONSTRAINT ck_student_documents_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    ),
    CONSTRAINT ck_student_documents_deleted_status CHECK (
        deleted_at IS NULL OR lifecycle_status = 'archived'
    )
);

CREATE TABLE student_document_versions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    document_id uuid NOT NULL,
    version_number integer NOT NULL,
    revision_reason text,
    original_file_name text NOT NULL,
    media_type text NOT NULL,
    byte_size bigint NOT NULL,
    content_hash text NOT NULL,
    is_current boolean NOT NULL DEFAULT true,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    uploaded_by uuid,
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
    CONSTRAINT pk_student_document_versions PRIMARY KEY (id),
    CONSTRAINT fk_student_document_versions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_document_scope FOREIGN KEY (tenant_id, document_id)
        REFERENCES student_documents (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_uploaded_by_scope FOREIGN KEY (tenant_id, uploaded_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_updated_by_scope FOREIGN KEY (tenant_id, updated_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_deleted_by_scope FOREIGN KEY (tenant_id, deleted_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_versions_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_student_document_versions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_student_document_versions_number UNIQUE (tenant_id, document_id, version_number),
    CONSTRAINT uq_student_document_versions_document_id UNIQUE (tenant_id, document_id, id),
    CONSTRAINT ck_student_document_versions_number CHECK (version_number >= 1),
    CONSTRAINT ck_student_document_versions_file_name CHECK (length(btrim(original_file_name)) > 0),
    CONSTRAINT ck_student_document_versions_media_type CHECK (
        media_type = btrim(media_type) AND length(btrim(media_type)) > 0
    ),
    CONSTRAINT ck_student_document_versions_byte_size CHECK (byte_size >= 0),
    CONSTRAINT ck_student_document_versions_hash CHECK (
        content_hash = btrim(content_hash) AND length(btrim(content_hash)) >= 32
    ),
    CONSTRAINT ck_student_document_versions_version CHECK (version >= 1),
    CONSTRAINT ck_student_document_versions_immutable_delete CHECK (
        deleted_at IS NULL AND deleted_by IS NULL
    )
);

CREATE TABLE student_document_access_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    student_id uuid NOT NULL,
    document_id uuid NOT NULL,
    document_version_id uuid,
    actor_user_id uuid,
    access_type text NOT NULL,
    access_result text NOT NULL DEFAULT 'allowed',
    reason_code text,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    request_id uuid,
    correlation_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    audit_id uuid,
    CONSTRAINT pk_student_document_access_log PRIMARY KEY (id),
    CONSTRAINT fk_student_document_access_log_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_student_scope FOREIGN KEY (tenant_id, student_id)
        REFERENCES students (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_document_scope FOREIGN KEY (tenant_id, document_id)
        REFERENCES student_documents (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_version_document_scope FOREIGN KEY (tenant_id, document_id, document_version_id)
        REFERENCES student_document_versions (tenant_id, document_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_actor_scope FOREIGN KEY (tenant_id, actor_user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_created_by_scope FOREIGN KEY (tenant_id, created_by)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_student_document_access_log_audit_scope FOREIGN KEY (tenant_id, audit_id)
        REFERENCES audit_events (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_student_document_access_log_type CHECK (
        access_type IN ('view', 'download', 'verify', 'share', 'archive', 'restore', 'export')
    ),
    CONSTRAINT ck_student_document_access_log_result CHECK (
        access_result IN ('allowed', 'denied', 'failed')
    ),
    CONSTRAINT ck_student_document_access_log_reason CHECK (
        access_result = 'allowed'
        OR (reason_code IS NOT NULL AND length(btrim(reason_code)) > 0)
    ),
    CONSTRAINT ck_student_document_access_log_created_by CHECK (
        created_by IS NOT NULL
    )
);

CREATE UNIQUE INDEX uq_student_document_versions_current
    ON student_document_versions (tenant_id, document_id)
    WHERE is_current = true AND deleted_at IS NULL;
CREATE INDEX idx_student_document_categories_lookup
    ON student_document_categories (tenant_id, status, sort_order, category_code)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_student_documents_student_lookup
    ON student_documents (tenant_id, school_id, branch_id, student_id, lifecycle_status)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_student_documents_category_lookup
    ON student_documents (tenant_id, category_id, lifecycle_status)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_student_documents_verification_queue
    ON student_documents (tenant_id, school_id, branch_id, verification_status, updated_at DESC)
    WHERE deleted_at IS NULL AND lifecycle_status <> 'archived';
CREATE INDEX idx_student_documents_expiration_reporting
    ON student_documents (tenant_id, school_id, branch_id, retention_until, archive_eligible_on)
    WHERE deleted_at IS NULL AND legal_hold = false;
CREATE INDEX idx_student_document_versions_history
    ON student_document_versions (tenant_id, document_id, version_number DESC);
CREATE INDEX idx_student_document_access_log_document
    ON student_document_access_log (tenant_id, document_id, occurred_at DESC);
CREATE INDEX idx_student_document_access_log_actor
    ON student_document_access_log (tenant_id, actor_user_id, occurred_at DESC);

REVOKE UPDATE, DELETE, TRUNCATE ON student_document_versions FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON student_document_versions FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON student_document_access_log FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON student_document_access_log FROM anon, authenticated;
