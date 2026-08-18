import { UnitOfWork } from '../database/UnitOfWork.js';
import type { TransactionSession } from '../database/transactions/TransactionContracts.js';
import type { AuthorizationIdentity, DatabaseRolePermission } from './RoleResolver.js';

function transaction(): TransactionSession {
  const active = UnitOfWork.getActiveContext();
  if (!active?.isActive || !active.databaseTransaction) throw new Error('Database role resolution requires an active PostgreSQL transaction.');
  return active.databaseTransaction;
}

/**
 * Loads effective role assignments from trusted application tables.
 * The caller supplies only the verified Supabase identity; tenant and scope
 * are derived from that identity and are installed as trusted transaction context.
 */
export function createDatabaseRolePermissionLoader() {
  return async (identity: AuthorizationIdentity): Promise<DatabaseRolePermission[] | null> => {
    if (!UnitOfWork.hasTransactionDriver()) {
      return null;
    }
    const tenantId = String(identity.tenantId || '').trim();
    const schoolId = String(identity.schoolId || '').trim();
    const userId = String(identity.id || '').trim();
    if (!tenantId || !schoolId || !userId) throw new Error('Trusted identity is incomplete for role resolution.');
    return UnitOfWork.runInTransaction(
      schoolId,
      {
        operationName: 'Trusted database role resolution',
        userId,
        userName: identity.name || identity.email || userId,
        ipAddress: 'internal',
        affectedTables: ['users', 'user_roles', 'roles', 'role_permissions', 'permissions'],
        tenantId
      },
      async () => {
        const result = await transaction().query<DatabaseRolePermission>(
          `SELECT r.role_key AS "roleKey", p.permission_key AS "permissionKey"
             FROM users u
             JOIN user_roles ur
               ON ur.tenant_id = u.tenant_id
              AND ur.user_id = u.id
             JOIN roles r
               ON r.tenant_id = ur.tenant_id
              AND r.id = ur.role_id
             JOIN role_permissions rp
               ON rp.tenant_id = ur.tenant_id
              AND rp.role_id = r.id
             JOIN permissions p
               ON p.id = rp.permission_id
            WHERE u.tenant_id = $1::uuid
              AND u.auth_user_id = $2::uuid
              AND u.deleted_at IS NULL
              AND u.status IN ('invited', 'active')
              AND ur.deleted_at IS NULL
              AND ur.status = 'active'
              AND ur.starts_at <= now()
              AND (ur.ends_at IS NULL OR ur.ends_at > now())
              AND (ur.school_id IS NULL OR ur.school_id = $3::uuid)
              AND (ur.branch_id IS NULL OR ur.branch_id = $4::uuid)
              AND r.deleted_at IS NULL
              AND r.status = 'active'
              AND rp.deleted_at IS NULL
              AND rp.status = 'active'
              AND p.deleted_at IS NULL
              AND p.status = 'active'
              AND (p.tenant_id IS NULL OR p.tenant_id = $1::uuid)
            ORDER BY r.role_key, p.permission_key`,
          [tenantId, userId, schoolId, identity.branchId || null]
        );
        return result.rows;
      },
      {
        tenantId,
        schoolId,
        branchId: identity.branchId || '',
        academicYear: identity.academicYear || '',
        userId,
        role: identity.role || ''
      }
    );
  };
}
