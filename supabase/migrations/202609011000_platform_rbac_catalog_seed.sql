-- Production bootstrap: seed the one explicit platform-level role and its
-- one explicit permission. No tenant role, wildcard, or user assignment is
-- created here; the first administrator is still provisioned separately by
-- the controlled deployment workflow.

BEGIN;

INSERT INTO public.platform_roles (role_key, name, status, is_system, deleted_at)
VALUES ('platformadmin', 'Platform Administrator', 'active', true, NULL)
ON CONFLICT (role_key) DO UPDATE
  SET name = EXCLUDED.name,
      status = 'active',
      is_system = true,
      deleted_at = NULL,
      updated_at = now();

INSERT INTO public.platform_permissions (permission_key, resource, action, status, deleted_at)
VALUES ('Platform.Admin', 'Platform', 'Admin', 'active', NULL)
ON CONFLICT (permission_key) DO UPDATE
  SET resource = EXCLUDED.resource,
      action = EXCLUDED.action,
      status = 'active',
      deleted_at = NULL,
      updated_at = now();

INSERT INTO public.platform_role_permissions (role_id, permission_id, status, deleted_at)
SELECT role.id, permission.id, 'active', NULL
  FROM public.platform_roles role
  JOIN public.platform_permissions permission ON permission.permission_key = 'Platform.Admin'
 WHERE role.role_key = 'platformadmin'
ON CONFLICT (role_id, permission_id) DO UPDATE
  SET status = 'active',
      deleted_at = NULL,
      updated_at = now();

COMMIT;
