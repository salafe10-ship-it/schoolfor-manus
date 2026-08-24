import { permissionRegistry, PERMISSIONS } from '../../../authorization/PermissionRegistry.js';
import { UnitOfWork } from '../../../database/UnitOfWork.js';
import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';

export const CANONICAL_ROLE_KEY = 'schooladmin';
export const CANONICAL_ROLE_NAME = 'SchoolAdmin';

export type TrustedProvisioningContext = {
  authUserId: string;
  tenantId: string;
  schoolId: string;
  branchId?: string;
  displayName: string;
  actorUserId?: string;
};

export type TrustedCatalogContext = {
  tenantId: string;
  schoolId: string;
  actorUserId?: string;
};

export type ProvisioningResult = {
  userId: string;
  roleId: string;
  roleAssignmentId: string;
  permissionCount: number;
};

export type TrustedPlatformProvisioningContext = {
  authUserId: string;
  actorUserId?: string;
};

export type PlatformProvisioningResult = {
  platformUserId: string;
  roleId: string;
  permissionId: string;
  roleAssignmentId: string;
};

function db(): TransactionSession {
  const context = UnitOfWork.getActiveContext();
  if (!context?.isActive || !context.databaseTransaction) {
    throw new Error('ERP provisioning requires an active PostgreSQL transaction.');
  }
  return context.databaseTransaction;
}

function required(value: string, field: string): string {
  const result = value.trim();
  if (!result) throw new Error(`${field} is required for ERP provisioning.`);
  return result;
}

function canonicalCatalog() {
  // The registry is the single source of truth for the complete explicit
  // catalog. This includes the legacy aliases that are still used by older
  // screens, normalized to Resource.Action codes. Platform.Admin is kept in
  // the separate platform catalog and must never be granted to a tenant role.
  return permissionRegistry.list()
    .map(value => permissionRegistry.normalize(value))
    .filter((value): value is string => Boolean(value) && value !== '*' && value !== PERMISSIONS.PLATFORM_ADMIN)
    .filter((value, index, values) => values.indexOf(value) === index)
    .map(permission => {
      const separator = permission.lastIndexOf('.');
      if (separator <= 0 || separator === permission.length - 1) {
        throw new Error(`Invalid canonical permission: ${permission}`);
      }
      return {
        key: permission,
        resource: permission.slice(0, separator),
        action: permission.slice(separator + 1)
      };
    });
}

async function ensureRole(context: TrustedCatalogContext): Promise<string> {
  const transaction = db();
  await transaction.query<{ id: string }>(
    `INSERT INTO public.roles
      (tenant_id, role_key, name, is_system, status, created_by, updated_by)
     VALUES ($1::uuid, $2, $3, true, 'active', $4::uuid, $4::uuid)
     ON CONFLICT (tenant_id, role_key) DO NOTHING
     RETURNING id`,
    [context.tenantId, CANONICAL_ROLE_KEY, CANONICAL_ROLE_NAME, context.actorUserId || null]
  );
  const role = (await transaction.query<{ id: string; school_id: string | null; branch_id: string | null; status: string; deleted_at: string | null }>(
    `SELECT id, school_id, branch_id, status, deleted_at
       FROM public.roles
      WHERE tenant_id = $1::uuid AND role_key = $2
      FOR UPDATE`,
    [context.tenantId, CANONICAL_ROLE_KEY]
  )).rows[0];
  if (!role || role.school_id !== null || role.branch_id !== null || role.status !== 'active' || role.deleted_at !== null) {
    throw new Error('Canonical schooladmin role is missing, scoped incorrectly, or inactive.');
  }
  return role.id;
}

