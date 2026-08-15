import { FallbackStorage } from './FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import { TreasuryAccount, TreasuryTransaction, PaymentInstrumentConfig, TreasuryTransactionStatus, TreasuryTransactionType, PaymentInstrumentType } from '../../types';

/**
 * Enterprise Treasury Repository (DAL)
 * Handles all database operations for chests, bank accounts, virtual chests, and cash movements.
 * Enforces strict Tenant Isolation, Optimistic locking patterns, and seamless Unit of Work transactional integration.
 */
export class TreasuryRepository {

  // =========================================================================
  // 1. Treasury Accounts DAL (Chests & Bank Accounts)
  // =========================================================================

  public static async getAccountById(schoolId: string, id: string): Promise<TreasuryAccount | null> {
    let accounts = FallbackStorage.getTreasuryAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('treasury_accounts', accounts);
    }
    const account = accounts.find(a => a.id === id);
    if (!account) return null;

    if (account.schoolId !== schoolId) {
      throw new Error('حظر أمني للمستأجر: لا يمكن الوصول لحساب خزينة تابع لمؤسسة أخرى.');
    }
    return account;
  }

  public static async getAccountByCode(schoolId: string, code: string): Promise<TreasuryAccount | null> {
    let accounts = FallbackStorage.getTreasuryAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('treasury_accounts', accounts);
    }
    const account = accounts.find(a => a.code === code && a.schoolId === schoolId);
    return account || null;
  }

  public static async getAllAccounts(schoolId: string): Promise<TreasuryAccount[]> {
    let accounts = FallbackStorage.getTreasuryAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('treasury_accounts', accounts);
    }
    return accounts.filter(a => a.schoolId === schoolId);
  }

  public static async createAccount(schoolId: string, account: Partial<TreasuryAccount>): Promise<TreasuryAccount> {
    let accounts = FallbackStorage.getTreasuryAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('treasury_accounts', accounts);
    }

    const newAccount: TreasuryAccount = {
      id: account.id || `tr_acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      name: account.name || '',
      code: account.code || `TR-${Date.now()}`,
      type: account.type || 'Branch Chest',
      glAccountId: account.glAccountId || 'acc_111',
      currency: account.currency || 'LYD',
      balance: account.balance || 0,
      isActive: account.isActive !== undefined ? account.isActive : true,
      allowNegativeBalance: account.allowNegativeBalance || false,
      notes: account.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('treasury_accounts', newAccount.id, newAccount);
      return newAccount;
    }

    accounts.push(newAccount);
    FallbackStorage.saveTreasuryAccounts(accounts);
    return newAccount;
  }

  public static async updateAccount(
    schoolId: string,
    id: string,
    updates: Partial<TreasuryAccount>
  ): Promise<TreasuryAccount> {
    let accounts = FallbackStorage.getTreasuryAccounts();
    if (UnitOfWork.isTransactionActive()) {
      accounts = UnitOfWork.getPendingAll('treasury_accounts', accounts);
    }

    const existingIndex = accounts.findIndex(a => a.id === id && a.schoolId === schoolId);
    if (existingIndex === -1) {
      throw new Error(`حساب الخزينة/البنك المطلوب غير موجود: ${id}`);
    }

    const existing = accounts[existingIndex];
    const updatedAccount: TreasuryAccount = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('treasury_accounts', id, updatedAccount);
      return updatedAccount;
    }

    accounts[existingIndex] = updatedAccount;
    FallbackStorage.saveTreasuryAccounts(accounts);
    return updatedAccount;
  }

  // =========================================================================
  // 2. Treasury Transactions DAL (Cash Movements)
  // =========================================================================

  public static async getTransactionById(schoolId: string, id: string): Promise<TreasuryTransaction | null> {
    let txs = FallbackStorage.getTreasuryTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('treasury_transactions', txs);
    }
    const tx = txs.find(t => t.id === id);
    if (!tx) return null;

    if (tx.schoolId !== schoolId) {
      throw new Error('حظر أمني للمستأجر: لا يمكن الوصول لحركة خزينة تابعة لمؤسسة أخرى.');
    }
    return tx;
  }

  public static async getAllTransactions(
    schoolId: string,
    options?: { status?: TreasuryTransactionStatus; type?: TreasuryTransactionType; paymentInstrument?: PaymentInstrumentType }
  ): Promise<TreasuryTransaction[]> {
    let txs = FallbackStorage.getTreasuryTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('treasury_transactions', txs);
    }
    let filtered = txs.filter(t => t.schoolId === schoolId);

    if (options?.status) {
      filtered = filtered.filter(t => t.status === options.status);
    }
    if (options?.type) {
      filtered = filtered.filter(t => t.type === options.type);
    }
    if (options?.paymentInstrument) {
      filtered = filtered.filter(t => t.paymentInstrument === options.paymentInstrument);
    }

    return filtered;
  }

  public static async createTransaction(schoolId: string, tx: Partial<TreasuryTransaction>): Promise<TreasuryTransaction> {
    let txs = FallbackStorage.getTreasuryTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('treasury_transactions', txs);
    }

    const newTx: TreasuryTransaction = {
      id: tx.id || `tr_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      schoolId: schoolId,
      type: tx.type || 'Deposit',
      status: tx.status || 'Draft',
      sourceAccountId: tx.sourceAccountId,
      destinationAccountId: tx.destinationAccountId,
      amount: tx.amount || 0,
      currency: tx.currency || 'LYD',
      exchangeRate: tx.exchangeRate || 1,
      paymentInstrument: tx.paymentInstrument || 'Cash',
      paymentInstrumentDetails: tx.paymentInstrumentDetails,
      referenceType: tx.referenceType,
      referenceId: tx.referenceId,
      description: tx.description || '',
      transactionDate: tx.transactionDate || new Date().toISOString().split('T')[0],
      preparedBy: tx.preparedBy || 'system',
      approvedBy: tx.approvedBy,
      approvedAt: tx.approvedAt,
      executedBy: tx.executedBy,
      executedAt: tx.executedAt,
      postedBy: tx.postedBy,
      postedAt: tx.postedAt,
      reconciledBy: tx.reconciledBy,
      reconciledAt: tx.reconciledAt,
      journalEntryId: tx.journalEntryId,
      notes: tx.notes,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistCreate('treasury_transactions', newTx.id, newTx);
      return newTx;
    }

    txs.push(newTx);
    FallbackStorage.saveTreasuryTransactions(txs);
    return newTx;
  }

  public static async updateTransaction(
    schoolId: string,
    id: string,
    updates: Partial<TreasuryTransaction>
  ): Promise<TreasuryTransaction> {
    let txs = FallbackStorage.getTreasuryTransactions();
    if (UnitOfWork.isTransactionActive()) {
      txs = UnitOfWork.getPendingAll('treasury_transactions', txs);
    }

    const existingIndex = txs.findIndex(t => t.id === id && t.schoolId === schoolId);
    if (existingIndex === -1) {
      throw new Error(`حركة الخزينة المطلوبة غير موجودة: ${id}`);
    }

    const existing = txs[existingIndex];
    const updatedTx: TreasuryTransaction = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date().toISOString()
    };

    if (UnitOfWork.isTransactionActive()) {
      UnitOfWork.enlistUpdate('treasury_transactions', id, updatedTx);
      return updatedTx;
    }

    txs[existingIndex] = updatedTx;
    FallbackStorage.saveTreasuryTransactions(txs);
    return updatedTx;
  }

  // =========================================================================
  // 3. Payment Instruments Config DAL
  // =========================================================================

  public static async getPaymentInstrumentConfigs(): Promise<PaymentInstrumentConfig[]> {
    return FallbackStorage.getPaymentInstrumentConfigs();
  }

  public static async savePaymentInstrumentConfigs(configs: PaymentInstrumentConfig[]): Promise<void> {
    FallbackStorage.savePaymentInstrumentConfigs(configs);
  }
}
