import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from '../repositories/AuditRepository';
import { TreasuryRepository } from '../repositories/TreasuryRepository';
import { TreasuryValidator } from './TreasuryValidator';
import { TreasuryDomainRules, TreasuryDomainException } from './TreasuryDomainRules';
import { TreasuryStateMachine } from './TreasuryStateMachine';
import { TreasuryPolicyService } from './TreasuryPolicyService';
import { PaymentInstrumentService } from './PaymentInstrumentService';
import { PostingEngine } from './PostingEngine';
import { CurrencyService } from './CurrencyService';
import { CollectionsRepository } from '../repositories/CollectionsRepository';
import { TreasuryTransaction, TreasuryAccount, PaymentInstrumentType, TreasuryTransactionStatus, CollectionReceipt } from '../../types';

export interface TreasuryTxInput {
  type: 'Deposit' | 'Withdrawal' | 'Transfer';
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  paymentInstrument: PaymentInstrumentType;
  paymentInstrumentDetails?: string;
  referenceType?: string;
  referenceId?: string;
  description: string;
  notes?: string;
}

export class TreasuryEngine {

  /**
   * 1. Register a new cash movement (Draft)
   */
  public static async recordTransaction(
    schoolId: string,
    input: TreasuryTxInput,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransaction> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'RECORD_TREASURY_TRANSACTION',
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transactions', 'audit_logs']
    }, async () => {
      // a. Base Validation
      TreasuryValidator.validateTransactionInput(schoolId, input);

      // b. Domain Rules
      TreasuryDomainRules.ensureOpenFiscalYear(schoolId, new Date().toISOString().split('T')[0]);
      
      const paymentConfigs = await TreasuryRepository.getPaymentInstrumentConfigs();
      TreasuryDomainRules.ensureActivePaymentInstrument(input.paymentInstrument, paymentConfigs);

      // Verify accounts exist and match school tenant
      if (input.sourceAccountId) {
        const src = await TreasuryRepository.getAccountById(schoolId, input.sourceAccountId);
        if (!src) throw new Error(`الحساب المصدر غير موجود: ${input.sourceAccountId}`);
        TreasuryDomainRules.ensureTenantIsolation(schoolId, src.schoolId);
      }
      if (input.destinationAccountId) {
        const dest = await TreasuryRepository.getAccountById(schoolId, input.destinationAccountId);
        if (!dest) throw new Error(`الحساب المستهدف غير موجود: ${input.destinationAccountId}`);
        TreasuryDomainRules.ensureTenantIsolation(schoolId, dest.schoolId);
      }

      // c. Create Transaction in Draft
      const tx = await TreasuryRepository.createTransaction(schoolId, {
        type: input.type,
        status: 'Draft',
        sourceAccountId: input.sourceAccountId,
        destinationAccountId: input.destinationAccountId,
        amount: input.amount,
        currency: input.currency,
        exchangeRate: input.exchangeRate || 1,
        paymentInstrument: input.paymentInstrument,
        paymentInstrumentDetails: input.paymentInstrumentDetails,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        description: input.description,
        notes: input.notes,
        preparedBy: operator.userName
      });

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'CREATE',
        'TREASURY_ENGINE',
        operator.ipAddress,
        `تم قيد مسودة حركة خزينة جديدة رقم (${tx.id}) بنوع (${tx.type}) وقيمة ${tx.amount} ${tx.currency}.`,
        { affectedRecord: tx.id }
      );

