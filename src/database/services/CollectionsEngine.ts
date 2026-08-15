import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from '../repositories/AuditRepository';
import { CollectionsRepository } from '../repositories/CollectionsRepository';
import { AccountsReceivableRepository } from '../repositories/AccountsReceivableRepository';
import { CollectionDomainRules, CollectionDomainException } from './CollectionDomainRules';
import { CollectionsValidator } from './CollectionsValidator';
import { CollectionStateMachine } from './CollectionStateMachine';
import { CollectionAllocationEngine } from './CollectionAllocationEngine';
import { PostingEngine } from './PostingEngine';
import { CurrencyService } from './CurrencyService';
import { TreasuryEngine } from './TreasuryEngine';
import { AllocationPolicyType } from './CollectionsPolicyService';
import { CollectionReceipt, CollectionStatus, CollectionPaymentMethod, CollectionSourceType } from '../../types';

export interface CollectionInput {
  receivableAccountId: string;
  sourceType: CollectionSourceType;
  sourceId?: string;
  amount: number;
  paymentMethod: CollectionPaymentMethod;
  paymentMethodDetails?: string;
  currency: string;
  exchangeRate?: number;
  notes?: string;
  createdBy: string;
}

/**
 * Enterprise Collections Engine (Phase 2.5)
 * The sole authoritative controller of all payment collections across the ERP.
 * Strictly orchestrates the lifecycle, validation, allocation, double-entry GL posting,
 * and structural compliance of every cash receipt.
 */
export class CollectionsEngine {

