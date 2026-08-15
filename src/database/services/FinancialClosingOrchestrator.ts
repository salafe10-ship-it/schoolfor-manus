import { ClosingAuditLog } from '../repositories/FinancialClosingTypes';
import { FinancialClosingRepository } from '../repositories/FinancialClosingRepository';
import { FinancialClosingEngine } from './FinancialClosingEngine';

export class FinancialClosingOrchestrator {
  /**
   * Receives Monthly Period Close request, maps context, and delegates workflow execution to the Engine.
   * Path: UI -> Orchestrator -> Engine -> Repository -> Storage Strategy -> Database -> Validator -> Domain Rules -> CloseService -> Engine -> Result
   */
  public static async closeMonthlyPeriod(
    schoolId: string,
    periodId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    // 1. Enforce initial parameter validation
    if (!schoolId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف المدرسة [schoolId].');
    if (!periodId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف الفترة المالية [periodId].');
    if (!operator || !operator.userId) throw new Error('مخالفة معايير التشغيل: معلومات المستخدم المنفذ مفقودة.');

    // 2. Delegate entire workflow orchestration to the Closing Engine
    return await FinancialClosingEngine.closeMonthlyPeriodWorkflow(schoolId, periodId, operator);
  }

  /**
   * Receives Quarterly Close request, maps context, and delegates workflow execution to the Engine.
   */
  public static async closeQuarterPeriod(
    schoolId: string,
    fiscalYearId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog[]> {
    // 1. Enforce initial parameter validation
    if (!schoolId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف المدرسة [schoolId].');
    if (!fiscalYearId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف السنة المالية [fiscalYearId].');
    if (!quarter) throw new Error('مخالفة معايير التشغيل: يجب توفير الربع المالي المطلوب إقفاله.');
    if (!operator || !operator.userId) throw new Error('مخالفة معايير التشغيل: معلومات المستخدم المنفذ مفقودة.');

    // 2. Delegate entire workflow orchestration to the Closing Engine
    return await FinancialClosingEngine.closeQuarterPeriodWorkflow(schoolId, fiscalYearId, quarter, operator);
  }

  /**
   * Receives Fiscal Year-End Close request, maps context, and delegates workflow execution to the Engine.
   */
  public static async closeFiscalYear(
    schoolId: string,
    fromYearId: string,
    toYearId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    // 1. Enforce initial parameter validation
    if (!schoolId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف المدرسة [schoolId].');
    if (!fromYearId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف السنة المالية المصدر [fromYearId].');
    if (!toYearId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف السنة المالية الهدف [toYearId].');
    if (!operator || !operator.userId) throw new Error('مخالفة معايير التشغيل: معلومات المستخدم المنفذ مفقودة.');

    // 2. Delegate entire workflow orchestration to the Closing Engine
    return await FinancialClosingEngine.closeFiscalYearWorkflow(schoolId, fromYearId, toYearId, operator);
  }

  /**
   * Receives Reopen Period request, maps context, and delegates workflow execution to the Engine.
   */
  public static async reopenPeriod(
    schoolId: string,
    periodId: string,
    reason: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<ClosingAuditLog> {
    // 1. Enforce initial parameter validation
    if (!schoolId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف المدرسة [schoolId].');
    if (!periodId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف الفترة المالية [periodId].');
    if (!reason || reason.trim() === '') throw new Error('مخالفة معايير التشغيل: يجب تقديم مبرر محاسبي مقبول لإعادة الفتح.');
    if (!operator || !operator.userId) throw new Error('مخالفة معايير التشغيل: معلومات المستخدم المنفذ مفقودة.');

    // 2. Delegate entire workflow orchestration to the Closing Engine
    return await FinancialClosingEngine.reopenPeriodWorkflow(schoolId, periodId, reason, operator);
  }

  /**
   * Retrieve all closing history log entries for auditing from the Repository
   */
  public static async getClosingLogs(schoolId: string): Promise<ClosingAuditLog[]> {
    if (!schoolId) throw new Error('مخالفة معايير التشغيل: يجب توفير معرف المدرسة [schoolId].');
    return await FinancialClosingRepository.getClosingLogs(schoolId);
  }
}
