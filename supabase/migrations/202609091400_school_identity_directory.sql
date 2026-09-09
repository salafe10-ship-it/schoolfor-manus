-- Tenant-scoped school identity directory.
-- The platform catalog remains the source of truth; this migration only adds
-- the four explicit capabilities needed by a school manager to administer
-- users inside the manager's own school.

BEGIN;

INSERT INTO public.permissions
  (permission_key, resource, action, description, status, deleted_at, deleted_by)
VALUES
  ('Identity.Users.Read', 'Identity.Users', 'Read', 'View users in the current school scope.', 'active', NULL, NULL),
  ('Identity.Users.Write', 'Identity.Users', 'Write', 'Create and update users in the current school scope.', 'active', NULL, NULL),
  ('Identity.Users.Assign', 'Identity.Users', 'Assign', 'Assign only canonical school roles in the current school scope.', 'active', NULL, NULL),
  ('Identity.Users.Audit', 'Identity.Users', 'Audit', 'View identity-management audit evidence in the current school scope.', 'active', NULL, NULL)
ON CONFLICT (permission_key) DO UPDATE
  SET resource = EXCLUDED.resource,
      action = EXCLUDED.action,
      description = EXCLUDED.description,
      status = 'active',
      deleted_at = NULL,
      deleted_by = NULL,
      updated_at = now();

INSERT INTO public.role_permissions
  (tenant_id, role_id, permission_id, status, deleted_at, deleted_by)
SELECT r.tenant_id, r.id, p.id, 'active', NULL, NULL
  FROM public.roles r
  CROSS JOIN public.permissions p
 WHERE r.role_key = 'schooladmin'
   AND r.school_id IS NULL
   AND r.branch_id IS NULL
   AND r.status = 'active'
   AND r.deleted_at IS NULL
   AND p.permission_key IN ('Identity.Users.Read', 'Identity.Users.Write', 'Identity.Users.Assign', 'Identity.Users.Audit')
ON CONFLICT (role_id, permission_id) DO UPDATE
  SET status = 'active', deleted_at = NULL, deleted_by = NULL, updated_at = now();

COMMIT;
