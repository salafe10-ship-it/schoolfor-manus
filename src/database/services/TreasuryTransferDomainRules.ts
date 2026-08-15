import { TreasuryAccount, TreasuryTransfer, FiscalYear } from '../../types';
import { FiscalYearRepository } from '../repositories/FiscalYearRepository';
import { TreasuryTransferRepository } from '../repositories/TreasuryTransferRepository';

/**
 * Enterprise Treasury Transfer Domain Rules
 * Serves as the ultimate SINGLE SOURCE OF TRUTH for transfer domain constraints.
 * Throws clean Arabic domain exceptions (Errors) upon any business violation.
 */
export class TreasuryTransferDomainRules {

  /**
   * Validates a transfer request against all core treasury domain rules.
   */
  public static async validateNewTransfer(
    schoolId: string,
    transfer: Partial<TreasuryTransfer>,
    sourceAccount: TreasuryAccount,
    destinationAccount: TreasuryAccount
  ): Promise<void> {
    
    // 1. Basic integrity checks
    if (!transfer.amount || transfer.amount <= 0) {
      throw new Error('فشل التحويل: يجب أن يكون مبلغ التحويل أكبر من الصفر.');
    }

    if (sourceAccount.id === destinationAccount.id) {
      throw new Error('فشل التحويل: لا يمكن التحويل بين الحساب ونفسه.');
    }

    // 2. Tenant isolation check (prevent transferring between different schools)
    if (sourceAccount.schoolId !== schoolId || destinationAccount.schoolId !== schoolId) {
      throw new Error('حظر أمني للمستأجر: لا يمكن تنفيذ عمليات تحويل بين مدارس مختلفة.');
    }

    if (sourceAccount.schoolId !== destinationAccount.schoolId) {
      throw new Error('فشل التحويل: يمنع التحويل بين خزائن تابعة لمدارس مختلفة لحفظ التوازن المالي لكل مستأجر.');
    }

    // 3. Status checks: Active chests
    if (!sourceAccount.isActive) {
      throw new Error(`فشل التحويل: حساب الخزينة الصادر [${sourceAccount.name}] غير نشط أو مجمد.`);
    }

    if (!destinationAccount.isActive) {
      throw new Error(`فشل التحويل: حساب الخزينة الوارد [${destinationAccount.name}] غير نشط أو مجمد.`);
    }

    // 4. Insufficient Balance Check
    if (!sourceAccount.allowNegativeBalance && sourceAccount.balance < transfer.amount) {
      throw new Error(
        `فشل التحويل: الرصيد غير كافٍ في الخزينة الصادرة [${sourceAccount.name}]. الرصيد الحالي: ${sourceAccount.balance}، المبلغ المطلوب: ${transfer.amount}.`
      );
    }

    // 5. Currency conversions and Exchange Rates
    const sourceCurrency = sourceAccount.currency;
    const destCurrency = destinationAccount.currency;

    if (sourceCurrency !== destCurrency) {
      const exchangeRate = transfer.exchangeRate || 0;
      if (exchangeRate <= 0) {
        throw new Error(
          `فشل التحويل: يمنع التحويل بين عملتين مختلفتين [${sourceCurrency}] و [${destCurrency}] بدون سعر صرف معتمد وصحيح أكبر من الصفر.`
        );
      }
    } else {
      if (transfer.exchangeRate && transfer.exchangeRate !== 1) {
        throw new Error('فشل التحويل: عند تماثل عملة الخزائن، يجب أن يكون سعر الصرف مساوياً لـ 1.');
      }
    }

    // 6. Fiscal Year Verification
    const transferDate = transfer.transferDate || new Date().toISOString().split('T')[0];
    await this.validateDateInOpenFiscalYear(schoolId, transferDate);
  }

  /**
   * Ensures the transfer is occurring within an open fiscal year.
   */
  public static async validateDateInOpenFiscalYear(schoolId: string, dateStr: string): Promise<void> {
    const fiscalYearRepo = new FiscalYearRepository();
    const openYears = await fiscalYearRepo.getAll(schoolId, { status: 'open' });
    
    if (openYears.length === 0) {
      throw new Error('فشل التحويل: لا توجد أي سنة مالية مفتوحة مسجلة في النظام حالياً.');
    }

    const checkDate = new Date(dateStr);
    const isInOpenYear = openYears.some((fy: FiscalYear) => {
      const start = new Date(fy.startDate);
      const end = new Date(fy.endDate);
      return checkDate >= start && checkDate <= end;
    });

    if (!isInOpenYear) {
      throw new Error(`فشل التحويل: تاريخ العملية [${dateStr}] يقع خارج نطاق السنوات المالية المفتوحة.`);
    }
  }

  /**
   * Asserts that a transfer can be updated or deleted.
   * "منع تعديل أو حذف تحويل تم ترحيله"
   */
  public static validateModification(transfer: TreasuryTransfer): void {
    const restrictedStatuses = ['Posted', 'Reconciled', 'Archived'];
    if (restrictedStatuses.includes(transfer.status)) {
      throw new Error(
        `فشل الإجراء: لا يمكن تعديل أو حذف أو تكرار تحويل في حالة [${transfer.status}] نظراً لترحيله دفترياً أو تسويته مسبقاً.`
      );
    }
  }

  /**
   * Prevents executing a transfer twice (Idempotency check).
   */
  public static validateIdempotency(transfer: TreasuryTransfer): void {
    const executedStatuses = ['Executing', 'Executed', 'Posted', 'Reconciled', 'Archived'];
    if (executedStatuses.includes(transfer.status)) {
      throw new Error(
        `فشل التنفيذ: تم تنفيذ عملية التحويل هذه مسبقاً (معرف التحويل: ${transfer.id}). يمنع التكرار منعاً باتاً لسلامة الحسابات.`
      );
    }
  }
}
