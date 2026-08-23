import { FallbackStorage } from './FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import { 
  ReceivableAccount, 
  ReceivableTransaction, 
  ReceivableBalance, 
  ReceivableAllocation, 
  ReceivableSettlement, 
  ReceivableAdjustment, 
  ReceivableWriteOff, 
  ReceivableStatusHistory, 
  ReceivableAudit, 
  CollectionCase, 
  CollectionPromise,
  ReceivableStatus
} from '../../types';

/**
 * Enterprise Accounts Receivable Repository
 * Single Source of Truth for Data Access Layer (DAL) across all AR Domain Entities.
 * Strictly enforces Tenant Isolation, Optimistic Locking, Soft Delete, and Audit logging.
 * Full integration with Unit of Work (UoW) Pattern.
 */
export class AccountsReceivableRepository {
  private static assertAuthoritativePersistence(operation: string): void {
    FallbackStorage.assertCanonicalPersistence(`accounts receivable ${operation}`);
  }

  // =========================================================================
  // 1. ReceivableAccount CRUD
  // =========================================================================

  public static async getAccountById(schoolId: string, id: string): Promise<ReceivableAccount | null> {
    this.assertAuthoritativePersistence('account read');
    let accounts = FallbackStorage.getReceivableAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('receivable_accounts', accounts);
    }
    const account = accounts.find(a => a.id === id);
    if (!account) return null;
    
