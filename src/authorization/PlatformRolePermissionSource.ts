import { UnitOfWork } from '../database/UnitOfWork.js';
import type { TransactionSession } from '../database/transactions/TransactionContracts.js';
import type { AuthorizationIdentity, DatabaseRolePermission } from './RoleResolver.js';

function transaction(): TransactionSession {
  const active = UnitOfWork.getActiveContext();
  if (!active?.isActive || !active.databaseTransaction) {
    throw new Error('Platform role resolution requires an active PostgreSQL transaction.');
  }
  return active.databaseTransaction;
}

/**
 * Loads platform permissions only. It never reads tenant roles and never accepts
 * tenant/school/branch scope from a request payload.
 */
export function createPlatformRolePermissionLoader() {
  return async (identity: AuthorizationIdentity): Promise<DatabaseRolePermission[] | null> => {
    if (!UnitOfWork.hasTransactionDriver()) return null;
    const authUserId = String(identity.id || '').trim();
    if (!authUserId) throw new Error('Trusted auth_user_id is required for platform role resolution.');

    return UnitOfWork.runPlatformInTransaction(
      {
        scope: 'platform',
        operationName: 'Trusted platform role resolution',
        userId: authUserId,
        userName: identity.name || identity.email || authUserId,
        ipAddress: 'internal',
        affectedTables: [
          'platform_users',
          'platform_user_roles',
          'platform_roles',
          'platform_role_permissions',
          'platform_permissions'
        ]
      },
      async () => {
        const result = await transaction().query<DatabaseRolePermission>(
          `SELECT pr.role_key AS "roleKey", pp.permission_key AS "permissionKey"
             FROM public.platform_users pu
             JOIN public.platform_user_roles pur
               ON pur.platform_user_id = pu.id
             JOIN public.platform_roles pr
               ON pr.id = pur.role_id
             JOIN public.platform_role_permissions prp
               ON prp.role_id = pr.id
             JOIN public.platform_permissions pp
               ON pp.id = prp.permission_id
            WHERE pu.auth_user_id = $1::uuid
              AND pu.status = 'active'
              AND pu.deleted_at IS NULL
              AND pur.status = 'active'
              AND pur.deleted_at IS NULL
              AND pur.starts_at <= now()
              AND (pur.ends_at IS NULL OR pur.ends_at > now())
              AND pr.status = 'active'
              AND pr.deleted_at IS NULL
              AND prp.status = 'active'
              AND prp.deleted_at IS NULL
              AND pp.status = 'active'
              AND pp.deleted_at IS NULL
            ORDER BY pr.role_key, pp.permission_key`,
          [authUserId]
        );
        return result.rows;
      }
    );
  };
}
