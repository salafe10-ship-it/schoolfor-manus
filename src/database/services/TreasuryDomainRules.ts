import { TreasuryAccount, TreasuryTransaction, PaymentInstrumentConfig, PaymentInstrumentType } from '../../types';
import { FallbackStorage } from '../repositories/FallbackStorage';

export class TreasuryDomainException extends Error {
  public code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TreasuryDomainException';
    this.code = code;
  }
}

export class TreasuryDomainRules {

  /**
   * 1. Prevent negative balance for a treasury chest/bank account unless allowed by policy
   */
  public static ensureNegativeBalancePolicy(account: TreasuryAccount, amountToDeduct: number): void {
    if (!account.isActive) {
      throw new TreasuryDomainException(
        `الحساب (${account.name}) غير نشط ومغلق حالياً للعمليات المالية.`,
        'ACCOUNT_INACTIVE'
      );
    }
    
    if (account.balance - amountToDeduct < 0) {
      if (!account.allowNegativeBalance) {
        throw new TreasuryDomainException(
          `رصيد حساب الخزينة (${account.name}) غير كافٍ لإجراء هذه العملية النقدية. الرصيد الحالي: ${account.balance} ${account.currency}، والمطلوب سحبه: ${amountToDeduct} ${account.currency}. سياسة الحساب لا تسمح بالرصيد السالب.`,
          'NEGATIVE_BALANCE_NOT_ALLOWED'
        );
      }
    }
  }

  /**
   * 2. Tenant Isolation
   * Strictly prevent inter-tenant transfers between different schools/tenants.
   */
  public static ensureTenantIsolation(sourceSchoolId: string, destinationSchoolId: string): void {
    if (sourceSchoolId !== destinationSchoolId) {
      throw new TreasuryDomainException(
        'خرق قواعد أمن الحوسبة السحابية: يمنع منعاً باتاً التحويل المالي أو إجراء القيود البينية بين مدارس أو مستأجرين مختلفين (Tenant Isolation Bypass Attempt).',
        'TENANT_ISOLATION_VIOLATION'
      );
    }
  }

  /**
   * 3. Prevent using a disabled payment instrument
   */
  public static ensureActivePaymentInstrument(
    instrument: PaymentInstrumentType,
    configs: PaymentInstrumentConfig[]
  ): void {
    const config = configs.find(c => c.instrument === instrument);
    if (!config) {
      throw new TreasuryDomainException(
        `وسيلة الدفع المستخدمة (${instrument}) غير معرّفة بنظام الخزانة والمدفوعات المركزي.`,
        'PAYMENT_INSTRUMENT_UNDEFINED'
      );
    }
    if (!config.isActive) {
      throw new TreasuryDomainException(
        `وسيلة الدفع المستخدمة (${instrument}) موقوفة مؤقتاً بالسياسات الإدارية ولا يمكن قبول معاملات مالية بها حالياً.`,
        'PAYMENT_INSTRUMENT_DISABLED'
      );
    }
  }

  /**
   * 4. Prevent modifying a transaction that has already been posted or finalized
   */
  public static ensureTransactionImmutability(transaction: TreasuryTransaction): void {
    const immutableStatuses = ['Posted', 'Reconciled', 'Archived', 'Cancelled', 'Reversed'];
    if (immutableStatuses.includes(transaction.status)) {
      throw new TreasuryDomainException(
        `الحظر التنظيمي: حركة الخزينة ذات الرقم (${transaction.id}) في حالة (${transaction.status}) وهي حركة مرحلة نهائياً لا يمكن تعديلها أو التلاعب ببياناتها التاريخية.`,
        'TRANSACTION_IMMUTABILITY_VIOLATION'
      );
    }
  }

  /**
   * 5. Prevent deleting historical treasury transactions
   */
  public static ensureNoHistoricalDeletion(): void {
    throw new TreasuryDomainException(
      'المعايير الدولية للتفتيش والرقابة المالية (IFRS): يمنع منعاً باتاً حذف أو شطب أي حركة خزينة أو حركة نقدية تاريخية تم قيدها بالنظام. يتوجب إجراء حركة عكسية مقابلة لتصحيح الأخطاء.',
      'DELETION_FORBIDDEN'
    );
  }

  /**
   * 6. Prevent execution outside an open fiscal year
   */
  public static ensureOpenFiscalYear(schoolId: string, dateStr: string): void {
    const date = new Date(dateStr);
    const fiscalYears = FallbackStorage.getFiscalYears().filter(fy => fy.schoolId === schoolId);

    const enclosingYear = fiscalYears.find(fy => {
      const start = new Date(fy.startDate);
      const end = new Date(fy.endDate);
      return date >= start && date <= end;
    });

    if (!enclosingYear) {
      throw new TreasuryDomainException(
        `العملية مرفوضة: تاريخ العملية (${dateStr}) لا يقع ضمن نطاق أي سنة مالية معرّفة بنظام المدرسة الحالي.`,
        'FISCAL_YEAR_NOT_FOUND'
      );
    }

    if (enclosingYear.status === 'closed') {
      throw new TreasuryDomainException(
        `الرقابة المالية والمراجعة: السنة المالية (${enclosingYear.yearName}) مغلقة حالياً. يمنع قيد أي حركات نقدية أو مصرفية خارج السنوات المالية المفتوحة.`,
        'FISCAL_YEAR_CLOSED'
      );
    }
  }
}
