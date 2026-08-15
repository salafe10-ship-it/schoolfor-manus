import { ReceivableAccount, ReceivableTransaction, Invoice, ReceivableStatus } from '../../types';

/**
 * Enterprise Accounts Receivable Domain Exception
 */
export class AccountsReceivableDomainException extends Error {
  public code: string;
  constructor(message: string, code: string = 'AR_DOMAIN_VIOLATION') {
    super(message);
    this.name = 'AccountsReceivableDomainException';
    this.code = code;
  }
}

/**
 * Enterprise Accounts Receivable Domain Rules (Single Source of Truth for Invariants)
 * Enforces rigid financial and architectural constraints for Phase 2.4.5 ERP Audit.
 */
export class AccountsReceivableDomainRules {

  /**
   * Rule: Prevent creating a receivable without a valid, approved reference invoice.
   */
  public static ensureInvoiceIsApproved(invoice: Invoice | null | undefined): void {
    if (!invoice) {
      throw new AccountsReceivableDomainException(
        'مخالفة معمارية: لا يمكن إنشاء ذمة مالية دون فاتورة مرجعية معتمدة وصالحة بالنظام.',
        'INVOICE_NOT_FOUND'
      );
    }
    if (invoice.status === 'Draft' || invoice.status === 'Cancelled') {
      throw new AccountsReceivableDomainException(
        `مخالفة معمارية: لا يمكن قيد ذمة مالية لفاتورة مسودة أو ملغاة (${invoice.status}). يجب أن تكون الفاتورة معتمدة/صادرة.`,
        'INVOICE_NOT_APPROVED'
      );
    }
  }

  /**
   * Rule: Tenant Isolation Security Gate
   * Prevents creating or modifying records across different school/tenant bounds.
   */
  public static ensureTenantIsolation(schoolId: string, targetSchoolId: string): void {
    if (schoolId !== targetSchoolId) {
      throw new AccountsReceivableDomainException(
        `خرق أمني للمستأجر: يمنع إجراء عمليات مالية لجهات تتبع مستأجر آخر (المستأجر الحالي: ${schoolId}، المستأجر المطلوب: ${targetSchoolId}).`,
        'TENANT_ISOLATION_VIOLATION'
      );
    }
  }

  /**
   * Rule: Prevent deletion of historical transactions.
   * Audits must remain immutable to preserve historical trails (IFRS compliance).
   */
  public static ensureNoHistoricalDeletion(): void {
    throw new AccountsReceivableDomainException(
      'مخالفة محاسبية (IFRS): يمنع منعاً باتاً حذف أو إزالة أي حركة مالية تاريخية مسجلة بالنظام. يجب إجراء حركات عكسية بدلاً من الحذف.',
      'HISTORICAL_DELETION_FORBIDDEN'
    );
  }

  /**
   * Rule: Prevent modification of posted journal entries / transactions that impacted the General Ledger.
   */
  public static ensureNoModificationOfPostedTransaction(tx: ReceivableTransaction): void {
    if (tx.status === 'Closed') {
      throw new AccountsReceivableDomainException(
        `مخالفة محاسبية: لا يمكن تعديل أو تلاعب بحركة مالية (${tx.id}) أثرت في الأستاذ العام وتم قيدها كحسابات مغلقة.`,
        'POSTED_TRANSACTION_MODIFICATION_FORBIDDEN'
      );
    }
  }

  /**
   * Rule: Prevent modification of reconciled records.
   */
  public static ensureNoModificationOfReconciledAccount(account: ReceivableAccount): void {
    if (account.reconciliationStatus === 'reconciled') {
      throw new AccountsReceivableDomainException(
        `مخالفة معمارية: لا يمكن تعديل حساب ذمم مدينة (${account.id}) تمت مطابقته بنجاح مع الأستاذ العام وتسويته.`,
        'RECONCILED_RECORD_MODIFICATION_FORBIDDEN'
      );
    }
  }

  /**
   * Rule: Prevent closing the account if its outstanding balance is non-zero.
   */
  public static ensureCloseAllowedOnlyWithZeroBalance(account: ReceivableAccount, targetStatus: ReceivableStatus): void {
    if ((targetStatus === 'Closed' || targetStatus === 'Collected') && (account.totalOutstanding || 0) !== 0) {
      throw new AccountsReceivableDomainException(
        `مخالفة معمارية: لا يمكن إغلاق ذمة مالية أو اعتبارها محصلة بالكامل ورصيدها القائم غير صفري (الرصيد المتبقي: ${account.totalOutstanding}).`,
        'NON_ZERO_BALANCE_CLOSURE_FORBIDDEN'
      );
    }
  }

  /**
   * Rule: Prevent negative outstanding balances unless under approved credit/refund scenarios.
   */
  public static ensureNoNegativeOutstanding(totalOutstanding: number, approvedScenarios: boolean): void {
    if (totalOutstanding < 0 && !approvedScenarios) {
      throw new AccountsReceivableDomainException(
        'مخالفة معمارية: رصيد الذمة المدينة لا يمكن أن يصبح سالباً إلا في الحالات الاستثنائية المعتمدة (مثل حركات الـ Refund أو التسويات المالية المعتمدة).',
        'NEGATIVE_BALANCE_FORBIDDEN'
      );
    }
  }

  /**
   * Rule: Prevent currency or fiscal year context violations.
   */
  public static ensureFiscalYearAndCurrencyBoundary(
    accountCurrency: string,
    txCurrency: string,
    invoiceDate: string,
    fiscalYearStart: string,
    fiscalYearEnd: string
  ): void {
    if (accountCurrency !== txCurrency) {
      throw new AccountsReceivableDomainException(
        `مخالفة الحدود المالية: عدم تطابق العملة بين حساب الذمة المدنية (${accountCurrency}) وحركة المعاملة (${txCurrency}).`,
        'CURRENCY_MISMATCH'
      );
    }

    const date = new Date(invoiceDate);
    const start = new Date(fiscalYearStart);
    const end = new Date(fiscalYearEnd);

    if (date < start || date > end) {
      throw new AccountsReceivableDomainException(
        `مخالفة الحدود المالية: تاريخ المعاملة المرجعي يقع خارج نطاق السنة المالية المعتمدة من (${fiscalYearStart}) إلى (${fiscalYearEnd}).`,
        'FISCAL_YEAR_VIOLATION'
      );
    }
  }

  /**
   * Rule: Prevent Revenue Recognition rules breaks.
   */
  public static ensureRevenueRecognitionNotBroken(recognitionType: string): void {
    const validTypes = ['Amortized', 'Immediate', 'Milestone'];
    if (!validTypes.includes(recognitionType)) {
      throw new AccountsReceivableDomainException(
        `مخالفة معمارية: خرق لقواعد الاعتراف بالإيرادات الأكاديمية (النوع الممرر: ${recognitionType}).`,
        'REVENUE_RECOGNITION_VIOLATION'
      );
    }
  }

  /**
   * Rule: Prevent any modification of the account after it is Archived.
   */
  public static ensureNoModificationAfterArchive(account: ReceivableAccount): void {
    if (account.status === 'Archived') {
      throw new AccountsReceivableDomainException(
        `حظر دورة حياة الذمم: الحساب مؤرشف تماماً ومغلق للتدقيق التاريخي. يمنع تعديل أي من قيمه المالية نهائياً.`,
        'ARCHIVED_ACCOUNT_IMMUTABILITY'
      );
    }
  }
}
