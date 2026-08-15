// src/modules/reporting/domain/ReportDefinition.ts
/**
 * Reporting Foundation.
 * Defines structure for enterprise reports.
 */
export interface ReportDefinition {
  id: string;
  name: string;
  query: string;
  format: 'PDF' | 'EXCEL' | 'JSON';
  schedule?: string; // Cron expression
}
