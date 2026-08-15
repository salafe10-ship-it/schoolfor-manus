/**
 * Enterprise Reporting Domain
 */

export type ReportType = 'operational' | 'analytical' | 'executive' | 'financial' | 'academic' | 'administrative' | 'statistical' | 'regulatory' | 'audit';

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in';
  value: any;
}

export interface ReportDefinition {
  id: string;
  title: string;
  type: ReportType;
  dataSource: string; // Identifier for the data provider
  version: number;
}

export interface ReportResult {
  reportId: string;
  data: any[];
  generatedAt: string;
}
