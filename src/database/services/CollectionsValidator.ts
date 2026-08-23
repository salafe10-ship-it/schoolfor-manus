import { CollectionReceipt, CollectionAllocation, CollectionPaymentMethod, CollectionSourceType } from '../../types';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { CollectionDomainRules, CollectionDomainException } from './CollectionDomainRules';

export class CollectionsValidationError extends Error {
  public errors: Record<string, string>;
  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = 'CollectionsValidationError';
    this.errors = errors;
  }
}

export class CollectionsValidator {

  /**
   * Validates a collection receipt before creation or updating.
   */
  public static validateReceipt(schoolId: string, receipt: Partial<CollectionReceipt>): void {
    FallbackStorage.assertCanonicalPersistence('collection receipt validation source read');
    const errors: Record<string, string> = {};

    if (!receipt.receivableAccountId) {
      errors.receivableAccountId = 'حساب الذمة المدينة مطلوب لعلمية التحصيل.';
    } else {
      const account = FallbackStorage.getReceivableAccounts().find(
        a => a.id === receipt.receivableAccountId && a.schoolId === schoolId
      );
      if (!account) {
        errors.receivableAccountId = 'حساب الذمة المدينة المحدد غير موجود أو ينتمي لمستأجر آخر.';
      } else {
        try {
          CollectionDomainRules.ensureTenantIsolation(schoolId, account.schoolId);
        } catch (err: any) {
          errors.tenantId = err.message;
        }
      }
    }

    if (!receipt.amount || receipt.amount <= 0) {
      errors.amount = 'يجب أن يكون مبلغ التحصيل قيمة موجبة أكبر من الصفر.';
    }

    if (!receipt.currency) {
      errors.currency = 'عملة التحصيل مطلوبة.';
    }

    const validMethods: CollectionPaymentMethod[] = [
      'Cash', 'Bank Transfer', 'Cheque', 'POS', 'Online Payment', 'Wallet', 'Scholarship Offset', 'Credit Balance'
    ];
    if (!receipt.paymentMethod || !validMethods.includes(receipt.paymentMethod)) {
      errors.paymentMethod = `طريقة الدفع المحددة غير صالحة بالنظام.`;
    }

    const validSources: CollectionSourceType[] = [
      'Invoice', 'Installment', 'Receivable', 'Opening Balance', 'Manual Adjustment'
    ];
    if (!receipt.sourceType || !validSources.includes(receipt.sourceType)) {
      errors.sourceType = `مصدر التحصيل المحدد غير صالح.`;
    }

    // Verify references and outstanding limits
    if (receipt.sourceType && receipt.sourceId) {
      if (receipt.sourceType === 'Invoice') {
        const invoice = FallbackStorage.getInvoices().find(i => i.id === receipt.sourceId);
        if (!invoice) {
          errors.sourceId = 'الفاتورة المرجعية المحددة غير موجودة بالنظام.';
        } else {
          try {
            CollectionDomainRules.ensureActiveSource('Invoice', invoice);
            CollectionDomainRules.ensureTenantIsolation(schoolId, invoice.schoolId);
            const outstanding = invoice.remainingAmount !== undefined ? invoice.remainingAmount : invoice.amount;
            if (receipt.amount && outstanding !== undefined) {
              CollectionDomainRules.ensureAmountNotExceedOutstanding(receipt.amount, outstanding);
            }
          } catch (err: any) {
            errors.sourceId = err.message;
          }
        }
      } else if (receipt.sourceType === 'Installment') {
        const sched = FallbackStorage.getInstallmentSchedules().find(s => s.id === receipt.sourceId);
        if (!sched) {
          errors.sourceId = 'جدول القسط المرجعي غير موجود بالنظام.';
        } else {
          const plan = FallbackStorage.getInstallmentPlans().find(p => p.id === sched.planId);
          if (!plan) {
            errors.sourceId = 'خطة التقسيط المرتبطة بالقسط غير موجودة.';
          } else {
            try {
              CollectionDomainRules.ensureActiveSource('Installment', undefined, sched);
              CollectionDomainRules.ensureTenantIsolation(schoolId, plan.schoolId);
              if (receipt.amount) {
                const outstanding = (sched.amount || 0) - (sched.paidAmount || 0);
                CollectionDomainRules.ensureAmountNotExceedOutstanding(receipt.amount, outstanding);
              }
            } catch (err: any) {
              errors.sourceId = err.message;
            }
          }
        }
      } else if (receipt.sourceType === 'Receivable') {
        const account = FallbackStorage.getReceivableAccounts().find(a => a.id === receipt.sourceId);
        if (!account) {
          errors.sourceId = 'حساب الذمة المرجعي المحدد غير موجود بالنظام.';
        } else {
          try {
            CollectionDomainRules.ensureActiveSource('Receivable', undefined, undefined, account);
            CollectionDomainRules.ensureTenantIsolation(schoolId, account.schoolId);
            if (receipt.amount && account.totalOutstanding !== undefined) {
              CollectionDomainRules.ensureAmountNotExceedOutstanding(receipt.amount, account.totalOutstanding);
            }
          } catch (err: any) {
            errors.sourceId = err.message;
          }
        }
      }
    } else if (receipt.sourceType !== 'Opening Balance' && receipt.sourceType !== 'Manual Adjustment') {
      errors.sourceId = 'معرف المستند المرجعي مطلوب للمصدر المالي المحدد.';
    }

    if (Object.keys(errors).length > 0) {
      throw new CollectionsValidationError('فشل التحقق من صحة مستند التحصيل.', errors);
    }
  }

