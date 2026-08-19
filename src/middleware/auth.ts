// Backwards-compatible protected-endpoint surface.
// The order is intentionally authorization, then tenant validation, then business logic.
import express from 'express';
import {
  requirePermission as authorizePermission,
  requireAnyPermission as authorizeAnyPermission,
  requireRole as authorizeRole,
  requirePlatformPermission as authorizePlatformPermission,
  ROLE_PERMISSIONS
} from './authorization.js';
import { tenantValidationMiddleware } from './tenantValidation.js';
import { PERMISSIONS } from '../authorization/PermissionRegistry.js';

function withTenantValidation(middleware: (req: express.Request, res: express.Response, next: express.NextFunction) => any) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await new Promise<void>((resolve, reject) => {
      const authorizationNext: express.NextFunction = error => {
        if (error) {
          next(error);
          resolve();
          return;
        }
        void tenantValidationMiddleware(req, res, tenantError => {
          next(tenantError);
          resolve();
        }).catch(reject);
      };
      void Promise.resolve(middleware(req, res, authorizationNext)).catch(reject);
    });
  };
}

export function requirePermission(permission: string) {
  return withTenantValidation(authorizePermission(permission));
}

/**
 * Authorization-only middleware for endpoints that must establish their
 * trusted tenant context inside an already-open request transaction.
 * Tenant validation remains mandatory; the endpoint owns its transaction
 * boundary so the authorization decision can precede it without opening a
 * second transaction.
 */
export function requirePermissionOnly(permission: string) {
  return permission === PERMISSIONS.PLATFORM_ADMIN
    ? authorizePlatformPermission(permission)
    : authorizePermission(permission);
}

export function requirePlatformPermission(permission: string) {
  return authorizePlatformPermission(permission);
}

export function requireAnyPermission(permissions: string[]) {
  return withTenantValidation(authorizeAnyPermission(permissions));
}

export function requireRole(roles: string | string[]) {
  return withTenantValidation(authorizeRole(roles));
}

export { ROLE_PERMISSIONS };
