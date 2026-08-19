-- GATE 1.9R: prevent concurrent duplicate active platform assignments.
-- Historical/revoked/expired rows remain allowed; only one live row exists
-- for a platform user and role.
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_user_roles_active_assignment
    ON public.platform_user_roles (platform_user_id, role_id)
    WHERE status = 'active' AND deleted_at IS NULL;

-- Rollback: DROP INDEX uq_platform_user_roles_active_assignment;
-- This migration is not executed by this change.
