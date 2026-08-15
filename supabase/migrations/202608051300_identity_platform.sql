-- Enterprise Identity Platform Schema
-- Mission: EIF-02B-P2
-- Identity remains anchored to Supabase Auth. This migration stores only trusted
-- references and one-way hashes; it intentionally excludes RLS, RPC, triggers,
-- seed data, login logic, and JWT logic.

CREATE TABLE users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    auth_user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    display_name text NOT NULL,
    status text NOT NULL DEFAULT 'invited',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT fk_users_auth_user FOREIGN KEY (auth_user_id)
        REFERENCES auth.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_users_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_users_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_users_auth_user UNIQUE (auth_user_id),
    CONSTRAINT uq_users_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_users_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_users_display_name CHECK (length(btrim(display_name)) > 0),
    CONSTRAINT ck_users_status CHECK (status IN ('invited', 'active', 'suspended', 'disabled', 'archived')),
    CONSTRAINT ck_users_version CHECK (version >= 1),
    CONSTRAINT ck_users_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    role_key text NOT NULL,
    name text NOT NULL,
    description text,
    is_system boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_roles_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_roles_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_roles_tenant_key UNIQUE (tenant_id, role_key),
    CONSTRAINT uq_roles_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_roles_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_roles_key CHECK (role_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_roles_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_roles_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_roles_version CHECK (version >= 1),
    CONSTRAINT ck_roles_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid,
    permission_key text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_permissions PRIMARY KEY (id),
    CONSTRAINT fk_permissions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_permissions_key UNIQUE (permission_key),
    CONSTRAINT uq_permissions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_permissions_key CHECK (permission_key ~ '^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$'),
    CONSTRAINT ck_permissions_resource CHECK (length(btrim(resource)) > 0),
    CONSTRAINT ck_permissions_action CHECK (length(btrim(action)) > 0),
    CONSTRAINT ck_permissions_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_permissions_version CHECK (version >= 1),
    CONSTRAINT ck_permissions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE role_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_role_permissions PRIMARY KEY (id),
    CONSTRAINT fk_role_permissions_role_scope FOREIGN KEY (tenant_id, role_id)
        REFERENCES roles (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id)
        REFERENCES permissions (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id),
    CONSTRAINT uq_role_permissions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_role_permissions_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_role_permissions_version CHECK (version >= 1),
    CONSTRAINT ck_role_permissions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    starts_at timestamptz NOT NULL DEFAULT now(),
    ends_at timestamptz,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_user_roles PRIMARY KEY (id),
    CONSTRAINT fk_user_roles_user_scope FOREIGN KEY (tenant_id, user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_role_scope FOREIGN KEY (tenant_id, role_id)
        REFERENCES roles (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_user_roles_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_user_roles_assignment UNIQUE (user_id, role_id, school_id, branch_id, starts_at),
    CONSTRAINT uq_user_roles_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_user_roles_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_user_roles_dates CHECK (ends_at IS NULL OR starts_at < ends_at),
    CONSTRAINT ck_user_roles_status CHECK (status IN ('active', 'suspended', 'expired', 'revoked', 'archived')),
    CONSTRAINT ck_user_roles_version CHECK (version >= 1),
    CONSTRAINT ck_user_roles_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    auth_session_id uuid NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    client_platform text,
    ip_address inet,
    user_agent text,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_sessions PRIMARY KEY (id),
    CONSTRAINT fk_sessions_user_scope FOREIGN KEY (tenant_id, user_id)
        REFERENCES users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_sessions_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_sessions_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_sessions_auth_session UNIQUE (auth_session_id),
    CONSTRAINT uq_sessions_tenant_id_user UNIQUE (tenant_id, id, user_id),
    CONSTRAINT uq_sessions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_sessions_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_sessions_dates CHECK (issued_at < expires_at),
    CONSTRAINT ck_sessions_status CHECK (status IN ('active', 'expired', 'revoked', 'archived')),
    CONSTRAINT ck_sessions_version CHECK (version >= 1),
    CONSTRAINT ck_sessions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE trusted_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    session_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    session_token_hash text NOT NULL,
    issued_at timestamptz NOT NULL DEFAULT now(),
    last_validated_at timestamptz,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_trusted_sessions PRIMARY KEY (id),
    CONSTRAINT fk_trusted_sessions_session_identity FOREIGN KEY (tenant_id, session_id, user_id)
        REFERENCES sessions (tenant_id, id, user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_trusted_sessions_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_trusted_sessions_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_trusted_sessions_session UNIQUE (session_id),
    CONSTRAINT uq_trusted_sessions_token_hash UNIQUE (session_token_hash),
    CONSTRAINT uq_trusted_sessions_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_trusted_sessions_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_trusted_sessions_token_hash CHECK (length(btrim(session_token_hash)) >= 32),
    CONSTRAINT ck_trusted_sessions_dates CHECK (issued_at < expires_at),
    CONSTRAINT ck_trusted_sessions_status CHECK (status IN ('active', 'expired', 'revoked', 'archived')),
    CONSTRAINT ck_trusted_sessions_version CHECK (version >= 1),
    CONSTRAINT ck_trusted_sessions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE service_accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    account_key text NOT NULL,
    name text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'active',
    expires_at timestamptz,
    last_used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_service_accounts PRIMARY KEY (id),
    CONSTRAINT fk_service_accounts_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_service_accounts_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_service_accounts_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_service_accounts_tenant_key UNIQUE (tenant_id, account_key),
    CONSTRAINT uq_service_accounts_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_service_accounts_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_service_accounts_key CHECK (account_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_service_accounts_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_service_accounts_status CHECK (status IN ('active', 'suspended', 'expired', 'revoked', 'archived')),
    CONSTRAINT ck_service_accounts_version CHECK (version >= 1),
    CONSTRAINT ck_service_accounts_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    service_account_id uuid NOT NULL,
    school_id uuid,
    branch_id uuid,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
    issued_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    last_used_at timestamptz,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_api_keys PRIMARY KEY (id),
    CONSTRAINT fk_api_keys_service_account_scope FOREIGN KEY (tenant_id, service_account_id)
        REFERENCES service_accounts (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_api_keys_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_api_keys_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_api_keys_service_prefix UNIQUE (service_account_id, key_prefix),
    CONSTRAINT uq_api_keys_key_hash UNIQUE (key_hash),
    CONSTRAINT uq_api_keys_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT ck_api_keys_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_api_keys_prefix CHECK (length(btrim(key_prefix)) >= 4),
    CONSTRAINT ck_api_keys_hash CHECK (length(btrim(key_hash)) >= 32),
    CONSTRAINT ck_api_keys_dates CHECK (expires_at IS NULL OR issued_at < expires_at),
    CONSTRAINT ck_api_keys_scopes_array CHECK (jsonb_typeof(scopes) = 'array'),
    CONSTRAINT ck_api_keys_status CHECK (status IN ('active', 'expired', 'revoked', 'archived')),
    CONSTRAINT ck_api_keys_version CHECK (version >= 1),
    CONSTRAINT ck_api_keys_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE INDEX idx_users_tenant_status ON users (tenant_id, status);
CREATE INDEX idx_users_tenant_school_status ON users (tenant_id, school_id, status);
CREATE INDEX idx_users_auth_user_status ON users (auth_user_id, status);
CREATE INDEX idx_users_display_name ON users (tenant_id, display_name);

CREATE INDEX idx_roles_tenant_status ON roles (tenant_id, status);
CREATE INDEX idx_roles_tenant_school_status ON roles (tenant_id, school_id, status);
CREATE INDEX idx_roles_tenant_name ON roles (tenant_id, name);

CREATE INDEX idx_permissions_resource_action ON permissions (resource, action);
CREATE INDEX idx_permissions_tenant_status ON permissions (tenant_id, status);

CREATE INDEX idx_role_permissions_tenant_role ON role_permissions (tenant_id, role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions (permission_id);

CREATE INDEX idx_user_roles_tenant_user_status ON user_roles (tenant_id, user_id, status);
CREATE INDEX idx_user_roles_tenant_role_status ON user_roles (tenant_id, role_id, status);
CREATE INDEX idx_user_roles_scope ON user_roles (tenant_id, school_id, branch_id, status);

CREATE INDEX idx_sessions_tenant_user_status ON sessions (tenant_id, user_id, status);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX idx_sessions_last_seen_at ON sessions (tenant_id, last_seen_at);

CREATE INDEX idx_trusted_sessions_tenant_user_status ON trusted_sessions (tenant_id, user_id, status);
CREATE INDEX idx_trusted_sessions_expires_at ON trusted_sessions (expires_at);
CREATE INDEX idx_trusted_sessions_last_validated_at ON trusted_sessions (tenant_id, last_validated_at);

CREATE INDEX idx_service_accounts_tenant_status ON service_accounts (tenant_id, status);
CREATE INDEX idx_service_accounts_expires_at ON service_accounts (tenant_id, expires_at);

CREATE INDEX idx_api_keys_tenant_status ON api_keys (tenant_id, status);
CREATE INDEX idx_api_keys_service_account_status ON api_keys (service_account_id, status);
CREATE INDEX idx_api_keys_expires_at ON api_keys (tenant_id, expires_at);