      return tx;
    });
  }

  /**
   * 2. Process lifecycle transition with full automated business logic and side effects
   */
  public static async processTransition(
    schoolId: string,
    transactionId: string,
    targetStatus: TreasuryTransactionStatus,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransaction> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `TREASURY_TRANSITION_${transactionId}_TO_${targetStatus}`,
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['treasury_transactions', 'treasury_accounts', 'journal_entries', 'general_ledger', 'audit_logs']
    }, async () => {
      const tx = await TreasuryRepository.getTransactionById(schoolId, transactionId);
      if (!tx) {
        throw new Error(`الحركة المالية المطلوبة غير موجودة: ${transactionId}`);
      }

      // Safeguard: Check fiscal year is still open
      TreasuryDomainRules.ensureOpenFiscalYear(schoolId, tx.transactionDate);

      // Perform side-effects based on transition
      if (targetStatus === 'Executed') {
        await this.executeCashMovement(schoolId, tx);
      } else if (targetStatus === 'Posted') {
        // Automatically make sure it is executed first if currently only approved/draft
        if (tx.status !== 'Executed') {
          await TreasuryStateMachine.transitionTransaction(schoolId, transactionId, 'Executed', operator.userName, 'تم التنفيذ الفعلي للنقدية تلقائياً تمهيداً للترحيل لدفتر الأستاذ.');
          const updatedTx = await TreasuryRepository.getTransactionById(schoolId, transactionId);
          await this.executeCashMovement(schoolId, updatedTx!);
        }
        await this.postJournalToGeneralLedger(schoolId, tx, operator);
      }

      // Perform the actual transition
      const transitioned = await TreasuryStateMachine.transitionTransaction(
        schoolId,
        transactionId,
        targetStatus,
        operator.userName,
        `تم تغيير حالة المعاملة بنجاح إلى (${targetStatus}) بواسطة ${operator.userName}.`
      );

      await AuditRepository.log(
        schoolId,
        operator.userId,
        operator.userName,
        operator.userRole,
        'UPDATE',
        'TREASURY_ENGINE',
        operator.ipAddress,
        `تم تحديث حالة حركة الخزينة (${transactionId}) بنجاح إلى [${targetStatus}].`,
        { affectedRecord: transactionId }
      );

      return transitioned;
    });
  }

  /**
   * Helper: Execute physical cash/bank account balance updates
   */
  private static async executeCashMovement(schoolId: string, tx: TreasuryTransaction): Promise<void> {
    if (tx.type === 'Deposit') {
      const dest = await TreasuryRepository.getAccountById(schoolId, tx.destinationAccountId!);
      if (!dest) throw new Error('الحساب المستهدف غير موجود لإجراء الإيداع.');
      
      const newBalance = dest.balance + tx.amount;
      await TreasuryRepository.updateAccount(schoolId, dest.id, { balance: newBalance });

    } else if (tx.type === 'Withdrawal') {
      const src = await TreasuryRepository.getAccountById(schoolId, tx.sourceAccountId!);
      if (!src) throw new Error('الحساب المصدر غير موجود لإجراء السحب.');
      
      TreasuryDomainRules.ensureNegativeBalancePolicy(src, tx.amount);
      
      const newBalance = src.balance - tx.amount;
      await TreasuryRepository.updateAccount(schoolId, src.id, { balance: newBalance });

    } else if (tx.type === 'Transfer') {
      throw new Error('مخالفة معايير فصل الاختصاصات: يمنع تنفيذ عمليات التحويل من خلال محرك الخزينة العام. يجب استخدام TreasuryTransferService حصراً.');
    }
  }

  /**
   * Helper: Post Double-Entry Journal Entry to General Ledger via PostingEngine
   */
  private static async postJournalToGeneralLedger(
    schoolId: string,
    tx: TreasuryTransaction,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<void> {
    let debitGlAccount = 'acc_111'; // default Chest GL Account
    let creditGlAccount = 'acc_113'; // default Accounts Receivable GL Account

    if (tx.type === 'Deposit') {
      const dest = await TreasuryRepository.getAccountById(schoolId, tx.destinationAccountId!);
      debitGlAccount = dest?.glAccountId || 'acc_111';
      creditGlAccount = 'acc_113'; // Cash is debit, Accounts Receivable is credit
    } else if (tx.type === 'Withdrawal') {
      const src = await TreasuryRepository.getAccountById(schoolId, tx.sourceAccountId!);
      debitGlAccount = 'acc_113'; // Accounts Receivable is debit (refunding student)
      creditGlAccount = src?.glAccountId || 'acc_111'; // Cash is credit
    } else if (tx.type === 'Transfer') {
      throw new Error('مخالفة معايير فصل الاختصاصات: يمنع ترحيل عمليات التحويل من خلال محرك الخزينة العام. يجب استخدام TreasuryTransferService حصراً.');
    }

    const journalDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
      date: tx.transactionDate,
      description: `قيد ترحيل مركزي تلقائي لحركة خزينة رقم ${tx.id} (${tx.type}) - وسيلة الدفع: ${tx.paymentInstrument}. الوصف: ${tx.description}`,
      status: 'draft',
      items: [
        { accountId: debitGlAccount, debit: tx.amount, credit: 0 },
        { accountId: creditGlAccount, debit: 0, credit: tx.amount }
      ],
      totalDebit: tx.amount,
      totalCredit: tx.amount,
      referenceType: tx.type === 'Deposit' ? 'voucher' : 'other',
      referenceId: tx.referenceId || tx.id
    });

    await PostingEngine.postJournalEntry(schoolId, journalDraft.id, {
      userId: operator.userId,
      userName: operator.userName,
      userRole: operator.userRole,
      ipAddress: operator.ipAddress
    });

    // Link Journal Entry back to treasury transaction
    await TreasuryRepository.updateTransaction(schoolId, tx.id, {
      journalEntryId: journalDraft.id,
      postedBy: operator.userName,
      postedAt: new Date().toISOString()
    });
  }

  /**
   * 3. Integration: depositFromCollection
   * Automatically orchestrates recording & transitioning collection receipts into actual Treasury state.
   */
  public static async depositFromCollection(
    schoolId: string,
    collectionId: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<TreasuryTransaction> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `DEPOSIT_FROM_COLLECTION_${collectionId}`,
      userId: operator.userId,
      userName: operator.userName,
      ipAddress: operator.ipAddress,
      affectedTables: ['collection_receipts', 'treasury_transactions', 'treasury_accounts', 'journal_entries', 'general_ledger', 'audit_logs']
    }, async () => {
      // Fetch approved collection receipt
      const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
      if (!receipt) {
        throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
      }

      // Check if already deposited
      const existingTxs = await TreasuryRepository.getAllTransactions(schoolId, { type: 'Deposit' });
      const duplicate = existingTxs.find(t => t.referenceType === 'collection_receipt' && t.referenceId === collectionId);
      if (duplicate) {
        return duplicate; // Already processed
      }

      // Check if collection is Approved/Collected
      if (receipt.status !== 'Approved' && receipt.status !== 'Collected') {
        throw new Error('حظر محاسبي: لا يمكن إيداع سند تحصيل في الخزائن إلا إذا كان معتمداً أو محصلاً فعلياً.');
      }

      // Determine appropriate Treasury account based on payment method
      const accounts = await TreasuryRepository.getAllAccounts(schoolId);
      
      // Auto-create default accounts if none exist
      let targetAccount = accounts.find(a => {
        if (receipt.paymentMethod === 'Cash' || receipt.paymentMethod === 'POS') {
          return a.type === 'Branch Chest' || a.type === 'Main Chest';
        } else {
          return a.type === 'Bank Account';
        }
      });

      if (!targetAccount) {
        // Register standard chests/bank accounts to guarantee successful processing
        if (receipt.paymentMethod === 'Cash' || receipt.paymentMethod === 'POS') {
          targetAccount = await TreasuryRepository.createAccount(schoolId, {
            name: 'الصندوق الفرعي الرئيسي',
            code: 'CH-SUB-01',
            type: 'Branch Chest',
            glAccountId: 'acc_111',
            currency: receipt.currency,
            balance: 0,
            isActive: true,
            allowNegativeBalance: false
          });
        } else {
          targetAccount = await TreasuryRepository.createAccount(schoolId, {
            name: 'الحساب الجاري بالمصرف الوطني',
            code: 'BK-MAIN-01',
            type: 'Bank Account',
            glAccountId: 'acc_112',
            currency: receipt.currency,
            balance: 0,
            isActive: true,
            allowNegativeBalance: false
          });
        }
      }

      // Record transaction
      const input: TreasuryTxInput = {
        type: 'Deposit',
        destinationAccountId: targetAccount.id,
        amount: receipt.amount,
        currency: receipt.currency,
        exchangeRate: receipt.exchangeRate,
        paymentInstrument: receipt.paymentMethod as any,
        paymentInstrumentDetails: receipt.paymentMethodDetails,
        referenceType: 'collection_receipt',
        referenceId: collectionId,
        description: `إيداع نقدية واردة تلقائياً من سند التحصيل المعتمد رقم ${receipt.id}.`
      };

      const tx = await this.recordTransaction(schoolId, input, operator);

      // Walk through state transitions automatically
      await this.processTransition(schoolId, tx.id, 'Approved', operator);
      await this.processTransition(schoolId, tx.id, 'Executed', operator);
      const finalTx = await this.processTransition(schoolId, tx.id, 'Posted', operator);

      // Also update collection receipt status to Deposited to reflect success
      await CollectionsRepository.updateCollection(schoolId, collectionId, {
        status: 'Deposited',
        notes: `${receipt.notes || ''}\n[النظام المدفوعات]: تم إيداع وترحيل سند التحصيل بنجاح في حساب الخزانة رقم ${targetAccount.code} تحت حركة رقم ${finalTx.id}.`
      });

      return finalTx;
    });
  }

  /**
   * 4. Safe deletion blocker (No historical deletion allowed)
   */
  public static preventDeletion(): void {
    TreasuryDomainRules.ensureNoHistoricalDeletion();
  }
}
