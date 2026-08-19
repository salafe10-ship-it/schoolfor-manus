import express from 'express';
import { AuthorizationError } from '../utils/errors.js';
import { authorizationEngine } from '../authorization/AuthorizationEngine.js';
import { recordAuthorizationDenial } from '../authorization/AuthorizationAuditHooks.js';
import { ROLE_PERMISSIONS } from '../authorization/RoleResolver.js';
import { roleResolver } from '../authorization/RoleResolver.js';
import { createDatabaseRolePermissionLoader } from '../authorization/DatabaseRolePermissionSource.js';
import { createPlatformRolePermissionLoader } from '../authorization/PlatformRolePermissionSource.js';

roleResolver.configureDatabaseLoader(createDatabaseRolePermissionLoader());
roleResolver.configurePlatformDatabaseLoader(createPlatformRolePermissionLoader());

function requestContext(req: express.Request) {
  const user = (req as any).user;
  return {
    schoolId: user?.schoolId,
    branchId: req.headers['x-branch-id'] || req.query.branchId || req.body?.branchId || req.body?.branch_id,
    endpoint: req.originalUrl,
    method: req.method,
    ipAddress: req.ip || 'unknown'
  };
}

function permissionTrace(req: express.Request): any {
  return (req as any).safeAuthTrace;
}

function markPermissionResolution(req: express.Request, permission: string): void {
  const trace = permissionTrace(req);
  if (!trace) return;
  trace.permissionResolutionStarted = 'YES';
  trace.requiredPermission = permission;
  trace.tenantScopeValid = (req as any).user?.tenantId ? 'YES' : 'NO';
}

function markRoleResolutionStarted(req: express.Request): void {
  const trace = permissionTrace(req);
  if (trace) trace.roleResolutionStarted = 'YES';
}

function markRoleResolutionSuccess(req: express.Request, identity: any, role: string, permissions: ReadonlySet<string>): void {
  const trace = permissionTrace(req);
  if (!trace) return;
  trace.roleFound = 'YES';
  trace.roleActive = 'YES';
  trace.roleNamePresent = role ? 'YES' : 'NO';
  trace.studentViewFound = permissions.has('Student.View') || permissions.has('*') ? 'YES' : 'NO';
  trace.studentViewActive = trace.studentViewFound;
  trace.tenantScopeValid = identity?.tenantId ? 'YES' : 'NO';
}

async function deny(req: express.Request, next: express.NextFunction, permission: unknown, decision: any) {
  await recordAuthorizationDenial((req as any).user, decision, requestContext(req));
  return next(new AuthorizationError(`غير مصرح. الصلاحية المطلوبة: ${String(permission)}`));
}

export function requirePermission(permission: string) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (req as any).perf004Trace?.mark('authorization_started');
    markRoleResolutionStarted(req);
    markPermissionResolution(req, permission);
    try {
      await roleResolver.resolveTenantPermissions((req as any).user);
      authorizationEngine.clearCache();
      const identity = (req as any).user;
      const role = roleResolver.resolveRole(identity);
      markRoleResolutionSuccess(req, identity, role, await roleResolver.resolveTenantPermissions(identity));
    } catch {
      const trace = permissionTrace(req);
      if (trace) trace.rejectionStage = 'permission';
      return deny(req, next, permission, { allowed: false, permission, role: null, resource: permission.split('.')[0] || 'Unknown', action: permission.split('.')[1] || 'Unknown', reason: 'INVALID_ROLE' });
    }
    const decision = authorizationEngine.authorizeTenant((req as any).user, permission, requestContext(req));
    if (!decision.allowed) {
      const trace = permissionTrace(req);
      if (trace) trace.rejectionStage = 'permission';
      return deny(req, next, permission, decision);
    }
    (req as any).authorization = decision;
    (req as any).perf004Trace?.mark('authorization_completed');
    next();
  };
}

export function requirePlatformPermission(permission: string) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    (req as any).perf004Trace?.mark('platform_authorization_started');
    try {
      await roleResolver.resolvePlatformPermissions((req as any).user);
      authorizationEngine.clearCache();
      const decision = authorizationEngine.authorizePlatform((req as any).user, permission, {
        endpoint: req.originalUrl,
        method: req.method,
        ipAddress: req.ip || 'unknown'
      });
      if (!decision.allowed) return deny(req, next, permission, decision);
      (req as any).platformAuthorization = decision;
      (req as any).perf004Trace?.mark('platform_authorization_completed');
      return next();
    } catch {
      return deny(req, next, permission, {
        allowed: false,
        permission,
        role: null,
        resource: permission.split('.')[0] || 'Unknown',
        action: permission.split('.')[1] || 'Unknown',
        reason: 'INVALID_ROLE',
        scope: 'platform'
      });
    }
  };
}

export function requireAnyPermission(permissions: string[]) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      await roleResolver.ensureDatabasePermissions((req as any).user);
      authorizationEngine.clearCache();
    } catch {
      return deny(req, next, permissions.join(', '), { allowed: false, permission: permissions[0] || 'Unknown.Permission', role: null, resource: 'Unknown', action: 'Unknown', reason: 'INVALID_ROLE' });
    }
    const decisions = permissions.map(permission => authorizationEngine.authorizeTenant((req as any).user, permission, requestContext(req)));
    const allowed = decisions.find(decision => decision.allowed);
    if (allowed) {
      (req as any).authorization = allowed;
      return next();
    }
    const decision = decisions[0] || authorizationEngine.authorize((req as any).user, 'Unknown.Permission', requestContext(req));
    return deny(req, next, permissions.join(', '), decision);
  };
}

export function requireRole(allowedRoles: string | string[]) {
  const allowed = new Set((Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(role => role.toLowerCase()));
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const identity = (req as any).user;
    let role: string;
    try {
      await roleResolver.ensureDatabasePermissions(identity);
      authorizationEngine.clearCache();
      role = roleResolver.resolveRole(identity);
    } catch {
      const decision = authorizationEngine.authorizeTenant(identity, 'Unknown.Permission', requestContext(req));
      return deny(req, next, `Role:${[...allowed].join('|')}`, { ...decision, allowed: false, reason: 'INVALID_ROLE', permission: `Role:${String(identity?.role || 'unknown')}`, resource: 'Role', action: 'Resolve' });
    }
    if (!allowed.has(role)) {
      const decision = authorizationEngine.authorizeTenant(identity, 'Platform.Admin', requestContext(req));
      return deny(req, next, `Role:${[...allowed].join('|')}`, { ...decision, allowed: false, reason: 'MISSING_PERMISSION', permission: `Role:${role}`, resource: 'Role', action: role });
    }
    next();
  };
}

export { ROLE_PERMISSIONS };
