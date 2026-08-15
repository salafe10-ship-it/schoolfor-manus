/**
 * Enterprise Import/Export Framework
 */

export type IOFormat = 'excel' | 'pdf' | 'csv' | 'json' | 'xml';

export interface ImportDefinition {
  id: string;
  entity: string;
  format: IOFormat;
  tenantId: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  previewData?: any[];
}

export interface ExportDefinition {
  id: string;
  entity: string;
  format: IOFormat;
  tenantId: string;
  isEncrypted: boolean;
}
