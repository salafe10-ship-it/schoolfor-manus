import { EnterpriseIdentity, AuthorizationContext } from './types';

export class AuthorizationEngine {
  static evaluateAuthorization(
    identity: EnterpriseIdentity, 
    action: string, 
    resourceType: string, 
    context: AuthorizationContext
  ): boolean {
    if (identity.status !== 'active') return false;

    // 1. Tenant/School/Branch Isolation Check (Implicit rule)
    if (identity.tenantId !== context.tenantId) return false;

    // 2. Policy check (using context evaluation)
    const applicablePolicies = identity.policies.filter(p => 
      p.resourceType === resourceType && 
      p.action === action
    );

    if (applicablePolicies.length === 0) return false;

    return applicablePolicies.some(policy => {
      if (policy.condition) {
        return policy.condition(context);
      }
      return true; // Simple policy match
    });
  }
}
