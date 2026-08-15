import { FeeStructureEngine } from '../../database/services/FeeStructureEngine';
import { FinancialClosingEngine } from '../../database/services/FinancialClosingEngine';
import { EnterpriseLogger } from '../../database/services/EnterpriseLogger';
import { BusinessRuleError } from '../../utils/errors';

export class FinancialClosingDomainService {
  /**
   * Generates student academic fees based on their structural templates and rules.
   */
  public static async GenerateStudentFees(
    schoolId: string,
    studentId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: GenerateStudentFees', 'FinancialClosingDomainService', { schoolId, studentId, operatorId });

    if (!studentId) {
      throw new BusinessRuleError('لا يمكن توليد الرسوم دون تحديد الطالب.');
    }

    try {
      const invoices = await FeeStructureEngine.generateInvoicesForStudent(
        schoolId,
        studentId,
        operatorId,
        operatorName,
        operatorRole,
        ipAddress
      );

      return {
        success: true,
        studentId,
        generatedCount: invoices.length,
        invoices: invoices.map(inv => ({
          id: inv.id,
          amount: inv.amount,
          status: inv.status,
          item: inv.item
        }))
      };
    } catch (error: any) {
      EnterpriseLogger.error('Failed to generate student fees:', 'FinancialClosingDomainService', { error });
      throw new BusinessRuleError(`فشلت عملية توليد الرسوم: ${error.message || error}`);
    }
  }

  /**
   * Closes an accounting period to prevent back-dated postings and ensure strict integrity.
   */
  public static async CloseAccountingPeriod(
    schoolId: string,
    periodId: string,
    operator: string
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: CloseAccountingPeriod', 'FinancialClosingDomainService', { schoolId, periodId, operator });

    if (!periodId) {
      throw new BusinessRuleError('لا يمكن إغلاق الفترة المالية دون تحديد معرف الفترة.');
    }

    try {
      const result = await FinancialClosingEngine.closeMonthlyPeriodWorkflow(
        schoolId,
        periodId,
        {
          userId: operator,
          userName: operator,
          userRole: 'admin',
          ipAddress: '127.0.0.1'
        }
      );

      return {
        success: result.status === 'success',
        periodId,
        operator,
        closingDate: result.executedAt,
        details: result.details
      };
    } catch (error: any) {
      EnterpriseLogger.error('Accounting period closing failed:', 'FinancialClosingDomainService', { error });
      throw new BusinessRuleError(`فشلت عملية إغلاق الفترة المالية: ${error.message || error}`);
    }
  }
}
