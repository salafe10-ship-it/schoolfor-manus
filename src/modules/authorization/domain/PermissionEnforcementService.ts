// src/modules/authorization/domain/PermissionEnforcementService.ts
import { TenantContext } from '../../shared-kernel/types/TenantContext';
import { Resource, Action, RolePermissions } from './Permission';
import { PolicyRepository } from '../repository/PolicyRepository';

export class SecurityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityException';
  }
}

/**
 * Service to enforce fine-grained permissions using RBAC and ABAC.
 * Follows DDD and Zero Trust Security principles.
 */
export class PermissionEnforcementService {
  constructor(private readonly policyRepository: PolicyRepository) {}

  /**
   * Validates if a user has the required permission within the tenant context.
   * Audits the request.
   */
  public async checkPermission(
    context: TenantContext,
    resource: Resource,
    action: Action
  ): Promise<boolean> {
    // Zero Trust: Always verify the tenant context
    if (!context.tenantId) {
      throw new SecurityException('Tenant context is missing.');
    }

    // RBAC Check
    const hasRBAC = context.roles.some((role) => {
      const permissions = RolePermissions[role] || [];
      return permissions.some(
        (p) => p.resource === resource && p.action === action
      );
    });

    // ABAC Check
    const policies = await this.policyRepository.findByResourceAction(
      context.tenantId,
      resource,
      action
    );
    
    // Evaluate Policies (ALLOW/DENY logic)
    // Simplified logic: If any DENY, return false. If any ALLOW, return true. If no policies, default to RBAC result.
    let hasABAC = hasRBAC;
    for (const policy of policies) {
        if (policy.effect === 'DENY') {
            hasABAC = false;
        } else if (policy.effect === 'ALLOW') {
            hasABAC = true;
        }
    }

    // Auditing: Log the attempt
    this.auditAttempt(context, resource, action, hasABAC);

    if (!hasABAC) {
      throw new SecurityException(
        `User ${context.userId} lacks permission ${action} on ${resource}`
      );
    }

    return true;
  }

  private auditAttempt(
    context: TenantContext,
    resource: Resource,
    action: Action,
    granted: boolean
  ): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      tenantId: context.tenantId,
      userId: context.userId,
      resource,
      action,
      granted,
      correlationId: crypto.randomUUID(), 
    }));
  }
}
