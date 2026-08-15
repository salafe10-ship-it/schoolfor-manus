import { CollectionReceipt, Invoice, InstallmentSchedule, ReceivableAccount, CollectionStatus } from '../../types';

export class CollectionDomainException extends Error {
  public code: string;
  constructor(message: string, code: string = 'COLLECTION_DOMAIN_VIOLATION') {
    super(message);
    this.name = 'CollectionDomainException';
    this.code = code;
  }
}

/**
 * Enterprise Collection Domain Rules (Phase 2.5)
 * Centralizes all invariants, financial validation guidelines, and strict audit compliance.
 */
export class CollectionDomainRules {

  /**
   * Rule: Prevent collection without an approved financial source reference.
   */
  public static ensureValidReference(sourceId: string | undefined, sourceType: string): void {
    if (!sourceId) {
      throw new CollectionDomainException(
        `مخالفة معمارية: لا يمكن معالجة عملية تحصيل دون مرجع مالي معتمد لـ (${sourceType}).`,
        'REFERENCE_REQUIRED'
      );
    }
  }

  /**
   * Rule: Prevent collection on a cancelled or draft document.
   */
  public static ensureActiveSource(
    sourceType: string,
    invoice?: Invoice,
    installment?: InstallmentSchedule,
    account?: ReceivableAccount
  ): void {
    if (sourceType === 'Invoice' && invoice) {
      if (invoice.status === 'Cancelled' || invoice.status === 'Draft') {
        throw new CollectionDomainException(
          `مخالفة معمارية: يمنع التحصيل على فاتورة ملغاة أو مسودة (الحالة الحالية: ${invoice.status}).`,
          'INVOICE_NOT_ACTIVE'
        );
      }
    } else if (sourceType === 'Installment' && installment) {
      if (installment.status === 'Paid' || installment.status === 'Cancelled') {
        throw new CollectionDomainException(
          `مخالفة معمارية: القسط المطلوب التحصيل عليه إما مدفوع بالكامل أو ملغى (الحالة الحالية: ${installment.status}).`,
          'INSTALLMENT_NOT_ACTIVE'
        );
      }
    } else if (sourceType === 'Receivable' && account) {
      if (account.status === 'Closed' || account.status === 'Archived') {
        throw new CollectionDomainException(
          `حظر دورة حياة الذمم: حساب الذمة مغلق أو مؤرشف تماماً ولا يسمح بإجراء تحصيلات عليه.`,
          'RECEIVABLE_NOT_ACTIVE'
        );
      }
    }
  }

  /**
   * Rule: Prevent collection exceeding outstanding due balance.
   */
  public static ensureAmountNotExceedOutstanding(amount: number, outstanding: number): void {
    if (amount > outstanding) {
      throw new CollectionDomainException(
        `مخالفة محاسبية: لا يسمح بأن يتجاوز مبلغ التحصيل (${amount}) الرصيد المستحق الفعلي على السند المرجعي (${outstanding}).`,
        'AMOUNT_EXCEEDS_OUTSTANDING'
      );
    }
    if (amount <= 0) {
      throw new CollectionDomainException(
        'مخالفة معمارية: لا يمكن تسجيل عملية تحصيل بمبلغ صفري أو سالب.',
        'INVALID_COLLECTION_AMOUNT'
      );
    }
  }

  /**
   * Rule: Prevent collection in a different currency without a conversion rate.
   */
  public static ensureCurrencyAlignment(
    accountCurrency: string,
    receiptCurrency: string,
    exchangeRate?: number
  ): void {
    if (accountCurrency !== receiptCurrency && (!exchangeRate || exchangeRate <= 0)) {
      throw new CollectionDomainException(
        `مخالفة الحدود المالية: العملة المحصلة (${receiptCurrency}) تختلف عن عملة الحساب (${accountCurrency}) دون توفر سياسة أو سعر تحويل صالح.`,
        'CURRENCY_MISMATCH_WITHOUT_RATE'
      );
    }
  }

  /**
   * Rule: Tenant Isolation Security Gate.
   */
  public static ensureTenantIsolation(schoolId: string, targetSchoolId: string): void {
    if (schoolId !== targetSchoolId) {
      throw new CollectionDomainException(
        `خرق أمني للمستأجر: يمنع إجراء عمليات تحصيل عبر مستأجرين مختلفين.`,
        'TENANT_ISOLATION_VIOLATION'
      );
    }
  }

  /**
   * Rule: Deletion of historical collections is strictly prohibited.
   */
  public static ensureNoHistoricalDeletion(): void {
    throw new CollectionDomainException(
      'مخالفة محاسبية (IFRS): يمنع منعاً باتاً حذف أو إزالة أي مستند تحصيل تاريخي مسجل بالنظام. يجب إلغاء أو عكس السند بحركة محاسبية موازية.',
      'COLLECTION_DELETION_FORBIDDEN'
    );
  }

  /**
   * Rule: Prevent modification of posted or reconciled collections.
   */
  public static ensureReceiptImmutability(receipt: CollectionReceipt): void {
    const immutableStatuses: CollectionStatus[] = [
      'Approved',
      'Collected',
      'Partially Allocated',
      'Allocated',
      'Deposited',
      'Reconciled',
      'Archived'
    ];
    if (immutableStatuses.includes(receipt.status)) {
      throw new CollectionDomainException(
        `مخالفة معمارية: لا يمكن تعديل مستند تحصيل (${receipt.id}) تم اعتماده أو ترحيله محاسبياً أو مطابقتة (الحالة الحالية: ${receipt.status}).`,
        'COLLECTION_IMMUTABLE'
      );
    }
  }
}
