/**
 * Enterprise Compliance Framework
 */

export type ComplianceDomain = 'financial' | 'academic' | 'data' | 'audit' | 'retention' | 'backup' | 'security' | 'operational';

export interface CompliancePolicy {
  id: string;
  domain: ComplianceDomain;
  description: string;
  isRequired: boolean;
  checkFunction: () => boolean; // Simplified
}

export interface ComplianceViolation {
  id: string;
  domain: ComplianceDomain;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  detectedAt: string;
}
