import { FiscalYear, AccountingPeriod, AuditMetadata, JournalEntry } from '../../types';
import { FiscalYearRepository } from '../repositories/FiscalYearRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { FinancialClosingValidator, ClosingValidationData } from './FinancialClosingValidator';
import { FinancialClosingRepository } from '../repositories/FinancialClosingRepository';
import { ClosingAuditLog } from '../repositories/FinancialClosingTypes';
import { FinancialClosingOrchestrator } from './FinancialClosingOrchestrator';
import { UnitOfWork } from '../UnitOfWork';

export interface PreCloseValidationReport {
  isReady: boolean;
  unpostedDraftCount: number;
  unbalancedDraftCount: number;
  discrepancyAmount: number;
  unpostedEntries: JournalEntry[];
  errors: string[];
}

export class FinancialCloseService {
  private static fiscalRepo = new FiscalYearRepository();

  /**
   * PURE EXECUTION: Execute the physical monthly closing.
   * This updates period status in the storage database, saves the audit log, and registers the system audit action.
   */
  public static async executeMonthlyClose(
    schoolId: string,
    period: AccountingPeriod,
    log: ClosingAuditLog,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<void> {
    const metadata = {
      operationName: 'إقفال الفترة المحاسبية الشهرية',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['accounting_periods', 'audit_logs'],
      tenantId: schoolId
    };

    await UnitOfWork.runInTransaction(schoolId, metadata, async () => {
      // 1. Update status in DB
      const success = await FinancialClosingRepository.updatePeriodStatus(schoolId, period.id, 'closed', operator);
      if (!success) {
        throw new Error('فشل تحديث حالة الفترة المالية في قاعدة البيانات.');
      }

      // 2. Save the closing log
      await FinancialClosingRepository.saveClosingLog(schoolId, log);

      // 3. System audit trail logging
      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'CLOSE_PERIOD',
        'FINANCIAL_CLOSE',
        operator.ipAddress,
        `إقفال الفترة المحاسبية الشهرية بنجاح: ${period.periodName}. مرجع التدقيق: ${log.auditReference}`,
        { affectedRecord: period.id }
      );
    });
  }

  /**
   * PURE EXECUTION: Execute the physical fiscal year close.
   */
  public static async executeFiscalYearClose(
    schoolId: string,
    fromYear: FiscalYear,
    toYearId: string,
    log: ClosingAuditLog,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<void> {
    const meta: AuditMetadata = {
      userId: operator.userId,
      userName: operator.userName,
      userRole: operator.userRole,
      ipAddress: operator.ipAddress
    };

    const metadata = {
      operationName: 'إقفال السنة المالية وتدوير الحسابات',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['fiscal_years', 'accounts', 'audit_logs'],
      tenantId: schoolId
    };

    await UnitOfWork.runInTransaction(schoolId, metadata, async () => {
      // 1. Transfer balances via CPA rollover
      await this.fiscalRepo.transferOpeningBalances(schoolId, fromYear.id, toYearId, meta);

      // 2. Mark Year as closed in DB
      fromYear.status = 'closed';
      await this.fiscalRepo.update(schoolId, fromYear.id, { status: 'closed', meta } as any);

      // 3. Save the closing log
      await FinancialClosingRepository.saveClosingLog(schoolId, log);

      // 4. System audit trail logging
      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'CLOSE_YEAR',
        'FINANCIAL_CLOSE',
        operator.ipAddress,
        `إقفال السنة المالية ${fromYear.yearName} بالكامل وتدوير الأرصدة الافتتاحية بنجاح. مرجع التدقيق: ${log.auditReference}`,
        { affectedRecord: fromYear.id }
      );
    });
  }

  /**
   * PURE EXECUTION: Execute physical reopening.
   */
  public static async executeReopenPeriod(
    schoolId: string,
    period: AccountingPeriod,
    reason: string,
    log: ClosingAuditLog,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<void> {
    const metadata = {
      operationName: 'إعادة فتح الفترة المحاسبية الشهرية',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['accounting_periods', 'audit_logs'],
      tenantId: schoolId
    };

    await UnitOfWork.runInTransaction(schoolId, metadata, async () => {
      // 1. Update status in Database
      const success = await FinancialClosingRepository.updatePeriodStatus(schoolId, period.id, 'open', operator);
      if (!success) {
        throw new Error('فشل تحديث حالة الفترة المالية في قاعدة البيانات.');
      }

      // 2. Save the closing log
      await FinancialClosingRepository.saveClosingLog(schoolId, log);

      // 3. System audit trail logging
      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'REOPEN_PERIOD',
        'FINANCIAL_CLOSE',
        operator.ipAddress,
        `إعادة فتح الفترة المحاسبية المغلقة ${period.periodName}. المبرر: ${reason}. مرجع التدقيق: ${log.auditReference}`,
        { affectedRecord: period.id, valuesAfter: { reason } }
      );
    });
  }

