import { permissionRegistry, PERMISSIONS } from './PermissionRegistry';

export type AuthorizationIdentity = {
  id?: string;
  email?: string;
  name?: string;
  tenantId?: string;
  schoolId?: string;
  branchId?: string;
  academicYear?: string;
  role?: string;
  /** Server-derived effective permissions used by the client as a visibility hint. */
  permissions?: string[];
  /** Server-derived platform permissions; never accepted as request authority. */
  platformPermissions?: string[];
};

export type DatabaseRolePermission = {
  roleKey: string;
  permissionKey: string;
};

export type DatabaseRolePermissionLoader = (identity: AuthorizationIdentity) => Promise<DatabaseRolePermission[] | null>;

export class InvalidRoleError extends Error {
  constructor(message = 'Unknown or missing role') {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const ROLE_DEFINITIONS: Record<string, string[]> = {
  superadmin: ['*', 'Platform.Admin'],
  schooladmin: ['*'],
  admin: ['*'],
  financial_manager: [
    'dashboard:view', 'dashboard:refresh', 'settings:view', 'settings:edit',
    'ledger:view', 'ledger:insert', 'ledger:edit', 'ledger:delete', 'ledger:approve', 'ledger:cancel', 'ledger:post', 'ledger:reverse', 'ledger:export', 'ledger:print',
    'invoice:view', 'invoice:insert', 'invoice:edit', 'invoice:delete', 'invoice:approve', 'invoice:cancel', 'invoice:post', 'invoice:reverse', 'invoice:export', 'invoice:print',
    'financial:read', 'financial:write', 'financial:approve', 'financial:post', 'audit:read', 'audit:view', 'permissions:view', 'permissions:edit', 'permissions:audit_logs'
  ],
  accountant: [
    'dashboard:view', 'ledger:view', 'ledger:insert', 'ledger:edit', 'ledger:post', 'ledger:export', 'ledger:print',
    'invoice:view', 'invoice:insert', 'invoice:edit', 'invoice:export', 'invoice:print',
    'financial:read', 'financial:write', 'inventory:view', 'inventory:write', 'audit:read', 'student:read', 'student:print', 'student:export'
  ],
  cashier: ['dashboard:view', 'invoice:view', 'invoice:insert', 'invoice:print', 'financial:read', 'audit:read'],
  student_affairs: ['dashboard:view', 'student:view', 'student:insert', 'student:edit', 'student:delete', 'student:export', 'student:print', 'student:import', 'student:read', 'student:write', 'Student.Registration.Create', 'Student.Guardian.Link', 'Student.Number.Override', 'Student.Duplicate.Override', 'Admission.Read', 'Admission.Write', 'attendance:view', 'attendance:insert', 'attendance:edit', 'attendance:export', 'attendance:print'],
  hr_manager: ['dashboard:view', 'hr:view', 'hr:insert', 'hr:edit', 'hr:delete', 'hr:approve', 'hr:cancel', 'hr:post', 'hr:export', 'hr:print', 'attendance:view', 'attendance:insert', 'attendance:edit'],
  control: ['dashboard:view', 'exam:view', 'exam:insert', 'exam:edit', 'exam:delete', 'exam:approve', 'exam:cancel', 'exam:post', 'exam:export', 'exam:print', 'exam:read', 'exam:write'],
  warehouse_keeper: ['dashboard:view', 'warehouse:view', 'warehouse:insert', 'warehouse:edit', 'warehouse:export', 'warehouse:print'],
  assets_manager: ['dashboard:view', 'assets:view', 'assets:insert', 'assets:edit', 'assets:export', 'assets:print'],
  librarian: ['dashboard:view', 'library:view', 'library:insert', 'library:edit', 'library:delete', 'library:borrow:view', 'library:borrow:insert', 'library:borrow:edit'],
  transport_manager: ['dashboard:view', 'buses:view', 'buses:insert', 'buses:edit'],
  auditor: ['dashboard:view', 'student:view', 'student:export', 'student:print', 'student:read', 'invoice:view', 'invoice:export', 'invoice:print', 'ledger:view', 'ledger:export', 'ledger:print', 'financial:read', 'attendance:view', 'attendance:export', 'attendance:print', 'exam:view', 'exam:export', 'exam:print', 'exam:read', 'audit:read', 'audit:view'],
  teacher: ['dashboard:view', 'student:view', 'student:read', 'student:print', 'student:export', 'attendance:view', 'attendance:insert', 'attendance:edit', 'exam:view', 'exam:read', 'exam:write', 'ai:chat', 'library:view'],
  parent: ['student:view', 'student:read', 'exam:view', 'exam:read', 'ai:chat'],
  student: ['exam:view', 'exam:read', 'ai:chat'],
  employee: ['dashboard:view', 'student:view', 'student:read', 'student:print', 'student:export', 'exam:view', 'exam:read', 'ai:chat', 'audit:read']
};

export const ROLE_PERMISSIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(ROLE_DEFINITIONS).map(([role, permissions]) => [
    role,
    permissions.includes('*') ? ['*'] : permissions.map(permission => permissionRegistry.normalize(permission)).filter(Boolean) as string[]
  ])
);

export class RoleResolver {
  private databaseLoader: DatabaseRolePermissionLoader | null = null;
  private platformDatabaseLoader: DatabaseRolePermissionLoader | null = null;
  private readonly databaseAssignments = new Map<string, { roleKey: string; permissions: ReadonlySet<string>; expiresAt: number }>();
  private readonly platformAssignments = new Map<string, { roleKey: string; permissions: ReadonlySet<string>; expiresAt: number }>();

