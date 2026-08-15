import { ReportDefinition, ReportFilter, ReportResult } from './types';
import { AuditEngine } from '../audit/auditEngine';

export class ReportingPipeline {
  private static dataProviders: Map<string, (filters: ReportFilter[]) => Promise<any[]>> = new Map();

  static registerDataProvider(source: string, provider: (filters: ReportFilter[]) => Promise<any[]>) {
    this.dataProviders.set(source, provider);
  }

  static async generateReport(definition: ReportDefinition, filters: ReportFilter[]): Promise<ReportResult> {
    const provider = this.dataProviders.get(definition.dataSource);
    if (!provider) throw new Error(`Data provider ${definition.dataSource} not found.`);

    // 1. Data Fetching (separated from business logic)
    const rawData = await provider(filters);

    // 2. Data Processing (standardized)
    // Here we can apply sorting, grouping, etc.

    const result: ReportResult = {
      reportId: definition.id,
      data: rawData,
      generatedAt: new Date().toISOString()
    };

    // 3. Audit
    AuditEngine.log({
        correlationId: `rep_${Date.now()}`,
        tenantId: 'system',
        schoolId: 'system',
        branchId: 'system',
        academicYearId: 'system',
        module: 'reporting',
        operation: 'generate_report',
        userId: 'system',
        sessionId: 'system',
        reason: `Report ${definition.title} generated`,
        source: 'reporting_engine',
        ipAddress: '0.0.0.0',
        device: 'server'
    });

    return result;
  }
}