  /**
   * Legacy Pre-Close Validation helper used by the UI Dashboard.
   * Leverages the Validator component to compile facts.
   */
  public static async runPreCloseValidation(
    schoolId: string,
    period: AccountingPeriod
  ): Promise<PreCloseValidationReport> {
    const allEntries = await FinancialClosingRepository.getJournalEntries(schoolId);
    const glLines = await FinancialClosingRepository.getGeneralLedgerLines(schoolId);
    
    const validation: ClosingValidationData = await FinancialClosingValidator.validatePeriodClosing(schoolId, period, allEntries, glLines);
    
    const unposted = allEntries.filter(e => {
      const d = new Date(e.date);
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return d >= start && d <= end && e.status === 'draft';
    });

    const errors: string[] = [];
    if (validation.unpostedCount > 0) {
      errors.push(`يمنع إغلاق الفترة المالية نظراً لوجود عدد (${validation.unpostedCount}) قيود معلقة بالحالة مسودة.`);
    }
    if (validation.unbalancedCount > 0) {
      errors.push(`يمنع إغلاق الفترة المالية نظراً لوجود عدد (${validation.unbalancedCount}) قيود غير متوازنة محاسبياً.`);
    }
    if (validation.discrepancyAmount > 0.01) {
      errors.push(`يمنع إغلاق الفترة لوجود فروقات ترحيل غير متوازنة في ميزان المراجعة بقيمة: ${validation.discrepancyAmount}`);
    }

    return {
      isReady: errors.length === 0,
      unpostedDraftCount: validation.unpostedCount,
      unbalancedDraftCount: validation.unbalancedCount,
      discrepancyAmount: validation.discrepancyAmount,
      unpostedEntries: unposted,
      errors
    };
  }

  /**
   * Technical access control check for historical financial reporting
   */
  public static async validateReportingAccess(
    schoolId: string,
    periodId: string,
    requireSnapshot: boolean = false
  ): Promise<{ allowed: boolean; reason?: string }> {
    const periods = await FinancialClosingRepository.getPeriodsForSchool(schoolId);
    const period = periods.find(p => p.id === periodId);

    if (!period) {
      return { allowed: false, reason: 'الفترة المالية غير موجودة.' };
    }

    if (period.status === 'closed') {
      if (requireSnapshot) {
         return { allowed: true };
      }
      return { allowed: false, reason: 'الفترة المالية مغلقة. يرجى استخدام لقطة مالية (Snapshot) لاستخراج التقارير التاريخية.' };
    }

    return { allowed: true };
  }

  // --- BACKWARDS COMPATIBILITY FORWARDS TO ORCHESTRATOR ---

  public static async closeMonthlyPeriodEnterprise(
    schoolId: string,
    period: AccountingPeriod,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    return await FinancialClosingOrchestrator.closeMonthlyPeriod(schoolId, period.id, operator);
  }

  public static async closeFiscalYearEnterprise(
    schoolId: string,
    fromYear: FiscalYear,
    toYearId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    return await FinancialClosingOrchestrator.closeFiscalYear(schoolId, fromYear.id, toYearId, operator);
  }

  public static async reopenPeriodEnterprise(
    schoolId: string,
    period: AccountingPeriod,
    reason: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    return await FinancialClosingOrchestrator.reopenPeriod(schoolId, period.id, reason, operator);
  }

  public static async closeMonthlyPeriod(
    schoolId: string,
    periodId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<boolean> {
    const log = await FinancialClosingOrchestrator.closeMonthlyPeriod(schoolId, periodId, operator);
    return log.status === 'success';
  }

  public static async closeQuarterPeriod(
    schoolId: string,
    fiscalYearId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<void> {
    await FinancialClosingOrchestrator.closeQuarterPeriod(schoolId, fiscalYearId, quarter, operator);
  }

  public static async closeFiscalYear(
    schoolId: string,
    fromYearId: string,
    toYearId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<void> {
    await FinancialClosingOrchestrator.closeFiscalYear(schoolId, fromYearId, toYearId, operator);
  }

  public static async reopenPeriod(
    schoolId: string,
    periodId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string },
    reason: string
  ): Promise<boolean> {
    const log = await FinancialClosingOrchestrator.reopenPeriod(schoolId, periodId, reason, operator);
    return log.status === 'success';
  }
}