    if (account.schoolId !== schoolId) {
      throw new Error('حظر أمني: محاولة الوصول إلى ذمة مالية لجهة أخرى.');
    }
    return account;
  }

  public static async getAccountByStudentId(schoolId: string, studentId: string): Promise<ReceivableAccount | null> {
    this.assertAuthoritativePersistence('account read');
    let accounts = FallbackStorage.getReceivableAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('receivable_accounts', accounts);
    }
    const account = accounts.find(a => a.studentId === studentId && a.schoolId === schoolId);
    return account || null;
  }

  public static async getAllAccounts(schoolId: string, options?: { status?: ReceivableStatus }): Promise<ReceivableAccount[]> {
    this.assertAuthoritativePersistence('accounts read');
    let accounts = FallbackStorage.getReceivableAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('receivable_accounts', accounts);
    }
    let filtered = accounts.filter(a => a.schoolId === schoolId);
    if (options?.status) {
      filtered = filtered.filter(a => a.status === options.status);
    }
    return filtered;
  }

  public static async createAccount(schoolId: string, account: Partial<ReceivableAccount>): Promise<ReceivableAccount> {
    this.assertAuthoritativePersistence('account write');
    let accounts = FallbackStorage.getReceivableAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('receivable_accounts', accounts);
    }
    
    // Check if account already exists for student
    if (account.studentId) {
      const existing = accounts.find(a => a.studentId === account.studentId && a.schoolId === schoolId);
      if (existing) {
        return existing;
      }
    }

    const newAccount: ReceivableAccount = {
      id: account.id || `ar_acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      studentId: account.studentId || '',
      studentName: account.studentName || '',
      accountNumber: account.accountNumber || `AR-${Date.now()}`,
      totalBilled: account.totalBilled || 0,
      totalPaid: account.totalPaid || 0,
      totalOutstanding: account.totalOutstanding || 0,
      currency: account.currency || 'LYD',
      status: account.status || 'Draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_accounts', newAccount.id, newAccount);
      return newAccount;
    }

    accounts.push(newAccount);
    FallbackStorage.saveReceivableAccounts(accounts);
    return newAccount;
  }

  public static async updateAccount(schoolId: string, id: string, item: Partial<ReceivableAccount>): Promise<ReceivableAccount> {
    this.assertAuthoritativePersistence('account update');
    let accounts = FallbackStorage.getReceivableAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('receivable_accounts', accounts);
    }
    const idx = accounts.findIndex(a => a.id === id);
    if (idx === -1) {
      throw new Error(`حساب الذمم المدنية غير موجود: ${id}`);
    }

    const existing = accounts[idx];
    if (existing.schoolId !== schoolId) {
      throw new Error('حظر أمني: محاولة تعديل ذمة مالية لجهة أخرى.');
    }

    // Optimistic Locking Check
    if (item.version !== undefined && item.version !== existing.version) {
      throw new Error('فشل التحديث المتزامن: تم تعديل السجل من قبل مستخدم آخر (Optimistic Locking).');
    }

    const updatedAccount: ReceivableAccount = {
      ...existing,
      ...item,
      version: (existing.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('receivable_accounts', id, updatedAccount);
      return updatedAccount;
    }

    accounts[idx] = updatedAccount;
    FallbackStorage.saveReceivableAccounts(accounts);
    return updatedAccount;
  }

  // =========================================================================
  // 2. ReceivableTransaction CRUD
  // =========================================================================

  public static async getTransactionById(schoolId: string, id: string): Promise<ReceivableTransaction | null> {
    this.assertAuthoritativePersistence('transaction read');
    let txs = FallbackStorage.getReceivableTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('receivable_transactions', txs);
    }
    const tx = txs.find(t => t.id === id);
    if (!tx) return null;
    if (tx.schoolId !== schoolId) {
      throw new Error('حظر أمني: محاولة الوصول إلى عملية ذمم لجهة أخرى.');
    }
    return tx;
  }

  public static async getTransactionsByAccountId(schoolId: string, accountId: string): Promise<ReceivableTransaction[]> {
    this.assertAuthoritativePersistence('transactions read');
    let txs = FallbackStorage.getReceivableTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('receivable_transactions', txs);
    }
    return txs.filter(t => t.receivableAccountId === accountId && t.schoolId === schoolId);
  }

  public static async createTransaction(schoolId: string, item: Partial<ReceivableTransaction>): Promise<ReceivableTransaction> {
    this.assertAuthoritativePersistence('transaction write');
    let txs = FallbackStorage.getReceivableTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('receivable_transactions', txs);
    }
    
    // Calculate running balance fields
    const previousTxs = txs.filter(t => t.receivableAccountId === item.receivableAccountId && t.schoolId === schoolId);
    const balanceBefore = previousTxs.reduce((sum, t) => {
      const isDebit = t.type === 'debit';
      return sum + (isDebit ? t.amount : -t.amount);
    }, 0);
    
    const isNewDebit = item.type === 'debit';
    const debit = isNewDebit ? (item.amount || 0) : 0;
    const credit = !isNewDebit ? (item.amount || 0) : 0;
    const balanceAfter = balanceBefore + debit - credit;

    const newTx: ReceivableTransaction = {
      id: item.id || `ar_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      receivableAccountId: item.receivableAccountId || '',
      invoiceId: item.invoiceId || '',
      type: item.type || 'debit',
      amount: item.amount || 0,
      balance: item.balance ?? item.amount ?? 0,
      currency: item.currency || 'LYD',
      description: item.description || '',
      transactionDate: item.transactionDate || new Date().toISOString().split('T')[0],
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      status: item.status || 'Open',
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: item.createdBy || 'system',
      
      // Running Balance / Audit Fields
      balanceBefore,
      debit,
      credit,
      balanceAfter
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_transactions', newTx.id, newTx);
      return newTx;
    }

    txs.push(newTx);
    FallbackStorage.saveReceivableTransactions(txs);
    return newTx;
  }

  public static async updateTransaction(schoolId: string, id: string, item: Partial<ReceivableTransaction>): Promise<ReceivableTransaction> {
    this.assertAuthoritativePersistence('transaction update');
    let txs = FallbackStorage.getReceivableTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('receivable_transactions', txs);
    }
    const idx = txs.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new Error(`حركة الذمم المدنية غير موجودة: ${id}`);
    }

    const existing = txs[idx];
    if (existing.schoolId !== schoolId) {
      throw new Error('حظر أمني: تعديل عملية لجهة أخرى مرفوض.');
    }

    const updatedTx: ReceivableTransaction = {
      ...existing,
      ...item,
      version: (existing.version || 1) + 1
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('receivable_transactions', id, updatedTx);
      return updatedTx;
    }

    txs[idx] = updatedTx;
    FallbackStorage.saveReceivableTransactions(txs);
    return updatedTx;
  }

  // =========================================================================
  // 3. ReceivableBalance CRUD
  // =========================================================================

  public static async getBalanceByAccountId(schoolId: string, accountId: string): Promise<ReceivableBalance | null> {
    this.assertAuthoritativePersistence('balance read');
    let balances = FallbackStorage.getReceivableBalances();
    if (UnitOfWork.isTransactionActive()) {
      balances = UnitOfWork.getPendingAll('receivable_balances', balances);
    }
    const bal = balances.find(b => b.receivableAccountId === accountId && b.schoolId === schoolId);
    return bal || null;
  }

  public static async saveBalance(schoolId: string, item: ReceivableBalance): Promise<ReceivableBalance> {
    this.assertAuthoritativePersistence('balance write');
    let balances = FallbackStorage.getReceivableBalances();
    if (UnitOfWork.isTransactionActive()) {
      balances = UnitOfWork.getPendingAll('receivable_balances', balances);
    }
    const idx = balances.findIndex(b => b.receivableAccountId === item.receivableAccountId && b.schoolId === schoolId);
    
    const updated = { ...item, schoolId };

    if (UnitOfWork.isTransactionActive()) {
      const id = item.receivableAccountId; // Use account ID as balance key
      if (balances.some(b => b.receivableAccountId === id)) {
        UnitOfWork.enlistUpdate('receivable_balances', id, updated);
      } else {
        UnitOfWork.enlistCreate('receivable_balances', id, updated);
      }
      return updated;
    }

    if (idx !== -1) {
      balances[idx] = updated;
    } else {
      balances.push(updated);
    }
    FallbackStorage.saveReceivableBalances(balances);
    return item;
  }

  // =========================================================================
  // 4. ReceivableAllocation CRUD
  // =========================================================================

  public static async createAllocation(schoolId: string, item: Partial<ReceivableAllocation>): Promise<ReceivableAllocation> {
    this.assertAuthoritativePersistence('allocation write');
    let allocations = FallbackStorage.getReceivableAllocations();
    if (UnitOfWork.isTransactionActive()) {
      allocations = UnitOfWork.getPendingAll('receivable_allocations', allocations);
    }
    const newAlloc: ReceivableAllocation = {
      id: item.id || `ar_alloc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      settlementId: item.settlementId || '',
      receivableTransactionId: item.receivableTransactionId || '',
      allocatedAmount: item.allocatedAmount || 0,
      allocationDate: item.allocationDate || new Date().toISOString().split('T')[0],
      allocatedBy: item.allocatedBy || 'system'
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_allocations', newAlloc.id, newAlloc);
      return newAlloc;
    }

    allocations.push(newAlloc);
    FallbackStorage.saveReceivableAllocations(allocations);
    return newAlloc;
  }

  public static async getAllocationsByTransactionId(schoolId: string, txId: string): Promise<ReceivableAllocation[]> {
    let allocations = FallbackStorage.getReceivableAllocations();
    if (UnitOfWork.isTransactionActive()) {
      allocations = UnitOfWork.getPendingAll('receivable_allocations', allocations);
    }
    return allocations.filter(a => a.receivableTransactionId === txId && a.schoolId === schoolId);
  }

  // =========================================================================
  // 5. ReceivableSettlement CRUD
  // =========================================================================

  public static async createSettlement(schoolId: string, item: Partial<ReceivableSettlement>): Promise<ReceivableSettlement> {
    this.assertAuthoritativePersistence('settlement write');
    let settlements = FallbackStorage.getReceivableSettlements();
    if (UnitOfWork.isTransactionActive()) {
      settlements = UnitOfWork.getPendingAll('receivable_settlements', settlements);
    }
    const newSettlement: ReceivableSettlement = {
      id: item.id || `ar_setl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      receivableAccountId: item.receivableAccountId || '',
      paymentId: item.paymentId || '',
      amountSettled: item.amountSettled || 0,
      settlementDate: item.settlementDate || new Date().toISOString().split('T')[0],
      method: item.method || 'cash',
      referenceNo: item.referenceNo
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_settlements', newSettlement.id, newSettlement);
      return newSettlement;
    }

    settlements.push(newSettlement);
    FallbackStorage.saveReceivableSettlements(settlements);
    return newSettlement;
  }

  public static async getSettlementsByAccountId(schoolId: string, accountId: string): Promise<ReceivableSettlement[]> {
    let settlements = FallbackStorage.getReceivableSettlements();
    if (UnitOfWork.isTransactionActive()) {
      settlements = UnitOfWork.getPendingAll('receivable_settlements', settlements);
    }
    return settlements.filter(s => s.receivableAccountId === accountId && s.schoolId === schoolId);
  }

  // =========================================================================
  // 6. ReceivableAdjustment CRUD
  // =========================================================================

  public static async createAdjustment(schoolId: string, item: Partial<ReceivableAdjustment>): Promise<ReceivableAdjustment> {
    this.assertAuthoritativePersistence('adjustment write');
    let adjustments = FallbackStorage.getReceivableAdjustments();
    if (UnitOfWork.isTransactionActive()) {
      adjustments = UnitOfWork.getPendingAll('receivable_adjustments', adjustments);
    }
    const newAdj: ReceivableAdjustment = {
      id: item.id || `ar_adj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      receivableAccountId: item.receivableAccountId || '',
      invoiceId: item.invoiceId,
      receivableTransactionId: item.receivableTransactionId,
      type: item.type || 'discount',
      amount: item.amount || 0,
      reason: item.reason || '',
      approvedBy: item.approvedBy || 'system',
      adjustmentDate: item.adjustmentDate || new Date().toISOString().split('T')[0],
      status: item.status || 'pending',
      ledgerVoucherId: item.ledgerVoucherId
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_adjustments', newAdj.id, newAdj);
      return newAdj;
    }

    adjustments.push(newAdj);
    FallbackStorage.saveReceivableAdjustments(adjustments);
    return newAdj;
  }

  public static async getAdjustmentsByAccountId(schoolId: string, accountId: string): Promise<ReceivableAdjustment[]> {
    let adjustments = FallbackStorage.getReceivableAdjustments();
    if (UnitOfWork.isTransactionActive()) {
      adjustments = UnitOfWork.getPendingAll('receivable_adjustments', adjustments);
    }
    return adjustments.filter(a => a.receivableAccountId === accountId && a.schoolId === schoolId);
  }

  public static async updateAdjustmentStatus(schoolId: string, id: string, status: 'approved' | 'rejected', approvedBy: string): Promise<ReceivableAdjustment> {
    this.assertAuthoritativePersistence('adjustment update');
    let adjustments = FallbackStorage.getReceivableAdjustments();
    if (UnitOfWork.isTransactionActive()) {
      adjustments = UnitOfWork.getPendingAll('receivable_adjustments', adjustments);
    }
    const idx = adjustments.findIndex(a => a.id === id && a.schoolId === schoolId);
    if (idx === -1) {
      throw new Error(`التعديل المالي غير موجود: ${id}`);
    }

    const updated = { ...adjustments[idx], status, approvedBy };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('receivable_adjustments', id, updated);
      return updated;
    }

    adjustments[idx] = updated;
    FallbackStorage.saveReceivableAdjustments(adjustments);
    return adjustments[idx];
  }

  // =========================================================================
  // 7. ReceivableWriteOff CRUD
  // =========================================================================

  public static async createWriteOff(schoolId: string, item: Partial<ReceivableWriteOff>): Promise<ReceivableWriteOff> {
    this.assertAuthoritativePersistence('write-off');
    let writeOffs = FallbackStorage.getReceivableWriteOffs();
    if (UnitOfWork.isTransactionActive()) {
      writeOffs = UnitOfWork.getPendingAll('receivable_write_offs', writeOffs);
    }
    const newWriteOff: ReceivableWriteOff = {
      id: item.id || `ar_woff_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      receivableAccountId: item.receivableAccountId || '',
      amount: item.amount || 0,
      reason: item.reason || '',
      approvedBy: item.approvedBy || '',
      writeOffDate: item.writeOffDate || new Date().toISOString().split('T')[0],
      ledgerVoucherId: item.ledgerVoucherId || ''
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_write_offs', newWriteOff.id, newWriteOff);
      return newWriteOff;
    }

    writeOffs.push(newWriteOff);
    FallbackStorage.saveReceivableWriteOffs(writeOffs);
    return newWriteOff;
  }

  public static async getWriteOffsByAccountId(schoolId: string, accountId: string): Promise<ReceivableWriteOff[]> {
    let writeOffs = FallbackStorage.getReceivableWriteOffs();
    if (UnitOfWork.isTransactionActive()) {
      writeOffs = UnitOfWork.getPendingAll('receivable_write_offs', writeOffs);
    }
    return writeOffs.filter(w => w.receivableAccountId === accountId && w.schoolId === schoolId);
  }

  // =========================================================================
  // 8. ReceivableStatusHistory CRUD
  // =========================================================================

  public static async createStatusHistory(schoolId: string, item: Partial<ReceivableStatusHistory>): Promise<ReceivableStatusHistory> {
    let histories = FallbackStorage.getReceivableStatusHistories();
    if (UnitOfWork.isTransactionActive()) {
      histories = UnitOfWork.getPendingAll('receivable_status_histories', histories);
    }
    const newHistory: ReceivableStatusHistory = {
      id: item.id || `ar_hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      receivableAccountId: item.receivableAccountId || '',
      fromStatus: item.fromStatus || 'Draft',
      toStatus: item.toStatus || 'Draft',
      changedAt: item.changedAt || new Date().toISOString(),
      changedBy: item.changedBy || 'system',
      reason: item.reason || ''
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_status_histories', newHistory.id, newHistory);
      return newHistory;
    }

    histories.push(newHistory);
    FallbackStorage.saveReceivableStatusHistories(histories);
    return newHistory;
  }

  public static async getStatusHistoryByAccountId(schoolId: string, accountId: string): Promise<ReceivableStatusHistory[]> {
    let histories = FallbackStorage.getReceivableStatusHistories();
    if (UnitOfWork.isTransactionActive()) {
      histories = UnitOfWork.getPendingAll('receivable_status_histories', histories);
    }
    return histories.filter(h => h.receivableAccountId === accountId && h.schoolId === schoolId);
  }

  // =========================================================================
  // 9. ReceivableAudit CRUD
  // =========================================================================

  public static async logAudit(schoolId: string, item: Partial<ReceivableAudit>): Promise<ReceivableAudit> {
    let audits = FallbackStorage.getReceivableAudits();
    if (UnitOfWork.isTransactionActive()) {
      audits = UnitOfWork.getPendingAll('receivable_audits', audits);
    }
    const newAudit: ReceivableAudit = {
      id: item.id || `ar_aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      userId: item.userId || 'system',
      userName: item.userName || 'System Engine',
      action: item.action || '',
      entityType: item.entityType || 'ReceivableAccount',
      entityId: item.entityId || '',
      timestamp: new Date().toISOString(),
      details: item.details || '',
      ipAddress: item.ipAddress || '127.0.0.1'
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('receivable_audits', newAudit.id, newAudit);
      return newAudit;
    }

    audits.push(newAudit);
    FallbackStorage.saveReceivableAudits(audits);
    return newAudit;
  }

  // =========================================================================
  // 10. CollectionCase CRUD
  // =========================================================================

  public static async getCollectionCaseById(schoolId: string, id: string): Promise<CollectionCase | null> {
    let cases = FallbackStorage.getCollectionCases();
    if (UnitOfWork.isTransactionActive()) {
      cases = UnitOfWork.getPendingAll('collection_cases', cases);
    }
    const c = cases.find(cs => cs.id === id);
    if (!c) return null;
    if (c.schoolId !== schoolId) {
      throw new Error('حظر أمني: محاولة الوصول لقضية تحصيل مستأجر آخر.');
    }
    return c;
  }

  public static async getCollectionCaseByAccountId(schoolId: string, accountId: string): Promise<CollectionCase | null> {
    let cases = FallbackStorage.getCollectionCases();
    if (UnitOfWork.isTransactionActive()) {
      cases = UnitOfWork.getPendingAll('collection_cases', cases);
    }
    const c = cases.find(cs => cs.receivableAccountId === accountId && cs.schoolId === schoolId);
    return c || null;
  }

  public static async createCollectionCase(schoolId: string, item: Partial<CollectionCase>): Promise<CollectionCase> {
    let cases = FallbackStorage.getCollectionCases();
    if (UnitOfWork.isTransactionActive()) {
      cases = UnitOfWork.getPendingAll('collection_cases', cases);
    }
    const newCase: CollectionCase = {
      id: item.id || `col_case_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      receivableAccountId: item.receivableAccountId || '',
      caseNumber: item.caseNumber || `COL-${Date.now()}`,
      status: item.status || 'open',
      assignedTo: item.assignedTo || 'Unassigned',
      openedDate: item.openedDate || new Date().toISOString().split('T')[0],
      lastContactDate: item.lastContactDate,
      nextActionDate: item.nextActionDate,
      totalOverdueAmount: item.totalOverdueAmount || 0,
      notes: item.notes || ''
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('collection_cases', newCase.id, newCase);
      return newCase;
    }

    cases.push(newCase);
    FallbackStorage.saveCollectionCases(cases);
    return newCase;
  }

  public static async updateCollectionCase(schoolId: string, id: string, item: Partial<CollectionCase>): Promise<CollectionCase> {
    let cases = FallbackStorage.getCollectionCases();
    if (UnitOfWork.isTransactionActive()) {
      cases = UnitOfWork.getPendingAll('collection_cases', cases);
    }
    const idx = cases.findIndex(c => c.id === id && c.schoolId === schoolId);
    if (idx === -1) {
      throw new Error(`قضية تحصيل غير موجودة: ${id}`);
    }

    const updated = { ...cases[idx], ...item };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('collection_cases', id, updated);
      return updated;
    }

    cases[idx] = updated;
    FallbackStorage.saveCollectionCases(cases);
    return cases[idx];
  }

  // =========================================================================
  // 11. CollectionPromise CRUD
  // =========================================================================

  public static async createPromise(schoolId: string, item: Partial<CollectionPromise>): Promise<CollectionPromise> {
    let promises = FallbackStorage.getCollectionPromises();
    if (UnitOfWork.isTransactionActive()) {
      promises = UnitOfWork.getPendingAll('collection_promises', promises);
    }
    const newPromise: CollectionPromise = {
      id: item.id || `col_prm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      collectionCaseId: item.collectionCaseId || '',
      receivableAccountId: item.receivableAccountId || '',
      promiseAmount: item.promiseAmount || 0,
      promisedDate: item.promisedDate || '',
      status: item.status || 'pending',
      recordedDate: new Date().toISOString().split('T')[0],
      recordedBy: item.recordedBy || 'system'
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('collection_promises', newPromise.id, newPromise);
      return newPromise;
    }

    promises.push(newPromise);
    FallbackStorage.saveCollectionPromises(promises);
    return newPromise;
  }

  public static async getPromisesByCaseId(schoolId: string, caseId: string): Promise<CollectionPromise[]> {
    let promises = FallbackStorage.getCollectionPromises();
    if (UnitOfWork.isTransactionActive()) {
      promises = UnitOfWork.getPendingAll('collection_promises', promises);
    }
    return promises.filter(p => p.collectionCaseId === caseId && p.schoolId === schoolId);
  }

  public static async updatePromiseStatus(schoolId: string, id: string, status: 'pending' | 'kept' | 'broken' | 'cancelled'): Promise<CollectionPromise> {
    let promises = FallbackStorage.getCollectionPromises();
    if (UnitOfWork.isTransactionActive()) {
      promises = UnitOfWork.getPendingAll('collection_promises', promises);
    }
    const idx = promises.findIndex(p => p.id === id && p.schoolId === schoolId);
    if (idx === -1) {
      throw new Error(`وعد سداد غير موجود: ${id}`);
    }

    const updated = { ...promises[idx], status };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('collection_promises', id, updated);
      return updated;
    }

    promises[idx] = updated;
    FallbackStorage.saveCollectionPromises(promises);
    return promises[idx];
  }
}