async function ensurePermissions(context: TrustedCatalogContext, roleId: string): Promise<number> {
  const transaction = db();
  const catalog = canonicalCatalog();
  for (const permission of catalog) {
    const inserted = await transaction.query<{ id: string; status: string; deleted_at: string | null }>(
      `INSERT INTO public.permissions
        (tenant_id, permission_key, resource, action, status, created_by, updated_by)
       VALUES (NULL, $1, $2, $3, 'active', $4::uuid, $4::uuid)
       ON CONFLICT (permission_key) DO NOTHING
       RETURNING id, status, deleted_at`,
      [permission.key, permission.resource, permission.action, context.actorUserId || null]
    );
    const permissionRow = inserted.rows[0] || (await transaction.query<{ id: string; status: string; deleted_at: string | null }>(
      `SELECT id, status, deleted_at FROM public.permissions WHERE permission_key = $1 FOR UPDATE`,
      [permission.key]
    )).rows[0];
    if (!permissionRow || permissionRow.status !== 'active' || permissionRow.deleted_at !== null) {
      throw new Error(`Canonical permission is missing or inactive: ${permission.key}`);
    }
    await transaction.query(
      `INSERT INTO public.role_permissions
        (tenant_id, role_id, permission_id, status, created_by, updated_by)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 'active', $4::uuid, $4::uuid)
       ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [context.tenantId, roleId, permissionRow.id, context.actorUserId || null]
    );
  }
  return catalog.length;
}

export class ErpProvisioningService {
  /**
   * Provisions only the platform identity graph. This is an explicit service
   * primitive for a later controlled activation workflow; it is never called
   * by login and accepts no tenant or client authorization inputs.
   */
  public static async provisionPlatformIdentity(context: TrustedPlatformProvisioningContext): Promise<PlatformProvisioningResult> {
    const authUserId = required(context.authUserId, 'authUserId');
    const actorUserId = context.actorUserId?.trim() || null;

    return UnitOfWork.runPlatformInTransaction({
      scope: 'platform',
      operationName: 'Platform identity provisioning',
      userId: actorUserId || authUserId,
      userName: 'Platform identity provisioning',
      ipAddress: 'internal',
      affectedTables: ['platform_users', 'platform_roles', 'platform_permissions', 'platform_role_permissions', 'platform_user_roles']
    }, async () => {
      const transaction = db();
      const role = (await transaction.query<{ id: string; status: string; deleted_at: string | null }>(
        `SELECT id, status, deleted_at FROM public.platform_roles
          WHERE role_key = $1 FOR UPDATE`, ['platformadmin']
      )).rows[0];
      if (!role || role.status !== 'active' || role.deleted_at !== null) {
        throw new Error('Canonical platformadmin role is missing or inactive.');
      }

      const permission = (await transaction.query<{ id: string; status: string; deleted_at: string | null }>(
        `SELECT id, status, deleted_at FROM public.platform_permissions
          WHERE permission_key = $1 FOR UPDATE`, [PERMISSIONS.PLATFORM_ADMIN]
      )).rows[0];
      if (!permission || permission.status !== 'active' || permission.deleted_at !== null) {
        throw new Error('Canonical Platform.Admin permission is missing or inactive.');
      }

      const link = (await transaction.query<{ role_id: string; permission_id: string }>(
        `SELECT role_id, permission_id FROM public.platform_role_permissions
          WHERE role_id = $1::uuid AND permission_id = $2::uuid
            AND status = 'active' AND deleted_at IS NULL FOR UPDATE`, [role.id, permission.id]
      )).rows[0];
      if (!link) throw new Error('Canonical platformadmin permission link is missing or inactive.');

      const existingUser = (await transaction.query<{ id: string; status: string; deleted_at: string | null }>(
        `SELECT id, status, deleted_at FROM public.platform_users
          WHERE auth_user_id = $1::uuid FOR UPDATE`, [authUserId]
      )).rows[0];
      let platformUserId = existingUser?.id;
      if (existingUser && (existingUser.status !== 'active' || existingUser.deleted_at !== null)) {
        throw new Error('Existing platform identity is inactive or deleted.');
      }
      if (!platformUserId) {
        const created = await transaction.query<{ id: string }>(
          `INSERT INTO public.platform_users (auth_user_id, status)
           VALUES ($1::uuid, 'active')
           ON CONFLICT (auth_user_id) DO NOTHING RETURNING id`, [authUserId]
        );
        platformUserId = created.rows[0]?.id;
        if (!platformUserId) {
          platformUserId = (await transaction.query<{ id: string }>(
            `SELECT id FROM public.platform_users WHERE auth_user_id = $1::uuid FOR UPDATE`, [authUserId]
          )).rows[0]?.id;
        }
      }
      if (!platformUserId) throw new Error('Platform identity could not be verified.');

      const assignment = await transaction.query<{ id: string }>(
        `INSERT INTO public.platform_user_roles (platform_user_id, role_id, status, starts_at, ends_at, deleted_at)
         VALUES ($1::uuid, $2::uuid, 'active', now(), NULL, NULL)
         ON CONFLICT (platform_user_id, role_id)
           WHERE status = 'active' AND deleted_at IS NULL
         DO UPDATE SET status = 'active', starts_at = now(), ends_at = NULL, deleted_at = NULL,
                       updated_at = now()
         RETURNING id`, [platformUserId, role.id]
      );
      const roleAssignmentId = assignment.rows[0]?.id;
      if (!roleAssignmentId) throw new Error('Platform role assignment could not be verified.');
      return { platformUserId, roleId: role.id, permissionId: permission.id, roleAssignmentId };
    });
  }

  /** Explicit deployment/admin workflow bootstrap. Never called by login or frontend. */
  public static async bootstrapCatalog(context: TrustedCatalogContext): Promise<{ roleId: string; permissionCount: number }> {
    const tenantId = required(context.tenantId, 'tenantId');
    const schoolId = required(context.schoolId, 'schoolId');
    return UnitOfWork.runInTransaction(schoolId, {
      operationName: 'ERP RBAC catalog bootstrap',
      tenantId,
      userId: context.actorUserId || 'system',
      userName: 'ERP RBAC bootstrap',
      ipAddress: 'internal',
      affectedTables: ['roles', 'permissions', 'role_permissions'],
      tenantContext: { tenantId, schoolId, branchId: '', academicYear: '', userId: context.actorUserId || 'system', role: CANONICAL_ROLE_NAME }
    }, async () => {
      const roleId = await ensureRole({ ...context, tenantId, schoolId });
      const permissionCount = await ensurePermissions({ ...context, tenantId, schoolId }, roleId);
      return { roleId, permissionCount };
    });
  }

  public static async provisionIdentity(context: TrustedProvisioningContext): Promise<ProvisioningResult> {
    const authUserId = required(context.authUserId, 'authUserId');
    const tenantId = required(context.tenantId, 'tenantId');
    const schoolId = required(context.schoolId, 'schoolId');
    const displayName = required(context.displayName, 'displayName');
    const branchId = context.branchId?.trim() || null;
    const actorUserId = context.actorUserId?.trim() || null;

    return UnitOfWork.runInTransaction(schoolId, {
      operationName: 'ERP identity provisioning', tenantId, userId: actorUserId || authUserId,
      userName: displayName, ipAddress: 'internal',
      affectedTables: ['users', 'roles', 'permissions', 'role_permissions', 'user_roles'],
      tenantContext: { tenantId, schoolId, branchId: branchId || '', academicYear: '', userId: authUserId, role: CANONICAL_ROLE_NAME }
    }, async () => {
      const transaction = db();
      const existing = await transaction.query<{ id: string; tenant_id: string; school_id: string | null; branch_id: string | null }>(
        `SELECT id, tenant_id, school_id, branch_id FROM public.users
          WHERE auth_user_id = $1::uuid AND deleted_at IS NULL FOR UPDATE`, [authUserId]
      );
      let userId = existing.rows[0]?.id;
      if (userId) {
        const row = existing.rows[0];
        if (row.tenant_id !== tenantId || row.school_id !== schoolId || (row.branch_id || null) !== branchId) {
          throw new Error('Existing ERP identity is outside the trusted provisioning scope.');
        }
      } else {
        const created = await transaction.query<{ id: string }>(
          `INSERT INTO public.users
            (auth_user_id, tenant_id, school_id, branch_id, display_name, status, created_by, updated_by)
           VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, 'active', $6::uuid, $6::uuid)
           ON CONFLICT (auth_user_id) DO NOTHING RETURNING id`,
          [authUserId, tenantId, schoolId, branchId, displayName, actorUserId]
        );
        userId = created.rows[0]?.id;
        if (!userId) throw new Error('ERP identity could not be created within the trusted transaction.');
      }

      const roleId = await ensureRole({ tenantId, schoolId, actorUserId: actorUserId || undefined });
      const permissionCount = await ensurePermissions({ tenantId, schoolId, actorUserId: actorUserId || undefined }, roleId);
      const assignment = await transaction.query<{ id: string }>(
        `INSERT INTO public.user_roles
          (tenant_id, user_id, role_id, school_id, branch_id, status, created_by, updated_by)
         SELECT $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', $6::uuid, $6::uuid
          WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles
             WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND role_id = $3::uuid
               AND school_id = $4::uuid AND branch_id IS NOT DISTINCT FROM $5::uuid
               AND deleted_at IS NULL AND status = 'active'
          )
         RETURNING id`,
        [tenantId, userId, roleId, schoolId, branchId, actorUserId]
      );
      const assignmentId = assignment.rows[0]?.id || (await transaction.query<{ id: string }>(
        `SELECT id FROM public.user_roles
          WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND role_id = $3::uuid
            AND school_id = $4::uuid AND branch_id IS NOT DISTINCT FROM $5::uuid
            AND deleted_at IS NULL AND status = 'active'
          ORDER BY starts_at DESC LIMIT 1 FOR UPDATE`,
        [tenantId, userId, roleId, schoolId, branchId]
      )).rows[0]?.id;
      if (!assignmentId) throw new Error('ERP role assignment could not be verified.');
      return { userId, roleId, roleAssignmentId: assignmentId, permissionCount };
    });
  }

  /**
   * Explicit owner activation for an already trusted school identity.
   *
   * This workflow deliberately targets the existing school-scoped `admin`
   * role. It does not create a wildcard permission, change platform RBAC, or
   * accept a role/permission list from the browser.
   */
  public static async provisionSchoolOwnerIdentity(context: TrustedProvisioningContext): Promise<ProvisioningResult> {
    const authUserId = required(context.authUserId, 'authUserId');
    const tenantId = required(context.tenantId, 'tenantId');
    const schoolId = required(context.schoolId, 'schoolId');
    const displayName = required(context.displayName, 'displayName');
    const branchId = context.branchId?.trim() || null;
    const actorUserId = context.actorUserId?.trim() || null;

    return UnitOfWork.runInTransaction(schoolId, {
      operationName: 'ERP school owner permission activation', tenantId, userId: actorUserId || authUserId,
      userName: displayName, ipAddress: 'internal',
      affectedTables: ['users', 'roles', 'permissions', 'role_permissions', 'user_roles'],
      tenantContext: { tenantId, schoolId, branchId: branchId || '', academicYear: '', userId: authUserId, role: 'SchoolOwner' }
    }, async () => {
      const transaction = db();
      const user = (await transaction.query<{ id: string; tenant_id: string; school_id: string | null; branch_id: string | null; status: string }>(
        `SELECT id, tenant_id, school_id, branch_id, status
           FROM public.users
          WHERE auth_user_id = $1::uuid AND deleted_at IS NULL
          FOR UPDATE`, [authUserId]
      )).rows[0];
      if (!user || user.status !== 'active') throw new Error('Trusted ERP identity is missing or inactive.');
      if (user.tenant_id !== tenantId || user.school_id !== schoolId || (user.branch_id || null) !== branchId) {
        throw new Error('Existing ERP identity is outside the trusted owner scope.');
      }

      const role = (await transaction.query<{ id: string; school_id: string | null; branch_id: string | null; status: string; deleted_at: string | null }>(
        `SELECT id, school_id, branch_id, status, deleted_at
           FROM public.roles
          WHERE tenant_id = $1::uuid
            AND role_key = 'admin'
            AND school_id = $2::uuid
            AND branch_id IS NULL
          FOR UPDATE`, [tenantId, schoolId]
      )).rows[0];
      if (!role || role.school_id !== schoolId || role.branch_id !== null || role.status !== 'active' || role.deleted_at !== null) {
        throw new Error('Trusted school owner role is missing, incorrectly scoped, or inactive.');
      }

      const permissionCount = await ensurePermissions({ tenantId, schoolId, actorUserId: actorUserId || undefined }, role.id);
      const assignment = await transaction.query<{ id: string }>(
        `INSERT INTO public.user_roles
          (tenant_id, user_id, role_id, school_id, branch_id, status, created_by, updated_by)
         SELECT $1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'active', $6::uuid, $6::uuid
          WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles
             WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND role_id = $3::uuid
               AND school_id = $4::uuid AND branch_id IS NOT DISTINCT FROM $5::uuid
               AND deleted_at IS NULL AND status = 'active'
          )
         RETURNING id`,
        [tenantId, user.id, role.id, schoolId, branchId, actorUserId]
      );
      const roleAssignmentId = assignment.rows[0]?.id || (await transaction.query<{ id: string }>(
        `SELECT id FROM public.user_roles
          WHERE tenant_id = $1::uuid AND user_id = $2::uuid AND role_id = $3::uuid
            AND school_id = $4::uuid AND branch_id IS NOT DISTINCT FROM $5::uuid
            AND deleted_at IS NULL AND status = 'active'
          ORDER BY starts_at DESC LIMIT 1 FOR UPDATE`,
        [tenantId, user.id, role.id, schoolId, branchId]
      )).rows[0]?.id;
      if (!roleAssignmentId) throw new Error('Trusted school owner role assignment could not be verified.');
      return { userId: user.id, roleId: role.id, roleAssignmentId, permissionCount };
    });
  }
}
