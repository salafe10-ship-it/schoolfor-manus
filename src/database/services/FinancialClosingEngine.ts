import { AccountingPeriod, FiscalYear } from '../../types';
import { ClosingAuditLog } from '../repositories/FinancialClosingTypes';
import { FinancialClosingPolicyService } from './FinancialClosingPolicyService';
import { FinancialClosingDomainRules } from './FinancialClosingDomainRules';
import { FinancialCloseService } from './FinancialCloseService';
import { FinancialClosingValidator } from './FinancialClosingValidator';
import { FinancialClosingRepository } from '../repositories/FinancialClosingRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { FinancialClosingTelemetry } from './FinancialClosingTelemetry';

export class FinancialClosingEngine {
  private static activeLocks = new Set<string>();

  /**
   * Helper to detect if the current environment is running under production mode.
   */
  private static isProductionEnvironment(): boolean {
    const nodeEnv = typeof process !== 'undefined' && process.env?.NODE_ENV;
    const isNodeProd = nodeEnv === 'production';
    
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    return isNodeProd || (typeof window !== 'undefined' && !isLocalHost);
  }

  /**
   * Helper to capture database snapshots for local memory rollback simulation (Atomic Integrity)
   */
  private static createTransactionSnapshot(): { periods: string; years: string } {
    FallbackStorage.assertCanonicalPersistence('financial closing local transaction snapshot');
    return {
      periods: JSON.stringify(FallbackStorage.getAccountingPeriods()),
      years: JSON.stringify(FallbackStorage.getFiscalYears())
    };
  }

  /**
   * Helper to restore state on transaction failure (Rollback)
   */
  private static rollbackTransaction(snapshot: { periods: string; years: string }) {
    FallbackStorage.assertCanonicalPersistence('financial closing local rollback');
    FallbackStorage.saveAccountingPeriods(JSON.parse(snapshot.periods));
    FallbackStorage.saveFiscalYears(JSON.parse(snapshot.years));
  }

  /**
   * Orchestrates the Monthly Period Close workflow.
   * This coordinates validator checks, policy lookup, domain rule enforcement, technical execution, and result building.
   */
  public static async closeMonthlyPeriodWorkflow(
    schoolId: string,
    periodId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    const lockKey = `${schoolId}:period:${periodId}`;
    if (FinancialClosingEngine.activeLocks.has(lockKey)) {
      throw new Error(`عملية الإقفال المالي للفترة ${periodId} قيد التنفيذ حالياً من قبل مستخدم آخر لمنع تعارض البيانات (Race Conditions).`);
    }
    FinancialClosingEngine.activeLocks.add(lockKey);

    const startTime = Date.now();
    const correlationId = FinancialClosingTelemetry.generateCorrelationId();
    const isProd = FinancialClosingEngine.isProductionEnvironment();
    const snapshot = isProd ? null : FinancialClosingEngine.createTransactionSnapshot();

    let period: AccountingPeriod | null = null;
    try {
      // 1. Retrieve the target accounting period through the Repository
      period = await FinancialClosingRepository.getPeriodById(schoolId, periodId);
      if (!period) {
        throw new Error(`الفترة المالية المحددة غير موجودة: ${periodId}`);
      }

      // [Idempotency Enforcement]
      if (period.status === 'closed') {
        const logs = await FinancialClosingRepository.getClosingLogs(schoolId);
        const existingLog = logs.find(l => l.periodId === periodId && l.status === 'success' && l.closingType === 'monthly');
        if (existingLog) {
          FinancialClosingTelemetry.logExecution(correlationId, schoolId, periodId, 'monthly', startTime, 'success', operator);
          return existingLog;
        }
      }

      // 2. Fetch required technical data from the Repository (strictly the single source of truth)
      const allEntries = await FinancialClosingRepository.getJournalEntries(schoolId);
      const glLines = await FinancialClosingRepository.getGeneralLedgerLines(schoolId);

      // 3. Compile technical facts using the Validator (which has zero business decision logic)
      const validation = await FinancialClosingValidator.validatePeriodClosing(schoolId, period, allEntries, glLines);

      // 4. Fetch the operational closing policy
      const policy = await FinancialClosingPolicyService.getClosingPolicy(schoolId);

      // 5. Apply Domain/Business rules
      FinancialClosingDomainRules.verifyPeriodOwnership(period, schoolId);
      FinancialClosingDomainRules.verifyPeriodNotClosed(period);
      FinancialClosingDomainRules.verifyNoUnpostedEntries(validation.unpostedCount);
      FinancialClosingDomainRules.verifyNoUnbalancedEntries(validation.unbalancedCount);
      
      if (policy.strictTrialBalanceMatch) {
        FinancialClosingDomainRules.verifyLedgerTotals(validation.discrepancyAmount);
      }

      const elapsedTimeMs = Date.now() - startTime;

      // 6. Generate audited Closing Audit Log
      const result = this.generateClosingResult(schoolId, period, 'monthly', validation, operator, elapsedTimeMs);

      // 7. Delegate physical database update & logging execution to the Executive Service
      await FinancialCloseService.executeMonthlyClose(schoolId, period, result.log, operator);

      // Record telemetry success log
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, periodId, 'monthly', startTime, 'success', operator);

      return result.log;
    } catch (error: any) {
      // Record telemetry failed log (and classify error automatically)
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, periodId, 'monthly', startTime, 'failed', operator, error);

