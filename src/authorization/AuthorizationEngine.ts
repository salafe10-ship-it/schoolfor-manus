import { PermissionCache } from './PermissionCache';
import { permissionRegistry, PERMISSIONS } from './PermissionRegistry';
import { AuthorizationIdentity, InvalidRoleError, RoleResolver, roleResolver } from './RoleResolver';

export type AuthorizationContext = {
  resource?: string;
  branchId?: string;
  schoolId?: string;
  endpoint?: string;
  method?: string;
};

export type AuthorizationDecision = {
  allowed: boolean;
  permission: string;
  role: string | null;
  resource: string;
  action: string;
  reason: 'ALLOWED' | 'MISSING_PERMISSION' | 'INVALID_ROLE' | 'UNKNOWN_PERMISSION';
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
  constructor(
    private readonly resolver: RoleResolver = roleResolver,
    private readonly cache: PermissionCache = new PermissionCache()
  ) {}

  authorize(identity: AuthorizationIdentity | null | undefined, requestedPermission: unknown, context: AuthorizationContext = {}): AuthorizationDecision {
    const permission = permissionRegistry.normalize(requestedPermission);
    const normalizedPermission = permission || String(requestedPermission || 'Unknown');
    const { resource, action } = resourceAction(normalizedPermission);
    if (!permission) {
      return { allowed: false, permission: normalizedPermission, role: null, resource, action, reason: 'UNKNOWN_PERMISSION' };
    }

    let role: string;
    let permissions: ReadonlySet<string>;
    try {
      role = this.resolver.resolveRole(identity);
      const cacheKey = role;
      permissions = this.cache.get(cacheKey) || this.resolver.getPermissions(identity);
      if (!this.cache.get(cacheKey)) this.cache.set(cacheKey, permissions);
    } catch (error) {
      if (error instanceof InvalidRoleError) {
        return { allowed: false, permission, role: null, resource, action, reason: 'INVALID_ROLE' };
      }
      throw error;
    }

    const allowed = (permissions.has('*') && (permission !== PERMISSIONS.PLATFORM_ADMIN || role === 'superadmin')) || permissions.has(permission);
    return { allowed, permission, role, resource, action, reason: allowed ? 'ALLOWED' : 'MISSING_PERMISSION' };
  }

  assert(identity: AuthorizationIdentity | null | undefined, permission: unknown, context: AuthorizationContext = {}): AuthorizationDecision {
    const decision = this.authorize(identity, permission, context);
    if (!decision.allowed) throw new AuthorizationDeniedError(decision);
    return decision;
  }

  can(identity: AuthorizationIdentity | null | undefined, permission: unknown, context: AuthorizationContext = {}): boolean {
    return this.authorize(identity, permission, context).allowed;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const authorizationEngine = new AuthorizationEngine();
