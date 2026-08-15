import { Invoice, ReceivableAccount, ReceivableTransaction, ReceivableStatus, AuditMetadata } from '../../types';
import { AccountsReceivableRepository } from '../repositories/AccountsReceivableRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { StudentRepository } from '../repositories/StudentRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { AccountsReceivableValidator } from './AccountsReceivableValidator';
import { AccountsReceivablePolicyService } from './AccountsReceivablePolicyService';
import { AgingEngine } from './AgingEngine';
import { CollectionStrategyService } from './CollectionStrategyService';
import { CurrencyService } from './CurrencyService';
import { InstallmentEngine } from './InstallmentEngine';
import { AcademicRevenueRecognitionEngine } from './AcademicRevenueRecognitionEngine';
import { UnitOfWork } from '../UnitOfWork';
import { ReceivableStateMachine } from './ReceivableStateMachine';

/**
 * ============================================================================
 * ARCHITECTURAL RESPONSIBILITY MATRIX (Phase 2.4.5 ERP Compliance)
 * ============================================================================
 * 
 * 1. InvoiceEngine
 *    - Responsible for creating tuition / service billing claims.
 *    - Responsible for rendering and issuing legal, immutable invoices.
 *    - Responsible for triggering/calling AccountsReceivableEngine to track subledger debt.
 * 
 * 2. AccountsReceivableEngine (THE CENTRAL SUBLEDGER AUTHORITY)
 *    - Responsible for managing accounts receivable lifecycle & transitions.
 *    - Responsible for running balance governance (calculating debit/credit transactions).
 *    - Responsible for tracking and analyzing aging profiles (AgingEngine).
 *    - Responsible for handling write-offs, waivers, disputes, and payment allocations.
 *    - Responsible for matching and verifying student balance registries.
 *    - STRIKTLY FORBIDDEN from posting journal entries directly to the General Ledger.
 *      All GL impact must be handled exclusively by PostingEngine to prevent dual sources of truth.
 * 
 * 3. PostingEngine (THE GENERAL LEDGER AUTHORITATIVE OWNER)
 *    - Sole authority for creating, editing, and posting Journal Entries.
 *    - Sole authority for updating General Ledger balances and accounts.
 *    - No double-booking allowed. Since InvoiceEngine invokes PostingEngine to record
 *      Dr Accounts Receivable (1201) and Cr Tuition Revenue (4101) upon issuing invoices,
 *      AccountsReceivableEngine registers only subledger tracking entries and DOES NOT
 *      generate duplicate journal entries.
 * 
 * ============================================================================
 * RUNNING BALANCE GOVERNANCE POLICY
 * ============================================================================
 * - Single Source of Truth: All transaction running balance fields (balanceBefore,
 *   debit, credit, balanceAfter) are calculated inside a single atomic UnitOfWork transaction
 *   boundary. Direct, unverified updates outside of the AccountsReceivableEngine/Repository
 *   are strictly barred.
 * ============================================================================
 */
export class AccountsReceivableEngine {

  /**
   * Safe utility to construct audit metadata.
   */
  private static getAuditMeta(meta?: AuditMetadata): AuditMetadata {
    return {
      userId: meta?.userId || 'system_ar_engine',
      userName: meta?.userName || 'Enterprise AR Engine',
      userRole: meta?.userRole || 'Chief ERP Architect',
      ipAddress: meta?.ipAddress || '127.0.0.1'
    };
  }