      const elapsedTimeMs = Date.now() - startTime;

      // Generate failed audit record
      const failedLog = FinancialClosingEngine.generateFailedClosingResult(
        schoolId,
        periodId,
        period?.periodName || 'Unknown Period',
        'monthly',
        error.message || 'Internal database close error',
        elapsedTimeMs,
        operator
      );

      try {
        await FinancialClosingRepository.saveClosingLog(schoolId, failedLog);
      } catch (saveErr) {
        // Handled silently to preserve clean output logs
      }

      if (!isProd && snapshot) {
        FinancialClosingEngine.rollbackTransaction(snapshot);
      }
      throw error;
    } finally {
      FinancialClosingEngine.activeLocks.delete(lockKey);
    }
  }

  /**
   * Orchestrates the Quarterly Close workflow with full atomic scope.
   */
  public static async closeQuarterPeriodWorkflow(
    schoolId: string,
    fiscalYearId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog[]> {
    const lockKey = `${schoolId}:quarter:${fiscalYearId}:${quarter}`;
    if (FinancialClosingEngine.activeLocks.has(lockKey)) {
      throw new Error(`عملية إقفال الربع المالي ${quarter} قيد التنفيذ حالياً لمنع تعارض البيانات.`);
    }
    FinancialClosingEngine.activeLocks.add(lockKey);

    const startTime = Date.now();
    const correlationId = FinancialClosingTelemetry.generateCorrelationId();
    const isProd = FinancialClosingEngine.isProductionEnvironment();
    const snapshot = isProd ? null : FinancialClosingEngine.createTransactionSnapshot();

    try {
      // 1. Resolve quarter periods from Repository
      const quarterPeriods = await FinancialClosingRepository.getQuarterPeriods(schoolId, fiscalYearId);
      const targetQuarter = quarterPeriods.find(q => q.quarter === quarter);
      if (!targetQuarter) {
        throw new Error(`الربع المالي المحدد غير موجود للسنة المالية: ${fiscalYearId}`);
      }

      const results: ClosingAuditLog[] = [];

      // 2. Close each open period sequentially
      for (const period of targetQuarter.periods) {
        if (period.status === 'open') {
          const log = await this.closeMonthlyPeriodWorkflow(schoolId, period.id, operator);
          results.push(log);
        } else {
          // If already closed, attempt to grab its existing success log for idempotency output
          const logs = await FinancialClosingRepository.getClosingLogs(schoolId);
          const matchedLog = logs.find(l => l.periodId === period.id && l.status === 'success' && l.closingType === 'monthly');
          if (matchedLog) {
            results.push(matchedLog);
          }
        }
      }

      // Record successful quarter closing telemetry
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, `quarter_${quarter}`, 'quarterly', startTime, 'success', operator);

      return results;
    } catch (error: any) {
      // Record failed quarter closing telemetry
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, `quarter_${quarter}`, 'quarterly', startTime, 'failed', operator, error);

      const elapsedTimeMs = Date.now() - startTime;

      const failedLog = FinancialClosingEngine.generateFailedClosingResult(
        schoolId,
        `quarter_${quarter}`,
        `Quarter ${quarter}`,
        'quarterly',
        error.message || 'Internal database quarterly close error',
        elapsedTimeMs,
        operator
      );

      try {
        await FinancialClosingRepository.saveClosingLog(schoolId, failedLog);
      } catch (saveErr) {
        // Handled silently
      }

      if (!isProd && snapshot) {
        FinancialClosingEngine.rollbackTransaction(snapshot);
      }
      throw error;
    } finally {
      FinancialClosingEngine.activeLocks.delete(lockKey);
    }
  }

  /**
   * Orchestrates the Fiscal Year-End Close workflow.
   */
  public static async closeFiscalYearWorkflow(
    schoolId: string,
    fromYearId: string,
    toYearId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    const lockKey = `${schoolId}:year:${fromYearId}`;
    if (FinancialClosingEngine.activeLocks.has(lockKey)) {
      throw new Error(`عملية إقفال السنة المالية ${fromYearId} قيد التنفيذ حالياً لمنع تعارض البيانات.`);
    }
    FinancialClosingEngine.activeLocks.add(lockKey);

    const startTime = Date.now();
    const correlationId = FinancialClosingTelemetry.generateCorrelationId();
    const isProd = FinancialClosingEngine.isProductionEnvironment();
    const snapshot = isProd ? null : FinancialClosingEngine.createTransactionSnapshot();

    let fromYear: FiscalYear | null = null;
    try {
      // 1. Fetch fiscal year from Repository
      fromYear = await FinancialClosingRepository.getFiscalYearById(schoolId, fromYearId);
      if (!fromYear) {
        throw new Error(`السنة المالية المصدر المراد إغلاقها غير موجودة: ${fromYearId}`);
      }

      // [Idempotency Enforcement]
      if (fromYear.status === 'closed') {
        const logs = await FinancialClosingRepository.getClosingLogs(schoolId);
        const existingLog = logs.find(l => l.periodId === `ap_year_${fromYearId}` && l.status === 'success' && l.closingType === 'yearly');
        if (existingLog) {
          FinancialClosingTelemetry.logExecution(correlationId, schoolId, `year_${fromYearId}`, 'yearly', startTime, 'success', operator);
          return existingLog;
        }
      }

      // 2. Retrieve all monthly periods belonging to the source year from Repository
      const periods = await FinancialClosingRepository.getPeriodsForSchool(schoolId);
      const yearPeriods = periods.filter(p => p.fiscalYearId === fromYearId);

      // 3. Compile technical validator data
      const validation = await FinancialClosingValidator.validateFiscalYearClosing(schoolId, yearPeriods);

      // 4. Apply Domain/Business rules
      FinancialClosingDomainRules.verifyFiscalYearNotClosed(fromYear.status);
      FinancialClosingDomainRules.verifyNoOpenPeriodsInYear(validation.openPeriodsCount, validation.openPeriodNames);

      // 5. Create simulated period structure for yearly log
      const fakePeriod: AccountingPeriod = {
        id: `ap_year_${fromYear.id}`,
        fiscalYearId: fromYear.id,
        periodName: fromYear.yearName,
        periodNumber: 13,
        startDate: fromYear.startDate,
        endDate: fromYear.endDate,
        status: 'closed',
        schoolId
      };

      const elapsedTimeMs = Date.now() - startTime;

      const result = this.generateClosingResult(
        schoolId,
        fakePeriod,
        'yearly',
        { unpostedCount: 0, unbalancedCount: 0, discrepancyAmount: 0 },
        operator,
        elapsedTimeMs
      );

      // 6. Delegate physical database balance transfers, year status update & logging execution
      await FinancialCloseService.executeFiscalYearClose(schoolId, fromYear, toYearId, result.log, operator);

      // Record successful yearly closing telemetry
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, `year_${fromYearId}`, 'yearly', startTime, 'success', operator);

      return result.log;
    } catch (error: any) {
      // Record failed yearly closing telemetry
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, `year_${fromYearId}`, 'yearly', startTime, 'failed', operator, error);

      const elapsedTimeMs = Date.now() - startTime;

      const failedLog = FinancialClosingEngine.generateFailedClosingResult(
        schoolId,
        `year_${fromYearId}`,
        fromYear?.yearName || 'Unknown Year',
        'yearly',
        error.message || 'Internal database fiscal year close error',
        elapsedTimeMs,
        operator
      );

      try {
        await FinancialClosingRepository.saveClosingLog(schoolId, failedLog);
      } catch (saveErr) {
        // Handled silently
      }

      if (!isProd && snapshot) {
        FinancialClosingEngine.rollbackTransaction(snapshot);
      }
      throw error;
    } finally {
      FinancialClosingEngine.activeLocks.delete(lockKey);
    }
  }

  /**
   * Orchestrates the Reopen Period workflow.
   */
  public static async reopenPeriodWorkflow(
    schoolId: string,
    periodId: string,
    reason: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    const lockKey = `${schoolId}:reopen:${periodId}`;
    if (FinancialClosingEngine.activeLocks.has(lockKey)) {
      throw new Error(`عملية إعادة فتح الفترة المالية ${periodId} قيد التنفيذ حالياً لمنع تعارض البيانات.`);
    }
    FinancialClosingEngine.activeLocks.add(lockKey);

    const startTime = Date.now();
    const correlationId = FinancialClosingTelemetry.generateCorrelationId();
    const isProd = FinancialClosingEngine.isProductionEnvironment();
    const snapshot = isProd ? null : FinancialClosingEngine.createTransactionSnapshot();

    let period: AccountingPeriod | null = null;
    try {
      // 1. Fetch period from Repository
      period = await FinancialClosingRepository.getPeriodById(schoolId, periodId);
      if (!period) {
        throw new Error(`الفترة المالية غير موجودة: ${periodId}`);
      }

      // [Idempotency Enforcement]
      if (period.status === 'open') {
        const logs = await FinancialClosingRepository.getClosingLogs(schoolId);
        const existingLog = logs.find(l => l.periodId === periodId && l.status === 'success' && l.details?.reason === reason);
        if (existingLog) {
          FinancialClosingTelemetry.logExecution(correlationId, schoolId, periodId, 'reopening', startTime, 'success', operator);
          return existingLog;
        }
      }

      // 2. Fetch policy
      const policy = await FinancialClosingPolicyService.getClosingPolicy(schoolId);

      // 3. Compile technical validation facts
      const validation = await FinancialClosingValidator.validatePeriodReopening(schoolId, period, reason);

      // 4. Apply Domain/Business rules
      FinancialClosingDomainRules.verifyPeriodOwnership(period, schoolId);
      FinancialClosingDomainRules.verifyPeriodClosedForReopening(period);
      FinancialClosingDomainRules.verifyReopeningReason(reason, policy.minReasonLength);

      const elapsedTimeMs = Date.now() - startTime;

      // 5. Generate audited Reopening Result Log
      const result = this.generateReopeningResult(schoolId, period, reason, operator, elapsedTimeMs);

      // 6. Delegate physical database status change and logging execution to Executive Service
      await FinancialCloseService.executeReopenPeriod(schoolId, period, reason, result.log, operator);

      // Record successful reopening telemetry
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, periodId, 'reopening', startTime, 'success', operator);

      return result.log;
    } catch (error: any) {
      // Record failed reopening telemetry
      FinancialClosingTelemetry.logExecution(correlationId, schoolId, periodId, 'reopening', startTime, 'failed', operator, error);

      const elapsedTimeMs = Date.now() - startTime;

      const failedLog = FinancialClosingEngine.generateFailedClosingResult(
        schoolId,
        periodId,
        period?.periodName || 'Unknown Period',
        'monthly',
        error.message || 'Internal database reopen error',
        elapsedTimeMs,
        operator
      );

      try {
        await FinancialClosingRepository.saveClosingLog(schoolId, failedLog);
      } catch (saveErr) {
        // Handled silently
      }

      if (!isProd && snapshot) {
        FinancialClosingEngine.rollbackTransaction(snapshot);
      }
      throw error;
    } finally {
      FinancialClosingEngine.activeLocks.delete(lockKey);
    }
  }

  /**
   * Produce the final closing log and status details
   */
  public static generateClosingResult(
    schoolId: string,
    period: AccountingPeriod,
    closingType: 'monthly' | 'quarterly' | 'yearly',
    validation: { unpostedCount: number; unbalancedCount: number; discrepancyAmount: number },
    operator: { userId: string; userName: string; userRole: string; ipAddress: string },
    elapsedTimeMs: number
  ): { status: 'success' | 'failed'; log: ClosingAuditLog; auditReference: string } {
    const auditReference = `AUD-CLOSE-${period.periodName}-${Date.now().toString().slice(-6)}`;
    const logId = `log_close_${period.id}_${Date.now()}`;

    const log: ClosingAuditLog = {
      id: logId,
      schoolId,
      periodId: period.id,
      periodName: period.periodName,
      closingType,
      executedBy: {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress
      },
      executedAt: new Date().toISOString(),
      status: 'success',
      auditReference,
      details: {
        unpostedCount: validation.unpostedCount,
        unbalancedCount: validation.unbalancedCount,
        discrepancyAmount: validation.discrepancyAmount,
        elapsedTimeMs
      }
    };

    return {
      status: 'success',
      log,
      auditReference
    };
  }

  /**
   * Produce the final reopening log and status details
   */
  public static generateReopeningResult(
    schoolId: string,
    period: AccountingPeriod,
    reason: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string },
    elapsedTimeMs: number
  ): { log: ClosingAuditLog; auditReference: string } {
    const auditReference = `AUD-REOPEN-${period.periodName}-${Date.now().toString().slice(-6)}`;
    const logId = `log_reopen_${period.id}_${Date.now()}`;

    const log: ClosingAuditLog = {
      id: logId,
      schoolId,
      periodId: period.id,
      periodName: period.periodName,
      closingType: 'monthly',
      executedBy: {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress
      },
      executedAt: new Date().toISOString(),
      status: 'success',
      auditReference,
      details: {
        reason,
        elapsedTimeMs
      }
    };

    return {
      log,
      auditReference
    };
  }

  /**
   * Produce a failed closing log for audit tracking
   */
  public static generateFailedClosingResult(
    schoolId: string,
    periodId: string,
    periodName: string,
    closingType: 'monthly' | 'quarterly' | 'yearly',
    errorMessage: string,
    elapsedTimeMs: number,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): ClosingAuditLog {
    return {
      id: `log_fail_${periodId}_${Date.now()}`,
      schoolId,
      periodId,
      periodName,
      closingType,
      executedBy: {
        userId: operator.userId,
        userName: operator.userName,
        userRole: operator.userRole,
        ipAddress: operator.ipAddress
      },
      executedAt: new Date().toISOString(),
      status: 'failed',
      auditReference: `AUD-FAIL-${periodId}-${Date.now().toString().slice(-6)}`,
      details: {
        reason: errorMessage,
        errors: [errorMessage],
        elapsedTimeMs
      }
    };
  }
}
