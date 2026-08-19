import { permissionRegistry, PERMISSIONS } from './PermissionRegistry';
import { AuthorizationIdentity, InvalidRoleError, RoleResolver, roleResolver } from './RoleResolver';
import { PermissionCache } from './PermissionCache';

export type AuthorizationContext = {
  resource?: string;
  action?: string;
  branchId?: string;
  schoolId?: string;
  endpoint?: string;
  method?: string;
  /** Audit metadata only; never participates in authorization decisions. */
  ipAddress?: string;
};

export type AuthorizationDecision = {
  allowed: boolean;
  permission: string;
  role: string | null;
  resource: string;
  action: string;
  reason: 'ALLOWED' | 'MISSING_PERMISSION' | 'INVALID_ROLE' | 'UNKNOWN_PERMISSION';
  scope: 'tenant' | 'platform';
};

export class AuthorizationDeniedError extends Error {
  constructor(public readonly decision: AuthorizationDecision) {
    super(decision.reason === 'UNKNOWN_PERMISSION' ? 'Unknown permission' : 'Permission denied');
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function resourceAction(permission: string): { resource: string; action: string } {
  const [resource = 'Unknown', action = 'Unknown'] = permission.split('.');
  return { resource, action };
}

export class AuthorizationEngine {
  private readonly tenantCache: PermissionCache;
  private readonly platformCache: PermissionCache;

  constructor(
    private readonly resolver: RoleResolver = roleResolver,
    tenantCache: PermissionCache = new PermissionCache(),
    platformCache: PermissionCache = new PermissionCache(),
  ) {
    this.tenantCache = tenantCache;
    this.platformCache = platformCache;
  }

  private normalizeRequestedPermission(requestedPermission: unknown):
    | { permission: string; resource: string; action: string }
    | { permission: string; resource: string; action: string; reason: 'UNKNOWN_PERMISSION' } {
    const permission = permissionRegistry.normalize(requestedPermission);
    const normalizedPermission = permission || String(requestedPermission || 'Unknown');
    const { resource, action } = resourceAction(normalizedPermission);
    if (!permission) return { permission: normalizedPermission, resource, action, reason: 'UNKNOWN_PERMISSION' };
    return { permission, resource, action };
  }

  authorizeTenant(
    identity: AuthorizationIdentity | null | undefined,
    requestedPermission: unknown,
    _context: AuthorizationContext = {},
  ): AuthorizationDecision {
    const normalized = this.normalizeRequestedPermission(requestedPermission);
    if ('reason' in normalized) {
      return { ...normalized, allowed: false, role: null, scope: 'tenant' };
    }
    const { permission, resource, action } = normalized;
    if (permission === PERMISSIONS.PLATFORM_ADMIN) {
      return { allowed: false, permission, role: null, resource, action, reason: 'MISSING_PERMISSION', scope: 'tenant' };
    }

    let role: string;
    let permissions: ReadonlySet<string>;
    try {
      role = this.resolver.resolveRole(identity);
      const cacheKey = `tenant:${role}`;
      permissions = this.tenantCache.get(cacheKey) || this.resolver.getPermissions(identity);
      if (!this.tenantCache.get(cacheKey)) this.tenantCache.set(cacheKey, permissions);
    } catch (error) {
      if (error instanceof InvalidRoleError) {
        return { allowed: false, permission, role: null, resource, action, reason: 'INVALID_ROLE', scope: 'tenant' };
      }
      throw error;
    }

    const allowed = permissions.has(permission) || (permissions.has('*') && permission !== PERMISSIONS.PLATFORM_ADMIN);
    return { allowed, permission, role, resource, action, reason: allowed ? 'ALLOWED' : 'MISSING_PERMISSION', scope: 'tenant' };
  }

  authorizePlatform(
    identity: AuthorizationIdentity | null | undefined,
    requestedPermission: unknown,
    _context: AuthorizationContext = {},
  ): AuthorizationDecision {
    const normalized = this.normalizeRequestedPermission(requestedPermission);
    if ('reason' in normalized) {
      return { ...normalized, allowed: false, role: null, scope: 'platform' };
    }
    const { permission, resource, action } = normalized;
    let role: string | null = null;
    try {
      role = this.resolver.resolvePlatformRole(identity) || null;
      const cacheKey = `platform:${identity?.id || ''}`;
      const permissions = this.platformCache.get(cacheKey) || this.resolver.getPlatformPermissions(identity);
      if (!this.platformCache.get(cacheKey)) this.platformCache.set(cacheKey, permissions);
      const allowed = permission === PERMISSIONS.PLATFORM_ADMIN && permissions.has(PERMISSIONS.PLATFORM_ADMIN);
      return { allowed, permission, role, resource, action, reason: allowed ? 'ALLOWED' : 'MISSING_PERMISSION', scope: 'platform' };
    } catch (error) {
      if (error instanceof InvalidRoleError) {
        return { allowed: false, permission, role: null, resource, action, reason: 'INVALID_ROLE', scope: 'platform' };
      }
      throw error;
    }
  }

  authorize(identity: AuthorizationIdentity | null | undefined, requestedPermission: unknown, context: AuthorizationContext = {}): AuthorizationDecision {
    return this.authorizeTenant(identity, requestedPermission, context);
  }

  assert(identity: AuthorizationIdentity | null | undefined, permission: unknown, context: AuthorizationContext = {}): AuthorizationDecision {
    const decision = this.authorizeTenant(identity, permission, context);
    if (!decision.allowed) throw new AuthorizationDeniedError(decision);
    return decision;
  }

  assertPlatform(identity: AuthorizationIdentity | null | undefined, permission: unknown, context: AuthorizationContext = {}): AuthorizationDecision {
    const decision = this.authorizePlatform(identity, permission, context);
    if (!decision.allowed) throw new AuthorizationDeniedError(decision);
    return decision;
  }

  can(identity: AuthorizationIdentity | null | undefined, permission: unknown, context: AuthorizationContext = {}): boolean {
    return this.authorizeTenant(identity, permission, context).allowed;
  }

  canPlatform(identity: AuthorizationIdentity | null | undefined, permission: unknown, context: AuthorizationContext = {}): boolean {
    return this.authorizePlatform(identity, permission, context).allowed;
  }

  clearCache(): void {
    this.tenantCache.clear();
    this.platformCache.clear();
  }
}

export const authorizationEngine = new AuthorizationEngine();
