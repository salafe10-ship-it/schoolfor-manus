-- School-scoped direct permission grants.
-- Roles remain the central baseline; this table lets a school manager grant
-- a narrow, auditable exception to one user without changing a shared role.
CREATE TABLE IF NOT EXISTS public.user_permission_grants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    school_id uuid NOT NULL,
    branch_id uuid,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    version integer NOT NULL DEFAULT 1,
    CONSTRAINT pk_user_permission_grants PRIMARY KEY (id),
    CONSTRAINT fk_user_permission_grants_user_scope FOREIGN KEY (tenant_id, user_id)
        REFERENCES public.users (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_user_permission_grants_permission FOREIGN KEY (permission_id)
        REFERENCES public.permissions (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_user_permission_grants_school_scope FOREIGN KEY (tenant_id, school_id)
        REFERENCES public.schools (tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_user_permission_grants_branch_scope FOREIGN KEY (tenant_id, school_id, branch_id)
        REFERENCES public.branches (tenant_id, school_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT uq_user_permission_grants_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_user_permission_grants_user_permission UNIQUE (user_id, permission_id),
    CONSTRAINT ck_user_permission_grants_branch_requires_school CHECK (branch_id IS NULL OR school_id IS NOT NULL),
    CONSTRAINT ck_user_permission_grants_status CHECK (status IN ('active', 'revoked', 'archived')),
    CONSTRAINT ck_user_permission_grants_version CHECK (version >= 1),
    CONSTRAINT ck_user_permission_grants_soft_delete_pair CHECK (
        (deleted_at IS NULL AND deleted_by IS NULL)
        OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_user_permission_grants_scope
    ON public.user_permission_grants (tenant_id, school_id, branch_id, status);
CREATE INDEX IF NOT EXISTS idx_user_permission_grants_user
    ON public.user_permission_grants (tenant_id, user_id, status);

ALTER TABLE public.user_permission_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_permission_grants FROM anon;
GRANT SELECT ON TABLE public.user_permission_grants TO authenticated;

COMMENT ON TABLE public.user_permission_grants IS
  'Auditable school-scoped direct permission grants layered on top of central roles.';
