import { ReceivableAccount, ReceivableTransaction, ReceivableStatus } from '../../types';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { ReceivableStateMachine } from './ReceivableStateMachine';
import { AccountsReceivableDomainRules, AccountsReceivableDomainException } from './ReceivableDomainRules';

export class AccountsReceivableValidationError extends Error {
  public errors: Record<string, string>;
  constructor(message: string, errors: Record<string, string> = {}) {
    super(message);
    this.name = 'AccountsReceivableValidationError';
    this.errors = errors;
  }
}

/**
 * Enterprise Accounts Receivable Validator
 * Validates domain rules, state transitions, and business mandates for the subledger.
 */
export class AccountsReceivableValidator {

  /**
   * Validates state transitions for Accounts Receivable account or transaction.
   */
  public static validateStateTransition(fromStatus: ReceivableStatus, toStatus: ReceivableStatus): void {
    ReceivableStateMachine.validateTransition(fromStatus, toStatus);
  }

  /**
   * Validates a ReceivableAccount before insertion or update.
   */
  public static validateAccount(account: Partial<ReceivableAccount>, schoolId: string): void {
    FallbackStorage.assertCanonicalPersistence('receivable account validation reads');
    const errors: Record<string, string> = {};

    if (!account.studentId) {
      errors.studentId = "معرف الطالب مطلوب لربط حساب الذمم المدنية.";
    } else {
      const student = FallbackStorage.getStudents().find(s => s.id === account.studentId);
      if (!student) {
        errors.studentId = "مخالفة: الطالب المحدد غير موجود في قاعدة بيانات الطلاب.";
      } else {
        if (student.schoolId !== schoolId) {
          errors.studentId = "خرق أمني للمستأجر: الطالب المحدد ينتمي لمستأجر آخر.";
        }
        if (student.status === 'inactive' || student.status === 'dismissed') {
          errors.studentId = "مخالفة: لا يمكن فتح حساب ذمم مدينة لطالب غير نشط أو مفصول.";
        }
      }
    }

    if (!account.accountNumber) {
      errors.accountNumber = "رقم حساب الذمم المدنية مطلوب.";
    }

    if (account.totalBilled !== undefined && account.totalBilled < 0) {
      errors.totalBilled = "إجمالي المبالغ المفوترة لا يمكن أن يكون سالباً.";
    }

    if (account.totalPaid !== undefined && account.totalPaid < 0) {
      errors.totalPaid = "إجمالي التحصيلات لا يمكن أن يكون سالباً.";
    }

    // Invariant 1: Centralized Domain Rule validation for negative outstanding
    if (account.totalOutstanding !== undefined && account.totalOutstanding < 0) {
      const txs = FallbackStorage.getReceivableTransactions().filter(t => t.receivableAccountId === account.id && t.schoolId === schoolId);
      const hasApprovedRefund = txs.some(t => t.type === 'refund' || t.type === 'transfer' || t.type === 'reversal');
      try {
        AccountsReceivableDomainRules.ensureNoNegativeOutstanding(account.totalOutstanding, hasApprovedRefund);
      } catch (err: any) {
        errors.totalOutstanding = err.message;
      }
    }

    // Invariant 5: Centralized Domain Rule validation for archived / closed accounts
    if (account.id) {
      const existingAccount = FallbackStorage.getReceivableAccounts().find(a => a.id === account.id && a.schoolId === schoolId);
      if (existingAccount) {
        try {
          AccountsReceivableDomainRules.ensureNoModificationAfterArchive(existingAccount);
          if (account.status) {
            AccountsReceivableDomainRules.ensureCloseAllowedOnlyWithZeroBalance(existingAccount, account.status);
          }
        } catch (err: any) {
          errors.account = err.message;
        }

        const hasFinancialDelta = (account.totalOutstanding !== undefined && account.totalOutstanding !== existingAccount.totalOutstanding) ||
                                  (account.totalBilled !== undefined && account.totalBilled !== existingAccount.totalBilled) ||
                                  (account.totalPaid !== undefined && account.totalPaid !== existingAccount.totalPaid);
        
        if (hasFinancialDelta && (existingAccount.status === 'Closed' || existingAccount.status === 'Archived')) {
          errors.account = "مخالفة معمارية: حساب الذمم مغلق أو مؤرشف تماماً. يمنع تعديل أي من قيمه المالية مباشرة دون تسوية نظامية معتمدة.";
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new AccountsReceivableValidationError("فشل التحقق من صحة حساب الذمم المدنية.", errors);
    }
  }

  /**
   * Validates a ReceivableTransaction before posting.
   */
  public static validateTransaction(tx: Partial<ReceivableTransaction>, schoolId: string): void {
    FallbackStorage.assertCanonicalPersistence('receivable transaction validation reads');
    const errors: Record<string, string> = {};

    if (!tx.receivableAccountId) {
      errors.receivableAccountId = "معرف حساب الذمم المدنية مطلوب لتسجيل الحركة.";
    }

    // Invariant 2: No Receivable without an authoritative reference invoice
    if (!tx.invoiceId) {
      errors.invoiceId = "مخالفة: يمنع إنشاء حركة ذمم مدينة يدوياً دون إشارة إلى فاتورة معتمدة صادرة عن InvoiceEngine.";
    }

    if (tx.amount === undefined || tx.amount === 0) {
      errors.amount = "مبلغ المعاملة يجب ألا يكون صفراً.";
    }

    if (!tx.type) {
      errors.type = "نوع حركة الذمم مطلوب.";
    }

    // Verify fiscal/academic year context and tenant bounds
    if (tx.invoiceId) {
      const invoice = FallbackStorage.getInvoices().find(inv => inv.id === tx.invoiceId);
      try {
        AccountsReceivableDomainRules.ensureInvoiceIsApproved(invoice);
        if (invoice) {
          AccountsReceivableDomainRules.ensureTenantIsolation(schoolId, invoice.schoolId);

          const fiscalYears = FallbackStorage.getFiscalYears();
          const fy = fiscalYears.find(f => f.id === invoice.fiscalYearId);
          if (fy) {
            AccountsReceivableDomainRules.ensureFiscalYearAndCurrencyBoundary(
              tx.currency || 'LYD',
              invoice.currency || 'LYD',
              invoice.dueDate || new Date().toISOString(),
              fy.startDate,
              fy.endDate
            );

            if (fy.status === 'closed') {
              errors.fiscalPeriod = "مخالفة: السنة المالية للفاتورة المرجعية مغلقة تماماً.";
            }
          }
        }
      } catch (err: any) {
        if (err instanceof AccountsReceivableDomainException) {
          errors.domainRule = err.message;
        } else {
          errors.invoiceId = err.message;
        }
      }
    }

    // Invariant 4: No modification of posted/closed transactions that impacted the General Ledger
    if (tx.id) {
      const existingTx = FallbackStorage.getReceivableTransactions().find(t => t.id === tx.id && t.schoolId === schoolId);
      if (existingTx) {
        try {
          AccountsReceivableDomainRules.ensureNoModificationOfPostedTransaction(existingTx);
        } catch (err: any) {
          errors.transaction = err.message;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new AccountsReceivableValidationError("فشل التحقق من صحة معاملة الذمم المدنية.", errors);
    }
  }
}
