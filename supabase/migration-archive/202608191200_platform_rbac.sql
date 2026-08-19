-- Gate 1.8R: platform-scoped RBAC schema only.
-- This file is design/deployment input. It is not executed by the application.
-- Platform tables intentionally have no tenant_id, school_id, or branch_id.

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    auth_user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_platform_users PRIMARY KEY (id),
    CONSTRAINT fk_platform_users_auth_user FOREIGN KEY (auth_user_id)
        REFERENCES auth.users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_platform_users_auth_user UNIQUE (auth_user_id),
    CONSTRAINT ck_platform_users_status CHECK (status IN ('invited', 'active', 'suspended', 'disabled', 'archived')),
    CONSTRAINT ck_platform_users_version CHECK (version >= 1),
    CONSTRAINT ck_platform_users_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.platform_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    role_key text NOT NULL,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_platform_roles PRIMARY KEY (id),
    CONSTRAINT uq_platform_roles_key UNIQUE (role_key),
    CONSTRAINT ck_platform_roles_key CHECK (role_key ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
    CONSTRAINT ck_platform_roles_name CHECK (length(btrim(name)) > 0),
    CONSTRAINT ck_platform_roles_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_platform_roles_version CHECK (version >= 1),
    CONSTRAINT ck_platform_roles_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.platform_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    permission_key text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_platform_permissions PRIMARY KEY (id),
    CONSTRAINT uq_platform_permissions_key UNIQUE (permission_key),
    CONSTRAINT ck_platform_permissions_key CHECK (permission_key ~ '^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$'),
    CONSTRAINT ck_platform_permissions_resource CHECK (length(btrim(resource)) > 0),
    CONSTRAINT ck_platform_permissions_action CHECK (length(btrim(action)) > 0),
    CONSTRAINT ck_platform_permissions_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_platform_permissions_version CHECK (version >= 1),
    CONSTRAINT ck_platform_permissions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.platform_role_permissions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_platform_role_permissions PRIMARY KEY (id),
    CONSTRAINT fk_platform_role_permissions_role FOREIGN KEY (role_id)
        REFERENCES public.platform_roles (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_platform_role_permissions_permission FOREIGN KEY (permission_id)
        REFERENCES public.platform_permissions (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_platform_role_permissions_role_permission UNIQUE (role_id, permission_id),
    CONSTRAINT ck_platform_role_permissions_status CHECK (status IN ('active', 'disabled', 'archived')),
    CONSTRAINT ck_platform_role_permissions_version CHECK (version >= 1),
    CONSTRAINT ck_platform_role_permissions_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.platform_user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    platform_user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    starts_at timestamptz NOT NULL DEFAULT now(),
    ends_at timestamptz,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    audit_id uuid,
    request_id uuid,
    correlation_id uuid,
    CONSTRAINT pk_platform_user_roles PRIMARY KEY (id),
    CONSTRAINT fk_platform_user_roles_user FOREIGN KEY (platform_user_id)
        REFERENCES public.platform_users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_platform_user_roles_role FOREIGN KEY (role_id)
        REFERENCES public.platform_roles (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT ck_platform_user_roles_dates CHECK (starts_at < COALESCE(ends_at, 'infinity'::timestamptz)),
    CONSTRAINT ck_platform_user_roles_status CHECK (status IN ('active', 'suspended', 'expired', 'revoked', 'archived')),
    CONSTRAINT ck_platform_user_roles_version CHECK (version >= 1),
    CONSTRAINT ck_platform_user_roles_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_user_roles_active_assignment
    ON public.platform_user_roles (platform_user_id, role_id)
    WHERE status = 'active' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_platform_users_auth_status
    ON public.platform_users (auth_user_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_roles_status
    ON public.platform_roles (status, role_key);
CREATE INDEX IF NOT EXISTS idx_platform_permissions_lookup
    ON public.platform_permissions (permission_key, status);
CREATE INDEX IF NOT EXISTS idx_platform_role_permissions_role_status
    ON public.platform_role_permissions (role_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_user_roles_active
    ON public.platform_user_roles (platform_user_id, status, starts_at, ends_at);

COMMENT ON TABLE public.platform_users IS 'Platform-scoped identities; intentionally independent from tenant users.';
COMMENT ON TABLE public.platform_roles IS 'Platform-scoped canonical roles such as platformadmin.';
COMMENT ON TABLE public.platform_permissions IS 'Platform-scoped explicit permissions such as Platform.Admin; wildcard is forbidden.';
COMMENT ON TABLE public.platform_user_roles IS 'Platform role assignments with time/status and idempotent active uniqueness.';

COMMIT;

-- Rollback design (manual review only; never run automatically):
-- DROP TABLE public.platform_user_roles;
-- DROP TABLE public.platform_role_permissions;
-- DROP TABLE public.platform_permissions;
-- DROP TABLE public.platform_roles;
-- DROP TABLE public.platform_users;