  /**
   * Authorized Entrypoint: Establishes a student debt from an Issued Invoice.
   * Strictly forbids creating any debit receivable manually.
   */
  public static async registerInvoiceAsReceivable(
    schoolId: string,
    invoiceId: string,
    meta?: AuditMetadata
  ): Promise<ReceivableAccount> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `REGISTER_AR_DEBIT_INV_${invoiceId}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      affectedTables: ['receivable_accounts', 'receivable_transactions', 'receivable_status_histories', 'receivable_audits', 'students']
    }, async () => {
      // 1. Fetch and verify invoice actually exists in the Invoice system (Authoritative Gateway)
      const invoice = await InvoiceRepository.getById(schoolId, invoiceId);
      if (!invoice) {
        throw new Error(`حظر الذمم: لا يمكن إنشاء ذمة مالية لعدم وجود الفاتورة المرجعية بالنظام: ${invoiceId}`);
      }

      // 2. Validate invoice is in a state ready to establish receivables
      if (invoice.status === 'Draft' || invoice.status === 'Cancelled') {
        throw new Error(`حظر الذمم: لا يمكن قيد ذمة مالية لفاتورة مسودة أو ملغاة (${invoice.status}).`);
      }

      // 3. Resolve or create ReceivableAccount for the student
      let account = await AccountsReceivableRepository.getAccountByStudentId(schoolId, invoice.studentId);
      if (!account) {
        account = await AccountsReceivableRepository.createAccount(schoolId, {
          studentId: invoice.studentId,
          studentName: invoice.studentName,
          accountNumber: `AR-${invoice.studentId.substring(0, 6).toUpperCase()}-${Date.now().toString().substring(8)}`,
          currency: invoice.currency || 'LYD',
          status: 'Draft'
        });
      }

      // 4. Create Receivable Transaction of type debit (link to the authoritative invoice)
      const txAmount = invoice.totalAmount ?? invoice.amount ?? 0;
      const txRemaining = invoice.remainingAmount ?? txAmount;
      
      // Check if transaction was already registered
      const existingTxs = await AccountsReceivableRepository.getTransactionsByAccountId(schoolId, account.id);
      const alreadyRegistered = existingTxs.find(t => t.invoiceId === invoiceId && t.type === 'debit');
      if (alreadyRegistered) {
        return account;
      }

      const tx = await AccountsReceivableRepository.createTransaction(schoolId, {
        receivableAccountId: account.id,
        invoiceId: invoiceId,
        type: 'debit',
        amount: txAmount,
        balance: txRemaining,
        currency: invoice.currency || 'LYD',
        description: `قيد ذمة مدينة بموجب الفاتورة رقم ${invoiceId} - ${invoice.item}`,
        dueDate: invoice.dueDate,
        status: 'Open',
        createdBy: auditMeta.userName
      });

      // 5. Update Receivable Account totals and validate via State Machine
      const originalStatus = account.status;
      const newBilled = (account.totalBilled || 0) + txAmount;
      const newOutstanding = (account.totalOutstanding || 0) + txRemaining;
      const newStatus: ReceivableStatus = newOutstanding === 0 ? 'Collected' : 'Open';

      // Enforce State Machine Transition Rules
      ReceivableStateMachine.validateTransition(originalStatus, newStatus);

      /**
       * Posting Integration Governance Doc (AR-GL Boundary):
       * 1. Creating a debit receivable here DOES NOT create a new Journal Entry.
       * 2. This prevents double-booking, since InvoiceEngine already posted the GAAP entries
       *    (Dr Accounts Receivable [1201] / Cr Tuition Revenue [4101]) when the invoice was Issued.
       * 3. Hence, we only register the subledger tracking records without duplicating GL entries.
       */

      const updatedAccount = await AccountsReceivableRepository.updateAccount(schoolId, account.id, {
        totalBilled: newBilled,
        totalOutstanding: newOutstanding,
        status: newStatus,
        version: account.version
      });

      // 6. State Machine transition audit tracking
      if (originalStatus !== newStatus) {
        await AccountsReceivableRepository.createStatusHistory(schoolId, {
          receivableAccountId: account.id,
          fromStatus: originalStatus,
          toStatus: newStatus,
          changedBy: auditMeta.userName,
          reason: `قيد الفاتورة المرجعية ${invoiceId}`
        });
      }

      // 7. Sync Student fees remaining in FallbackStorage registry
      await this.syncStudentAccount(schoolId, invoice.studentId);

      // 8. Log official system-wide audit trail
      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'REGISTER_AR_DEBIT',
        'ACCOUNTS_RECEIVABLE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `تم قيد معاملة ذمم مدينة بقيمة ${txAmount} ${invoice.currency} للطالب ${invoice.studentName} بموجب الفاتورة ${invoiceId}.`,
        { affectedRecord: account.id, valuesAfter: { transactionId: tx.id } }
      );

      return updatedAccount;
    });
  }

  /**
   * Processes cash collection / payment receipts and allocates them against outstanding student debits (FIFO).
   */
  public static async processReceivableCollection(
    schoolId: string,
    studentId: string,
    paymentId: string,
    amount: number,
    meta?: AuditMetadata
  ): Promise<ReceivableAccount> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `PROCESS_RECEIVABLE_COLLECTION_PMT_${paymentId}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      affectedTables: ['receivable_accounts', 'receivable_transactions', 'receivable_allocations', 'receivable_settlements', 'receivable_audits', 'students']
    }, async () => {
      // Resolve student AR account
      const account = await AccountsReceivableRepository.getAccountByStudentId(schoolId, studentId);
      if (!account) {
        throw new Error(`حساب الذمم المدنية غير موجود للطالب: ${studentId}`);
      }

      // Allocate payment using FIFO policy
      const result = await AccountsReceivablePolicyService.allocatePaymentFIFO(
        schoolId,
        account.id,
        paymentId,
        amount,
        {
          userId: auditMeta.userId,
          userName: auditMeta.userName,
          userRole: auditMeta.userRole || 'Accountant',
          ipAddress: auditMeta.ipAddress || '127.0.0.1'
        }
      );

      // Sync student registry
      await this.syncStudentAccount(schoolId, studentId);

      // Log ERP audit trail
      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'AR_PAYMENT_COLLECTION',
        'ACCOUNTS_RECEIVABLE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `تم تحصيل وتسوية مبلغ ${result.allocatedAmount} ${account.currency} لحساب الطالب الذمم المدينة. المتبقي غير المخصص: ${result.remainingPayment}.`,
        { affectedRecord: account.id, valuesAfter: { paymentId } }
      );

      return (await AccountsReceivableRepository.getAccountById(schoolId, account.id))!;
    });
  }

  /**
   * Coordinates applying and posting financial adjustments (Write-offs, Waivers, Settlements, Corrections, Discounts, Refund offsets).
   */
  public static async processAdjustment(
    schoolId: string,
    accountId: string,
    params: {
      type: 'write_off' | 'waiver' | 'settlement' | 'discount' | 'correction' | 'refund_offset';
      amount: number;
      reason: string;
      invoiceId?: string;
      receivableTransactionId?: string;
    },
    meta?: AuditMetadata
  ): Promise<ReceivableAccount> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `PROCESS_AR_ADJUSTMENT_${params.type.toUpperCase()}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      affectedTables: ['receivable_accounts', 'receivable_transactions', 'receivable_adjustments', 'receivable_write_offs', 'students']
    }, async () => {
      const account = await AccountsReceivableRepository.getAccountById(schoolId, accountId);
      if (!account) {
        throw new Error(`حساب الذمم المدنية غير موجود: ${accountId}`);
      }

      // Apply the adjustment via policy service
      await AccountsReceivablePolicyService.applyAdjustment(schoolId, accountId, params, {
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        userRole: auditMeta.userRole || 'CPA',
        ipAddress: auditMeta.ipAddress || '127.0.0.1'
      });

      // Synchronize outstanding figures
      await this.syncStudentAccount(schoolId, account.studentId);

      // Return updated account
      return (await AccountsReceivableRepository.getAccountById(schoolId, accountId))!;
    });
  }

  /**
   * Authoritative balance synchronizer. Ensures the student's fees remaining registry is
   * 100% matched with the AR Subledger.
   */
  public static async syncStudentAccount(schoolId: string, studentId: string): Promise<void> {
    const account = await AccountsReceivableRepository.getAccountByStudentId(schoolId, studentId);
    let students = FallbackStorage.getStudents();
    if (UnitOfWork.isTransactionActive()) {
      students = UnitOfWork.getPendingAll('students', students);
    }
    const idx = students.findIndex(s => s.id === studentId && s.schoolId === schoolId);
    
    if (idx !== -1) {
      const outstanding = account ? account.totalOutstanding : 0;
      const paid = account ? account.totalPaid : 0;
      
      const updatedStudent = {
        ...students[idx],
        feesRemaining: outstanding,
        feesPaid: paid
      };

      if (UnitOfWork.isTransactionActive()) {
        UnitOfWork.enlistUpdate('students', studentId, updatedStudent);
      } else {
        students[idx] = updatedStudent;
        FallbackStorage.saveStudents(students);
      }
    }
  }

  /**
   * Compiles and retrieves the consolidated 360 portfolio for a specific student's accounts receivable.
   */
  public static async getAccountReceivablePortfolio(
    schoolId: string,
    studentId: string
  ): Promise<{
    account: ReceivableAccount | null;
    transactions: ReceivableTransaction[];
    agingBuckets: any[];
    collectionCase: any | null;
    promises: any[];
    history: any[];
    adjustments: any[];
  }> {
    const account = await AccountsReceivableRepository.getAccountByStudentId(schoolId, studentId);
    if (!account) {
      return {
        account: null,
        transactions: [],
        agingBuckets: [],
        collectionCase: null,
        promises: [],
        history: [],
        adjustments: []
      };
    }

    const [transactions, agingBuckets, collectionCase, history, adjustments] = await Promise.all([
      AccountsReceivableRepository.getTransactionsByAccountId(schoolId, account.id),
      AgingEngine.calculateAgingForAccount(schoolId, account.id),
      AccountsReceivableRepository.getCollectionCaseByAccountId(schoolId, account.id),
      AccountsReceivableRepository.getStatusHistoryByAccountId(schoolId, account.id),
      AccountsReceivableRepository.getAdjustmentsByAccountId(schoolId, account.id)
    ]);

    let promises: any[] = [];
    if (collectionCase) {
      promises = await AccountsReceivableRepository.getPromisesByCaseId(schoolId, collectionCase.id);
    }

    return {
      account,
      transactions,
      agingBuckets,
      collectionCase,
      promises,
      history,
      adjustments
    };
  }

  /**
   * Compiles system-wide, C-level executive KPIs and overall AR portfolio metrics under strict tenant isolation.
   */
  public static async getCompanyWideARMetrics(schoolId: string): Promise<{
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    totalWriteOffs: number;
    activeCasesCount: number;
    brokenPromisesCount: number;
    consolidatedAgingBuckets: any[];
  }> {
    const accounts = await AccountsReceivableRepository.getAllAccounts(schoolId);
    
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalWriteOffs = 0;
    
    for (const acc of accounts) {
      totalBilled += acc.totalBilled || 0;
      totalCollected += acc.totalPaid || 0;
      totalOutstanding += acc.totalOutstanding || 0;
      
      const writeOffs = await AccountsReceivableRepository.getWriteOffsByAccountId(schoolId, acc.id);
      totalWriteOffs += writeOffs.reduce((sum, w) => sum + w.amount, 0);
    }

    const cases = FallbackStorage.getCollectionCases().filter(c => c.schoolId === schoolId);
    const activeCasesCount = cases.filter(c => c.status === 'open' || c.status === 'active' || c.status === 'escalated').length;

    const promises = FallbackStorage.getCollectionPromises().filter(p => p.schoolId === schoolId);
    const brokenPromisesCount = promises.filter(p => p.status === 'broken').length;

    const consolidatedAgingBuckets = await AgingEngine.calculateCompanyWideAging(schoolId);

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalWriteOffs,
      activeCasesCount,
      brokenPromisesCount,
      consolidatedAgingBuckets
    };
  }

  /**
   * Centralized State Machine Transition Gateway
   * Authorized entrance for manually updating receivable statuses (e.g. disputing an account, marking it as payment promised, or writing it off).
   * Strictly verifies valid transition flows using the centralized state machine.
   */
  public static async transitionAccountStatus(
    schoolId: string,
    accountId: string,
    targetStatus: ReceivableStatus,
    reason: string,
    meta?: AuditMetadata
  ): Promise<ReceivableAccount> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `TRANSITION_AR_STATUS_TO_${targetStatus}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      affectedTables: ['receivable_accounts', 'receivable_status_histories', 'receivable_audits']
    }, async () => {
      return await ReceivableStateMachine.transitionAccount(
        schoolId,
        accountId,
        targetStatus,
        reason,
        auditMeta.userName
      );
    });
  }

  /**
   * Reconciliation Readiness Engine Core
   * Conducts match/audit reconciliations between the Accounts Receivable Sub-ledger and the General Ledger (specifically AR GL Account e.g. '1201').
   * Computes differences, matches total outstanding sums, and stamps status and metadata on subledger accounts.
   */
  public static async reconcileSubledgerWithGeneralLedger(
    schoolId: string,
    meta?: AuditMetadata
  ): Promise<{
    reconciledAccountsCount: number;
    discrepancyCount: number;
    totalSubledgerBalance: number;
    totalGeneralLedgerBalance: number;
    differenceAmount: number;
  }> {
    const auditMeta = this.getAuditMeta(meta);

    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'RECONCILE_AR_SUB_WITH_GL',
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress || '127.0.0.1',
      affectedTables: ['receivable_accounts', 'receivable_audits']
    }, async () => {
      const accounts = await AccountsReceivableRepository.getAllAccounts(schoolId);
      let totalSubledgerBalance = 0;
      let reconciledAccountsCount = 0;
      let discrepancyCount = 0;

      // GL Balance for Accounts Receivable (1201) retrieved from posted journal entries.
      const ledgerEntries = FallbackStorage.getJournalEntries()
        .filter(e => (e as any).schoolId === schoolId && e.status === 'posted');
      
      let glDebitTotal = 0;
      let glCreditTotal = 0;

      for (const entry of ledgerEntries) {
        for (const item of entry.items) {
          if (item.accountId === '1201') {
            glDebitTotal += item.debit || 0;
            glCreditTotal += item.credit || 0;
          }
        }
      }

      const totalGeneralLedgerBalance = Math.max(0, glDebitTotal - glCreditTotal);
      
      for (const account of accounts) {
        totalSubledgerBalance += account.totalOutstanding || 0;
      }

      const totalDifference = Math.abs(totalSubledgerBalance - totalGeneralLedgerBalance);
      const reconRef = `REC-${Date.now()}`;
      
      for (const account of accounts) {
        const accountDiff = totalDifference > 0 ? (account.totalOutstanding * (totalDifference / (totalSubledgerBalance || 1))) : 0;
        const status = accountDiff === 0 ? 'reconciled' : 'discrepancy';
        const diffReason = accountDiff === 0 ? 'رصيد الذمم متطابق تماماً مع رصيد الأستاذ العام.' : 'وجود فروقات محاسبية قيد المراجعة والتدقيق.';

        if (status === 'reconciled') reconciledAccountsCount++;
        else discrepancyCount++;

        await AccountsReceivableRepository.updateAccount(schoolId, account.id, {
          reconciliationStatus: status as any,
          lastReconciledAt: new Date().toISOString(),
          differenceAmount: accountDiff,
          differenceReason: diffReason,
          reconciliationReference: reconRef,
          reconciledBy: auditMeta.userName,
          version: account.version
        });
      }

      // Log ERP audit trail
      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'AR_GL_RECONCILIATION',
        'ACCOUNTS_RECEIVABLE_ENGINE',
        auditMeta.ipAddress || '127.0.0.1',
        `تمت مطابقة حسابات الذمم المدينة مع الأستاذ العام بنجاح. رصيد المساعد: ${totalSubledgerBalance}، رصيد الأستاذ العام: ${totalGeneralLedgerBalance}، الفرق الإجمالي: ${totalDifference}. مرجع المطابقة: ${reconRef}`,
        { valuesAfter: { totalSubledgerBalance, totalGeneralLedgerBalance, totalDifference, reconciliationReference: reconRef } }
      );

      return {
        reconciledAccountsCount,
        discrepancyCount,
        totalSubledgerBalance,
        totalGeneralLedgerBalance,
        differenceAmount: totalDifference
      };
    });
  }
}
