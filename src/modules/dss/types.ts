/**
 * Enterprise Decision Support System (DSS) Domain
 */

export interface Insight {
  id: string;
  category: 'financial' | 'academic' | 'operational' | 'risk';
  summary: string;
  recommendation: string;
}

export interface ExecutiveAlert {
  id: string;
  source: string;
  message: string;
  severity: 'critical' | 'warning';
}