  /**
   * Validates a collection allocation before recording.
   */
  public static validateAllocation(schoolId: string, allocation: Partial<CollectionAllocation>): void {
    FallbackStorage.assertCanonicalPersistence('collection allocation validation source read');
    const errors: Record<string, string> = {};

    if (!allocation.collectionId) {
      errors.collectionId = 'معرف مستند التحصيل مطلوب للتوزيع.';
    } else {
      const receipt = FallbackStorage.getCollectionReceipts().find(
        r => r.id === allocation.collectionId && r.schoolId === schoolId
      );
      if (!receipt) {
        errors.collectionId = 'مستند التحصيل غير موجود أو ينتمي لمستأجر آخر.';
      }
    }

    if (!allocation.amountAllocated || allocation.amountAllocated <= 0) {
      errors.amountAllocated = 'مبلغ التوزيع يجب أن يكون قيمة موجبة أكبر من الصفر.';
    }

    if (!allocation.targetType || !['Invoice', 'Installment', 'Receivable'].includes(allocation.targetType)) {
      errors.targetType = 'نوع المستند المستهدف بالتوزيع غير صالح.';
    }

    if (!allocation.targetId) {
      errors.targetId = 'معرف المستند المستهدف مطلوب.';
    } else {
      if (allocation.targetType === 'Invoice') {
        const inv = FallbackStorage.getInvoices().find(i => i.id === allocation.targetId && i.schoolId === schoolId);
        if (!inv) {
          errors.targetId = 'الفاتورة المستهدفة غير موجودة.';
        }
      } else if (allocation.targetType === 'Installment') {
        const sched = FallbackStorage.getInstallmentSchedules().find(s => s.id === allocation.targetId);
        if (!sched) {
          errors.targetId = 'القسط المستهدف غير موجود.';
        } else {
          const plan = FallbackStorage.getInstallmentPlans().find(p => p.id === sched.planId && p.schoolId === schoolId);
          if (!plan) {
            errors.targetId = 'خطة التقسيط المرتبطة بالقسط غير موجودة أو تنتمي لمستأجر آخر.';
          }
        }
      } else if (allocation.targetType === 'Receivable') {
        const acc = FallbackStorage.getReceivableAccounts().find(a => a.id === allocation.targetId && a.schoolId === schoolId);
        if (!acc) {
          errors.targetId = 'حساب الذمة المستهدف غير موجود.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new CollectionsValidationError('فشل التحقق من صحة توزيع التحصيل.', errors);
    }
  }
}
