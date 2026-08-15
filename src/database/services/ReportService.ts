import { ReportDefinition, ReportExecution, ReportFormat } from '../../types';
import { ReportRepository } from '../repositories/ReportRepository';
import { EnterpriseAuditLogger } from '../../utils/EnterpriseAuditLogger';
import { v4 as uuidv4 } from 'uuid';
import { IoCContainer } from '../IoCContainer';

export class ReportService {
  public static $inject = ['ReportRepository'];

  constructor(private repo: ReportRepository) {}

  private static get repoInstance(): ReportRepository {
    return IoCContainer.getInstance().resolve<ReportRepository>('ReportRepository');
  }

  public static async runReport(reportId: string, parameters: any, format: ReportFormat, userId: string): Promise<ReportExecution> {
    const report = await this.repoInstance.getDefinition(reportId);
    if (!report) throw new Error("Report definition not found");

    const execution: ReportExecution = {
        id: uuidv4(),
        schoolId: report.schoolId,
        reportId: report.id,
        parameters,
        format,
        status: 'completed', // In real system, this might be asynchronous
        executedBy: userId,
        executionDate: new Date().toISOString()
    };

    await this.repoInstance.saveExecution(execution);

    // سجل التدقيق
    await EnterpriseAuditLogger.log(
        'RUN',
        'REPORT',
        execution.id,
        userId,
        `تم تشغيل التقرير: ${report.name}`
    );

    return execution;
  }

  // المزيد من الوظائف: Preview, Print, Export, Schedule
}
