import { CompliancePolicy, ComplianceViolation } from './types';
import { AuditEngine } from '../audit/auditEngine';

export class ComplianceEngine {
  private static policies: CompliancePolicy[] = [];
  private static violations: ComplianceViolation[] = [];

  static registerPolicy(policy: CompliancePolicy) {
    this.policies.push(policy);
  }

  static runComplianceCheck(): ComplianceViolation[] {
    this.violations = [];
    this.policies.forEach(policy => {
      if (!policy.checkFunction()) {
        const violation: ComplianceViolation = {
          id: `viol_${Date.now()}`,
          domain: policy.domain,
          description: `Policy failed: ${policy.description}`,
          severity: 'critical',
          detectedAt: new Date().toISOString()
        };
        this.violations.push(violation);
        
        // Log to central audit
        AuditEngine.log({
            correlationId: `audit_${Date.now()}`,
            tenantId: 'system',
            schoolId: 'system',
            branchId: 'system',
            academicYearId: 'system',
            module: 'compliance',
            operation: 'violation_detected',
            userId: 'system',
            sessionId: 'system',
            reason: violation.description,
            source: 'compliance_engine',
            ipAddress: '0.0.0.0',
            device: 'server'
        });
      }
    });
    return this.violations;
  }
  
  static getViolations(): ComplianceViolation[] {
      return this.violations;
  }
}
