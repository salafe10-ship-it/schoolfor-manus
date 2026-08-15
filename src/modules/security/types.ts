/**
 * Enterprise Security Framework
 */

export interface SecurityThreat {
  id: string;
  category: 'SQLi' | 'XSS' | 'CSRF' | 'Auth' | 'File' | 'Data';
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitigationStatus: 'verified' | 'remediated' | 'monitoring';
}