  /**
   * 1. Record a new Collection receipt (Default status: Draft or Pending Approval)
   */
  public static async recordReceipt(
    schoolId: string,
    input: CollectionInput,
    operatorContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<CollectionReceipt> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: 'RECORD_COLLECTION_RECEIPT',
      userId: operatorContext.userId,
      userName: operatorContext.userName,
      ipAddress: operatorContext.ipAddress,
      affectedTables: ['collection_receipts', 'receivable_audits']
    }, async () => {
      // 1. Base Validation
      CollectionsValidator.validateReceipt(schoolId, input);

      // 2. Fetch student AR account
      const arAccount = await AccountsReceivableRepository.getAccountById(schoolId, input.receivableAccountId);
      if (!arAccount) {
        throw new CollectionDomainException('حساب الذمة المدينة غير موجود بالمنظومة.', 'RECEIVABLE_ACCOUNT_NOT_FOUND');
      }

      // 3. Ensure Tenant Isolation and Currency policy
      CollectionDomainRules.ensureTenantIsolation(schoolId, arAccount.schoolId);
      if (input.currency !== arAccount.currency) {
        CollectionDomainRules.ensureCurrencyAlignment(arAccount.currency, input.currency, input.exchangeRate);
      }

      // 4. Generate the collection receipt record
      const receipt = await CollectionsRepository.createCollection(schoolId, {
        receivableAccountId: input.receivableAccountId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentMethodDetails: input.paymentMethodDetails,
        status: 'Draft',
        currency: input.currency,
        exchangeRate: input.exchangeRate || 1,
        collectedAt: new Date().toISOString(),
        collectedBy: operatorContext.userName,
        notes: input.notes,
        createdBy: operatorContext.userName
      });

      // 5. System Log Audit Trail
      await AuditRepository.log(
        schoolId,
        operatorContext.userId,
        operatorContext.userName,
        operatorContext.userRole,
        'CREATE',
        'COLLECTIONS_ENGINE',
        operatorContext.ipAddress,
        `تم إنشاء مسودة سند تحصيل رقم (${receipt.id}) بمبلغ ${receipt.amount} ${receipt.currency} لحساب الذمة (${arAccount.accountNumber}).`,
        { affectedRecord: receipt.id }
      );

      return receipt;
    });
  }

  /**
   * 2. Approve a Collection receipt
   * Transition Draft -> Pending Approval -> Approved, and post Double-Entry Journal to GL.
   */
  public static async approveReceipt(
    schoolId: string,
    collectionId: string,
    operatorContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<CollectionReceipt> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `APPROVE_COLLECTION_${collectionId}`,
      userId: operatorContext.userId,
      userName: operatorContext.userName,
      ipAddress: operatorContext.ipAddress,
      affectedTables: ['collection_receipts', 'journal_entries', 'general_ledger', 'receivable_audits']
    }, async () => {
      const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
      if (!receipt) {
        throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
      }

      // Transition Status Draft -> Pending Approval -> Approved
      if (receipt.status === 'Draft') {
        await CollectionStateMachine.transitionCollection(schoolId, collectionId, 'Pending Approval', 'تحت التدقيق والمراجعة', operatorContext.userName);
      }
      
      const approvedReceipt = await CollectionStateMachine.transitionCollection(schoolId, collectionId, 'Approved', 'تم الاعتماد والترحيل المالي والتطابق', operatorContext.userName);

      // Perform deposit and automated physical ledger posting through the independent Treasury Engine
      const treasuryTx = await TreasuryEngine.depositFromCollection(schoolId, collectionId, {
        userId: operatorContext.userId,
        userName: operatorContext.userName,
        userRole: operatorContext.userRole,
        ipAddress: operatorContext.ipAddress
      });

      // Fetch the updated receipt with new notes and Deposited status
      const finalReceipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);

      await AuditRepository.log(
        schoolId,
        operatorContext.userId,
        operatorContext.userName,
        operatorContext.userRole,
        'APPROVE',
        'COLLECTIONS_ENGINE',
        operatorContext.ipAddress,
        `تم اعتماد وترحيل سند التحصيل (${collectionId}) مالياً في حساب الخزينة وإنشاء المعاملة رقم (${treasuryTx.id}) بنجاح.`,
        { affectedRecord: collectionId }
      );

      return finalReceipt;
    });
  }

  /**
   * 3. Collect and Allocate Receipt
   * Transitions to 'Collected' and fires the CollectionAllocationEngine to apply funds to invoices/installments.
   */
  public static async collectAndAllocateReceipt(
    schoolId: string,
    collectionId: string,
    operatorContext: { userId: string; userName: string; userRole: string; ipAddress: string },
    policyOverride?: AllocationPolicyType,
    manualInstructions?: { targetType: 'Invoice' | 'Installment'; targetId: string; amount: number }[]
  ): Promise<CollectionReceipt> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `COLLECT_ALLOCATE_RECEIPT_${collectionId}`,
      userId: operatorContext.userId,
      userName: operatorContext.userName,
      ipAddress: operatorContext.ipAddress,
      affectedTables: ['collection_receipts', 'collection_allocations', 'receivable_accounts', 'receivable_transactions', 'invoices', 'installment_schedules', 'receivable_audits']
    }, async () => {
      const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
      if (!receipt) {
        throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
      }

      if (receipt.status !== 'Approved') {
        throw new Error('حظر محاسبي: يجب اعتماد السند أولاً قبل تطبيق عمليات التوزيع والتحصيل الفعلي.');
      }

      // Transition to Collected state
      const collectedReceipt = await CollectionStateMachine.transitionCollection(schoolId, collectionId, 'Collected', 'تم التحصيل المادي وسيرى التوزيع الفوري للأموال', operatorContext.userName);

      // Distribute amount to invoices/installments using configured/provided policy
      await CollectionAllocationEngine.allocateCollection(schoolId, collectionId, policyOverride, operatorContext, manualInstructions);

      const finalReceipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);

      await AuditRepository.log(
        schoolId,
        operatorContext.userId,
        operatorContext.userName,
        operatorContext.userRole,
        'ALLOCATE',
        'COLLECTIONS_ENGINE',
        operatorContext.ipAddress,
        `تم تحصيل وتوزيع مبالغ سند التحصيل (${collectionId}) بنجاح.`,
        { affectedRecord: collectionId }
      );

      return finalReceipt!;
    });
  }

  /**
   * 4. Cancel a collection receipt
   */
  public static async cancelReceipt(
    schoolId: string,
    collectionId: string,
    reason: string,
    operatorContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<CollectionReceipt> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `CANCEL_COLLECTION_${collectionId}`,
      userId: operatorContext.userId,
      userName: operatorContext.userName,
      ipAddress: operatorContext.ipAddress,
      affectedTables: ['collection_receipts', 'journal_entries', 'general_ledger', 'receivable_audits']
    }, async () => {
      const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
      if (!receipt) {
        throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
      }

      // Ensure immutability for posted states if they are already Deposited/Reconciled (restrict modifications)
      if (receipt.status === 'Deposited' || receipt.status === 'Reconciled' || receipt.status === 'Archived') {
        CollectionDomainRules.ensureReceiptImmutability(receipt);
      }

      const cancelled = await CollectionStateMachine.transitionCollection(schoolId, collectionId, 'Cancelled', reason, operatorContext.userName);

      // Reversing Entries in general ledger if previously approved
      if (receipt.status !== 'Draft' && receipt.status !== 'Pending Approval') {
        const debitAccountId = 'acc_113'; // Accounts Receivable
        const creditAccountId = (receipt.paymentMethod === 'Cash' || receipt.paymentMethod === 'POS') ? 'acc_111' : 'acc_112';

        const journalDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
          date: new Date().toISOString().split('T')[0],
          description: `قيد عكسي وإلغاء لسند تحصيل رقم ${receipt.id} - السبب: ${reason}`,
          status: 'draft',
          items: [
            { accountId: debitAccountId, debit: receipt.amount, credit: 0 },
            { accountId: creditAccountId, debit: 0, credit: receipt.amount }
          ],
          totalDebit: receipt.amount,
          totalCredit: receipt.amount,
          referenceType: 'reversal',
          referenceId: receipt.id
        });

        await PostingEngine.postJournalEntry(schoolId, journalDraft.id, {
          userId: operatorContext.userId,
          userName: operatorContext.userName,
          userRole: operatorContext.userRole,
          ipAddress: operatorContext.ipAddress
        });
      }

      await AuditRepository.log(
        schoolId,
        operatorContext.userId,
        operatorContext.userName,
        operatorContext.userRole,
        'CANCEL',
        'COLLECTIONS_ENGINE',
        operatorContext.ipAddress,
        `تم إلغاء سند التحصيل (${collectionId}) وعكس الحركة بنجاح. السبب: ${reason}`,
        { affectedRecord: collectionId }
      );

      return cancelled;
    });
  }

  /**
   * 5. Refund a collection receipt
   */
  public static async refundReceipt(
    schoolId: string,
    collectionId: string,
    reason: string,
    operatorContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<CollectionReceipt> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `REFUND_COLLECTION_${collectionId}`,
      userId: operatorContext.userId,
      userName: operatorContext.userName,
      ipAddress: operatorContext.ipAddress,
      affectedTables: ['collection_receipts', 'journal_entries', 'general_ledger', 'receivable_audits']
    }, async () => {
      const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
      if (!receipt) {
        throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
      }

      const refunded = await CollectionStateMachine.transitionCollection(schoolId, collectionId, 'Refunded', reason, operatorContext.userName);

      // Create refund GL entries
      const debitAccountId = 'acc_113'; // Accounts Receivable
      const creditAccountId = (receipt.paymentMethod === 'Cash' || receipt.paymentMethod === 'POS') ? 'acc_111' : 'acc_112';

      const journalDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
        date: new Date().toISOString().split('T')[0],
        description: `قيد رد وتأدية مبالغ سند تحصيل رقم ${receipt.id} - السبب: ${reason}`,
        status: 'draft',
        items: [
          { accountId: debitAccountId, debit: receipt.amount, credit: 0 },
          { accountId: creditAccountId, debit: 0, credit: receipt.amount }
        ],
        totalDebit: receipt.amount,
        totalCredit: receipt.amount,
        referenceType: 'reversal',
        referenceId: receipt.id
      });

      await PostingEngine.postJournalEntry(schoolId, journalDraft.id, {
        userId: operatorContext.userId,
        userName: operatorContext.userName,
        userRole: operatorContext.userRole,
        ipAddress: operatorContext.ipAddress
      });

      await AuditRepository.log(
        schoolId,
        operatorContext.userId,
        operatorContext.userName,
        operatorContext.userRole,
        'REFUND',
        'COLLECTIONS_ENGINE',
        operatorContext.ipAddress,
        `تم رد وتأدية مبالغ سند التحصيل (${collectionId}) وعكس قيد اليومية بنجاح. السبب: ${reason}`,
        { affectedRecord: collectionId }
      );

      return refunded;
    });
  }

  /**
   * 6. Reverse a collection receipt
   */
  public static async reverseReceipt(
    schoolId: string,
    collectionId: string,
    reason: string,
    operatorContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<CollectionReceipt> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `REVERSE_COLLECTION_${collectionId}`,
      userId: operatorContext.userId,
      userName: operatorContext.userName,
      ipAddress: operatorContext.ipAddress,
      affectedTables: ['collection_receipts', 'journal_entries', 'general_ledger', 'receivable_audits']
    }, async () => {
      const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
      if (!receipt) {
        throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
      }

      const reversed = await CollectionStateMachine.transitionCollection(schoolId, collectionId, 'Reversed', reason, operatorContext.userName);

      // Create Reversal double-entry
      const debitAccountId = 'acc_113'; // Accounts Receivable
      const creditAccountId = (receipt.paymentMethod === 'Cash' || receipt.paymentMethod === 'POS') ? 'acc_111' : 'acc_112';

      const journalDraft = await PostingEngine.createJournalEntryDraft(schoolId, {
        date: new Date().toISOString().split('T')[0],
        description: `قيد عكسي كامل لسند تحصيل رقم ${receipt.id} - السبب: ${reason}`,
        status: 'draft',
        items: [
          { accountId: debitAccountId, debit: receipt.amount, credit: 0 },
          { accountId: creditAccountId, debit: 0, credit: receipt.amount }
        ],
        totalDebit: receipt.amount,
        totalCredit: receipt.amount,
        referenceType: 'reversal',
        referenceId: receipt.id
      });

      await PostingEngine.postJournalEntry(schoolId, journalDraft.id, {
        userId: operatorContext.userId,
        userName: operatorContext.userName,
        userRole: operatorContext.userRole,
        ipAddress: operatorContext.ipAddress
      });

      await AuditRepository.log(
        schoolId,
        operatorContext.userId,
        operatorContext.userName,
        operatorContext.userRole,
        'REVERSE',
        'COLLECTIONS_ENGINE',
        operatorContext.ipAddress,
        `تم عكس حركة سند التحصيل (${collectionId}) محاسبياً بنجاح. السبب: ${reason}`,
        { affectedRecord: collectionId }
      );

      return reversed;
    });
  }

  /**
   * 7. Archive a collection receipt
   */
  public static async archiveReceipt(
    schoolId: string,
    collectionId: string,
    operatorContext: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<CollectionReceipt> {
    return await UnitOfWork.runInTransaction(schoolId, {
      tenantId: schoolId,
      operationName: `ARCHIVE_COLLECTION_${collectionId}`,
      userId: operatorContext.userId,
      userName: operatorContext.userName,
      ipAddress: operatorContext.ipAddress,
      affectedTables: ['collection_receipts', 'receivable_audits']
    }, async () => {
      const receipt = await CollectionsRepository.getCollectionById(schoolId, collectionId);
      if (!receipt) {
        throw new Error(`سند التحصيل غير موجود: ${collectionId}`);
      }

      const archived = await CollectionStateMachine.transitionCollection(schoolId, collectionId, 'Archived', 'أرشفة السند التاريخي', operatorContext.userName);

      await AuditRepository.log(
        schoolId,
        operatorContext.userId,
        operatorContext.userName,
        operatorContext.userRole,
        'ARCHIVE',
        'COLLECTIONS_ENGINE',
        operatorContext.ipAddress,
        `تم أرشفة سند التحصيل (${collectionId}) بنجاح.`,
        { affectedRecord: collectionId }
      );

      return archived;
    });
  }
}
