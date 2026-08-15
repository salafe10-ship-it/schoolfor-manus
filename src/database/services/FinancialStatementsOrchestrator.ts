import { FinancialPeriodService } from './FinancialPeriodService';
import { FinancialCloseService } from './FinancialCloseService';
import { FinancialSnapshotService } from './FinancialSnapshotService';
import { FinancialStatementsEngine } from './FinancialStatementsEngine';
import { FinancialStatementsValidator } from './FinancialStatementsValidator';
import { FinancialReportingEngine } from './FinancialReportingEngine';
import { FinancialStatementsRepository, FinancialStatementsSet } from '../repositories/FinancialStatementsRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { JournalRepository } from '../repositories/JournalRepository';

export class FinancialStatementsOrchestrator {

  /**
   * Generates, validates, and stores a comprehensive set of financial statements
   */
  public static async generateStatementSet(
    schoolId: string,
    periodId: string,
    generatedBy: string,
    requestSchoolId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<FinancialStatementsSet> {

    // 1. Resolve Period using FinancialPeriodService
    const periods = await FinancialPeriodService.getPeriodsForSchool(schoolId);
    const period = periods.find(p => p.id === periodId);
    if (!period) {
      throw new Error(`الفترة المالية المطلوبة غير موجودة: ${periodId}`);
    }

    // 2. Validate Access using FinancialCloseService Gate
    const access = await FinancialCloseService.validateReportingAccess(schoolId, periodId);
    if (!access.allowed) {
      throw new Error(`تعذر استخراج القوائم المالية: ${access.reason}`);
    }

    // 3. Determine Snapshot Usage using FinancialSnapshotService
    let isHistorical = false;
    let snapshotVersion = 0;
    if (period.status === 'closed') {
      isHistorical = true;
      const allSnaps = await FinancialSnapshotService.listSnapshots(schoolId);
      const periodSnaps = allSnaps.filter(s => s.periodId === periodId);
      if (periodSnaps.length > 0) {
        const latestSnapshot = periodSnaps.reduce((max, s) => s.version > max.version ? s : max, periodSnaps[0]);
        snapshotVersion = latestSnapshot.version;
      }
    }

    // 4. Fetch necessary data for Domain Rules Validation
    const journalRepo = new JournalRepository();
    const allEntries = await journalRepo.getAll(schoolId);
    const entries = allEntries.filter(e => {
      const d = new Date(e.date);
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return d >= start && d <= end;
    });

    const trialBalanceReport = await FinancialReportingEngine.generateTrialBalance(schoolId, period.periodName, generatedBy, requestSchoolId);
    const trialBalanceItems = trialBalanceReport.items;

    // 5. Pre-generation validation via FinancialStatementsValidator
    const validation = await FinancialStatementsValidator.validateStatementsRequest(
      schoolId,
      requestSchoolId,
      period.status,
      entries,
      trialBalanceItems,
      snapshotVersion > 0,
      isHistorical
    );

    if (!validation.isValid) {
      throw new Error(`فشل التحقق من قواعد القوائم المالية: ${validation.errors.join(' | ')}`);
    }

    // 6. Generate Statements using FinancialStatementsEngine
    const statementSet = await FinancialStatementsEngine.compileFinancialStatements(
      schoolId,
      periodId,
      period.periodName,
      generatedBy,
      requestSchoolId,
      '1.0.0',
      '1.0.0',
      'STMT_AUDIT_REF_' + Date.now()
    );

    // 7. Save finalized statements to repository
    await FinancialStatementsRepository.saveStatementSet(schoolId, statementSet);

    // 8. Log the activity for compliance
    await AuditRepository.log(
      schoolId,
      operator.userId,
      operator.userName,
      operator.userRole,
      'STATEMENTS_ORCHESTRATION',
      'Financial Statements',
      operator.ipAddress,
      `توليد واعتماد القوائم المالية للمدرسة للفترة المحاسبية: ${period.periodName}`,
      { affectedRecord: periodId, valuesAfter: { statementId: statementSet.id } }
    );

    return statementSet;
  }
}