  public configureDatabaseLoader(loader: DatabaseRolePermissionLoader | null): void {
    this.databaseLoader = loader;
    this.databaseAssignments.clear();
  }

  public configurePlatformDatabaseLoader(loader: DatabaseRolePermissionLoader | null): void {
    this.platformDatabaseLoader = loader;
    this.platformAssignments.clear();
  }

  private identityKey(identity: AuthorizationIdentity | null | undefined): string {
    return `${String(identity?.tenantId || '').trim()}|${String(identity?.id || '').trim()}|${String(identity?.schoolId || '').trim()}|${String(identity?.branchId || '').trim()}`;
  }

  private databaseAssignment(identity: AuthorizationIdentity | null | undefined) {
    const entry = this.databaseAssignments.get(this.identityKey(identity));
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) this.databaseAssignments.delete(this.identityKey(identity));
      return null;
    }
    return entry;
  }

  private platformIdentityKey(identity: AuthorizationIdentity | null | undefined): string {
    return String(identity?.id || '').trim();
  }

  private platformDatabaseAssignment(identity: AuthorizationIdentity | null | undefined) {
    const key = this.platformIdentityKey(identity);
    const entry = this.platformAssignments.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) this.platformAssignments.delete(key);
      return null;
    }
    return entry;
  }

  async ensureDatabasePermissions(identity: AuthorizationIdentity | null | undefined): Promise<void> {
    if (!this.databaseLoader) return;
    if (!identity?.id || !identity.schoolId) throw new InvalidRoleError('Trusted identity is incomplete.');
    if (this.databaseAssignment(identity)) return;
    const assignments = await this.databaseLoader(identity);
    // null means there is no configured database driver in local/browser
    // compatibility mode. A live driver returns an array, including [], and
    // therefore fails closed when no trusted assignment exists.
    if (assignments === null) return;
    if (!assignments.length) throw new InvalidRoleError('No active database role assignment.');
    const roleKeys = [...new Set(assignments.map(assignment => String(assignment.roleKey || '').trim().toLowerCase()).filter(Boolean))].sort();
    if (!roleKeys.length || roleKeys.some(role => !ROLE_PERMISSIONS[role])) throw new InvalidRoleError('Database role assignment is not recognized.');
    const permissions = new Set<string>();
    for (const assignment of assignments) {
      const permission = permissionRegistry.normalize(assignment.permissionKey);
      if (!permission || permission === '*' || permission === PERMISSIONS.PLATFORM_ADMIN) {
        throw new InvalidRoleError('Tenant role assignment contains an unknown, wildcard, or platform permission.');
      }
      permissions.add(permission);
    }
    this.databaseAssignments.set(this.identityKey(identity), {
      roleKey: roleKeys[0],
      permissions,
      expiresAt: Date.now() + 30_000
    });
  }

  async ensurePlatformDatabasePermissions(identity: AuthorizationIdentity | null | undefined): Promise<void> {
    if (!this.platformDatabaseLoader) return;
    if (!identity?.id) throw new InvalidRoleError('Trusted auth_user_id is incomplete.');
    if (this.platformDatabaseAssignment(identity)) return;
    const assignments = await this.platformDatabaseLoader(identity);
    if (assignments === null) return;
    if (!assignments.length) throw new InvalidRoleError('No active platform role assignment.');
    const roleKeys = [...new Set(assignments.map(assignment => String(assignment.roleKey || '').trim().toLowerCase()).filter(Boolean))].sort();
    if (!roleKeys.length || roleKeys.some(role => role !== 'platformadmin')) {
      throw new InvalidRoleError('Platform role assignment is not canonical.');
    }
    const permissions = new Set<string>();
    for (const assignment of assignments) {
      const permission = permissionRegistry.normalize(assignment.permissionKey);
      if (!permission || permission === '*' || permission !== PERMISSIONS.PLATFORM_ADMIN) {
        throw new InvalidRoleError('Platform role assignment must contain explicit Platform.Admin only.');
      }
      permissions.add(permission);
    }
    this.platformAssignments.set(this.platformIdentityKey(identity), {
      roleKey: roleKeys[0],
      permissions,
      expiresAt: Date.now() + 30_000
    });
  }

  async resolveTenantPermissions(identity: AuthorizationIdentity | null | undefined): Promise<ReadonlySet<string>> {
    await this.ensureDatabasePermissions(identity);
    return this.getPermissions(identity);
  }

  async resolvePlatformPermissions(identity: AuthorizationIdentity | null | undefined): Promise<ReadonlySet<string>> {
    await this.ensurePlatformDatabasePermissions(identity);
    return this.getPlatformPermissions(identity);
  }

  clearDatabaseAssignments(): void {
    this.databaseAssignments.clear();
    this.platformAssignments.clear();
  }

  resolveRole(identity: AuthorizationIdentity | null | undefined): string {
    const databaseAssignment = this.databaseAssignment(identity);
    if (databaseAssignment) return databaseAssignment.roleKey;
    const role = typeof identity?.role === 'string' ? identity.role.trim().toLowerCase() : '';
    if (!role || !ROLE_PERMISSIONS[role]) throw new InvalidRoleError();
    return role;
  }

  getPermissions(identity: AuthorizationIdentity | null | undefined): ReadonlySet<string> {
    const databaseAssignment = this.databaseAssignment(identity);
    if (databaseAssignment) return databaseAssignment.permissions;
    const role = this.resolveRole(identity);
    return new Set(ROLE_PERMISSIONS[role].filter(permission => permission !== PERMISSIONS.PLATFORM_ADMIN));
  }

  resolvePlatformRole(identity: AuthorizationIdentity | null | undefined): string {
    return this.platformDatabaseAssignment(identity)?.roleKey || '';
  }

  getPlatformPermissions(identity: AuthorizationIdentity | null | undefined): ReadonlySet<string> {
    const databasePermissions = this.platformDatabaseAssignment(identity)?.permissions;
    if (databasePermissions) return databasePermissions;
    if (!Array.isArray(identity?.platformPermissions)) return new Set<string>();
    return new Set(identity.platformPermissions
      .map(permission => permissionRegistry.normalize(permission))
      .filter((permission): permission is string => permission === PERMISSIONS.PLATFORM_ADMIN));
  }

  isPlatformAdmin(identity: AuthorizationIdentity | null | undefined): boolean {
    return this.getPlatformPermissions(identity).has(PERMISSIONS.PLATFORM_ADMIN);
  }

  isSuperAdmin(identity: AuthorizationIdentity | null | undefined): boolean {
    return this.resolveRole(identity) === 'superadmin';
  }
}

export const roleResolver = new RoleResolver();
