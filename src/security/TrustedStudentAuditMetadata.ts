import type { AuditMetadata } from '../types';
import type { TrustedIdentity } from '../middleware/trustedAuthentication';
import type { TenantContext } from '../tenant/TenantContext';

type TrustedStudentRequest = {
  user?: TrustedIdentity;
  tenantContext?: TenantContext;
  ip?: string;
  socket?: { remoteAddress?: string };
};

/**
 * Builds audit metadata from the authenticated server request only.
 * Request body, query string, headers and browser state are intentionally not read.
 */
export function createTrustedStudentAuditMetadata(request: TrustedStudentRequest): AuditMetadata {
  const identity = request.user;
  const tenant = request.tenantContext;

  if (!identity || !tenant) {
    throw new Error('Trusted authentication and tenant context are required for student audit operations.');
  }

  if (
    identity.id !== tenant.userId ||
    identity.schoolId !== tenant.schoolId ||
    (identity.tenantId && identity.tenantId !== tenant.tenantId) ||
    identity.role !== tenant.role
  ) {
    throw new Error('Trusted identity and tenant context do not match.');
  }

  return {
    userId: tenant.userId,
    userName: identity.name,
    userRole: tenant.role,
    ipAddress: request.socket?.remoteAddress || request.ip || 'unknown'
  };
}
