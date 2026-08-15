import { AcademicRevenueRecognitionEngine } from '../../database/services/AcademicRevenueRecognitionEngine';
import { EnterpriseLogger } from '../../database/services/EnterpriseLogger';
import { BusinessRuleError } from '../../utils/errors';

export class RevenueRecognitionDomainService {
  /**
   * Recognizes deferred revenue for an academic period in compliance with revenue policies.
   */
  public static async RecognizeRevenue(
    schoolId: string,
    periodId: string,
    operator: string
  ): Promise<any> {
    EnterpriseLogger.info('Executing Domain Operation: RecognizeRevenue', 'RevenueRecognitionDomainService', { schoolId, periodId, operator });

    if (!periodId) {
      throw new BusinessRuleError('لا يمكن تنفيذ عملية الاعتراف بالإيرادات دون تحديد الفترة الأكاديمية.');
    }

    try {
      // Execute the underlying academic revenue recognition engine
      const totalAmount = await AcademicRevenueRecognitionEngine.recognizePeriod(
        schoolId,
        periodId,
        operator,
        operator
      );
      return {
        success: true,
        periodId,
        operator,
        totalAmount
      };
    } catch (error: any) {
      EnterpriseLogger.error('Revenue recognition domain operation failed:', 'RevenueRecognitionDomainService', { error });
      throw new BusinessRuleError(`فشلت عملية الاعتراف بالإيرادات: ${error.message || error}`);
    }
  }
}
