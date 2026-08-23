import { FallbackStorage } from './repositories/FallbackStorage';
import { EnterpriseLogger } from './services/EnterpriseLogger';
import { ParameterizedCommand } from './transactions/SQLCommand';
import type {
  TransactionBeginOptions,
  TransactionDriver,
  TransactionSession,
} from './transactions/TransactionContracts';

type AsyncContextStorage<T> = {
  run<R>(store: T, callback: () => R): R;
  getStore(): T | undefined;
  enterWith(store: T): void;
};

/**
 * Node's AsyncLocalStorage is loaded only when the runtime provides require;
 * this keeps the client bundle free of a Node-only module. The browser
 * fallback preserves the same lifecycle API for single request flows.
 */
class BrowserAsyncContextStorage<T> implements AsyncContextStorage<T> {
  private current: T | undefined;

  public run<R>(store: T, callback: () => R): R {
    const previous = this.current;
    this.current = store;

    try {
      const result = callback();
      if (result && typeof (result as any).then === 'function') {
        return Promise.resolve(result).finally(() => {
          if (this.current === store) this.current = previous;
        }) as R;
      }
      this.current = previous;
      return result;
    } catch (error) {
      this.current = previous;
      throw error;
    }
  }

  public getStore(): T | undefined {
    return this.current;
  }

  public enterWith(store: T): void {
    this.current = store;
  }
}

function createAsyncContextStorage<T>(): AsyncContextStorage<T> {
  // `tsx` runs this module as native ESM, where `require` is undefined. The
  // old check therefore selected the browser fallback in the server and made
  // concurrent requests share one mutable transaction context. Node 22+
  // exposes built-in modules without a static import, which keeps the client
  // bundle free of a Node-only dependency while giving the server real
  // request-local async context isolation.
  const runtimeProcess = (globalThis as typeof globalThis & {
    process?: { getBuiltinModule?: (name: string) => unknown };
  }).process;
  const asyncHooks = runtimeProcess?.getBuiltinModule?.('node:async_hooks') as {
    AsyncLocalStorage?: new <S>() => AsyncContextStorage<S>;
  } | undefined;
  if (asyncHooks?.AsyncLocalStorage) {
    return new asyncHooks.AsyncLocalStorage<T>();
  }

  const runtimeRequire = typeof require === 'function' ? require : undefined;
  if (runtimeRequire) {
    const { AsyncLocalStorage } = runtimeRequire('node:async_hooks') as typeof import('node:async_hooks');
    return new AsyncLocalStorage<T>() as unknown as AsyncContextStorage<T>;
  }
  return new BrowserAsyncContextStorage<T>();
}

/**
 * Interface representing a single, logical transaction context.
 * Maintains isolated changes for Read-Your-Own-Writes consistency before committing.
 */
export interface TransactionContext {
  id: string;
  isActive: boolean;
  tenantId?: string;
  schoolId: string;
  databaseTransaction?: TransactionSession;
  // collections store pending changes
  pendingChanges: {
    [collectionName: string]: {
      added: Map<string, any>;
      updated: Map<string, any>;
      deleted: Set<string>;
    };
  };
  // Holds parameterized SQL queries
  sqlQueries: (ParameterizedCommand | string)[];
  // Metadata for audit logs / TransactionService
  metadata?: {
    operationName: string;
    scope?: 'tenant' | 'platform';
    userId: string;
    userName: string;
    ipAddress: string;
    affectedTables: string[];
    tenantContext?: {
      tenantId: string;
      schoolId: string;
      branchId: string;
      academicYear: string;
      userId: string;
      role: string;
    };
    diagnosticTrace?: {
      mark(stage: string): void;
    };
  };
}

/**
 * Enterprise Unit of Work (UoW) Pattern Implementation.
 * Groups multiple repository operations into a single transactional unit.
 */
export class UnitOfWork {
  /**
   * The transaction context must follow the current async request chain.
   * A process-wide static value allows concurrent requests to observe and
   * mutate one another's pending changes.
   */
  private static readonly transactionStorage = createAsyncContextStorage<TransactionContext | null>();
  private static transactionDriver: TransactionDriver | null = null;

  public static configureTransactionDriver(driver: TransactionDriver | null): void {
    if (this.isTransactionActive()) {
      throw new Error('Cannot change the transaction driver while a UnitOfWork is active.');
    }
    this.transactionDriver = driver;
  }

  public static hasTransactionDriver(): boolean {
    return this.transactionDriver !== null;
  }

  private static setActiveContext(ctx: TransactionContext | null) {
    this.transactionStorage.enterWith(ctx);
  }

  private static getActiveContextInternal(): TransactionContext | null {
    return this.transactionStorage.getStore() ?? null;
  }

  private static createContext(schoolId: string, metadata?: TransactionContext['metadata'] & { tenantId?: string }): TransactionContext {
    const newContext: TransactionContext = {
      id: `uow_tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      isActive: true,
      tenantId: metadata?.tenantId,
      schoolId,
      pendingChanges: {},
      sqlQueries: [],
      metadata
    };

    // Initialize collections
    const collections = [
      'students', 'invoices', 'exams_database', 'teachers', 'employees',
      'inventory', 'buses', 'audit_logs', 'attendance', 'uniforms', 'library',
      'guardians', 'student_guardians', 'student_medical_records', 'student_transportation',
      'student_library_accounts', 'student_uniform_accounts', 'student_assets',
      'student_documents', 'student_contacts',
      'receivable_accounts', 'receivable_transactions', 'receivable_balances',
      'receivable_allocations', 'receivable_settlements', 'receivable_adjustments',
      'receivable_write_offs', 'receivable_status_histories', 'receivable_audits',
      'collection_cases', 'collection_promises'
    ];
    for (const col of collections) {
      newContext.pendingChanges[col] = {
        added: new Map(),
        updated: new Map(),
        deleted: new Set()
      };
    }

    newContext.sqlQueries.push(`BEGIN; -- Initializing Unit of Work Transaction ${newContext.id}`);
    return newContext;
  }

  /**
   * Starts a new transaction context for the current execution thread.
   * If a transaction is already active, throws an error or joins it depending on requirements.
   */
  public static begin(schoolId: string, metadata?: TransactionContext['metadata']): TransactionContext {
    if (this.transactionDriver) {
      throw new Error('Use runInTransaction for server-side database transactions.');
    }
    const activeContext = this.getActiveContextInternal();
    if (activeContext && activeContext.isActive) {
      throw new Error("A transaction is already active on this execution thread.");
    }

    const newContext = this.createContext(schoolId, metadata);
    this.setActiveContext(newContext);
    return newContext;
  }

  /**
   * Helper to run a block of work inside a transaction.
   * Handles automatic commit/rollback on success/failure.
   */
  public static async runInTransaction<T>(
    schoolId: string,
    metadata: TransactionContext['metadata'] & { tenantId: string },
    work: () => Promise<T> | T,
    trustedContext?: NonNullable<TransactionContext['metadata']>['tenantContext']
  ): Promise<T> {
    const activeContext = this.getActiveContextInternal();
    if (activeContext?.isActive) {
      throw new Error('Nested UnitOfWork is prohibited.');
    }

    const context = this.createContext(schoolId, {
      ...metadata,
      ...(trustedContext ? { tenantContext: trustedContext } : {})
    });
    return this.transactionStorage.run(context, async () => {
      try {
        if (this.transactionDriver) {
          metadata.diagnosticTrace?.mark(metadata.operationName === 'Canonical Student Read'
            ? 'student_transaction_requested'
            : metadata.operationName === 'TenantEngine authenticated lookup'
              ? 'tenant_transaction_requested'
              : 'transaction_requested');
          metadata.diagnosticTrace?.mark(metadata.operationName === 'Canonical Student Read'
            ? 'student_transaction_started'
            : metadata.operationName === 'TenantEngine authenticated lookup'
              ? 'tenant_transaction_started'
              : 'transaction_started');
          const beginOptions: TransactionBeginOptions = {
            transactionId: context.id,
            scope: 'tenant',
            tenantId: metadata.tenantId,
            schoolId,
            operationName: metadata.operationName,
            trustedContext: context.metadata?.tenantContext,
            diagnosticTrace: metadata.diagnosticTrace,
            diagnosticPrefix: metadata.operationName === 'Canonical Student Read' ? 'student_' : metadata.operationName === 'TenantEngine authenticated lookup' ? 'tenant_' : undefined,
          };
          context.databaseTransaction = await this.transactionDriver.begin(beginOptions);
          metadata.diagnosticTrace?.mark(metadata.operationName === 'Canonical Student Read'
            ? 'student_transaction_acquired'
            : metadata.operationName === 'TenantEngine authenticated lookup'
              ? 'tenant_transaction_acquired'
              : 'transaction_acquired');
        }
        const result = await work();
        await this.commit();
        return result;
      } catch (error) {
        if (this.isTransactionActive()) {
          await this.rollback();
        }
        throw error;
      }
    });
  }

  /**
   * Runs a deployment/platform-scoped transaction without fabricating tenant or school scope.
   * Platform RBAC reads and writes must use this boundary and must never inherit tenant context.
   */
  public static async runPlatformInTransaction<T>(
    metadata: Omit<NonNullable<TransactionContext['metadata']>, 'tenantContext' | 'scope'> & { scope: 'platform' },
    work: () => Promise<T> | T,
  ): Promise<T> {
    const activeContext = this.getActiveContextInternal();
    if (activeContext?.isActive) {
      throw new Error('Nested UnitOfWork is prohibited.');
    }

    const context = this.createContext('', metadata);
    return this.transactionStorage.run(context, async () => {
      try {
        if (this.transactionDriver) {
          metadata.diagnosticTrace?.mark('platform_transaction_requested');
          metadata.diagnosticTrace?.mark('platform_transaction_started');
          const beginOptions: TransactionBeginOptions = {
            transactionId: context.id,
            scope: 'platform',
            operationName: metadata.operationName,
            diagnosticTrace: metadata.diagnosticTrace,
            diagnosticPrefix: 'platform_',
          };
          context.databaseTransaction = await this.transactionDriver.begin(beginOptions);
          metadata.diagnosticTrace?.mark('platform_transaction_acquired');
        }
        const result = await work();
        await this.commit();
        return result;
      } catch (error) {
        if (this.isTransactionActive()) {
          await this.rollback();
        }
        throw error;
      }
    });
  }

  /**
   * Checks if a transaction is currently active on the current execution flow.
   */
  public static isTransactionActive(): boolean {
    const store = this.getActiveContextInternal();
    return !!(store && store.isActive);
  }

  /**
   * Retrieves the active transaction context.
   */
  public static getActiveContext(): TransactionContext | null {
    return this.getActiveContextInternal();
  }

  // --- REPOSITORY ENLISTMENT API ---

  private static getCollectionContext(col: string): { added: Map<string, any>; updated: Map<string, any>; deleted: Set<string> } {
    const store = this.getActiveContextInternal();
    if (!store) throw new Error("No active transaction context found.");
    if (!store.pendingChanges[col]) {
      store.pendingChanges[col] = {
        added: new Map(),
        updated: new Map(),
        deleted: new Set()
      };
    }
    return store.pendingChanges[col];
  }

  /**
   * Enlists a 'Create' operation in the active transaction context.
   */
  public static enlistCreate(col: string, id: string, item: any, command?: ParameterizedCommand) {
    if (this.getActiveContextInternal()?.databaseTransaction && !command) {
      throw new Error(`Repository write for ${col} requires a parameterized command inside a database transaction.`);
    }
    const ctx = this.getCollectionContext(col);
    ctx.added.set(id, item);
    ctx.deleted.delete(id); // Undo any previous deletion in same transaction

    const store = this.getActiveContextInternal()!;
    if (command) {
      store.sqlQueries.push(command);
    } else {
      store.sqlQueries.push({
        sqlText: `INSERT INTO ${col} (id, data) VALUES ($1, $2);`,
        parameters: [id, JSON.stringify(item)],
        parameterTypes: ['string', 'string'],
        executionContext: 'Default Insert'
      });
    }
  }

  /**
   * Enlists an 'Update' operation in the active transaction context.
   */
  public static enlistUpdate(col: string, id: string, item: any, command?: ParameterizedCommand) {
    if (this.getActiveContextInternal()?.databaseTransaction && !command) {
      throw new Error(`Repository write for ${col} requires a parameterized command inside a database transaction.`);
    }
    const ctx = this.getCollectionContext(col);
    
    // If it was added in the same transaction, update the added map directly
    if (ctx.added.has(id)) {
      ctx.added.set(id, { ...ctx.added.get(id), ...item });
    } else {
      const existingUpdate = ctx.updated.get(id) || {};
      ctx.updated.set(id, { ...existingUpdate, ...item });
    }

    const store = this.getActiveContextInternal()!;
    if (command) {
      store.sqlQueries.push(command);
    } else {
      store.sqlQueries.push({
        sqlText: `UPDATE ${col} SET data = data || $1 WHERE id = $2;`,
        parameters: [JSON.stringify(item), id],
        parameterTypes: ['string', 'string'],
        executionContext: 'Default Update'
      });
    }
  }

  /**
   * Enlists a 'Delete' operation in the active transaction context.
   */
  public static enlistDelete(col: string, id: string, command?: ParameterizedCommand) {
    if (this.getActiveContextInternal()?.databaseTransaction && !command) {
      throw new Error(`Repository write for ${col} requires a parameterized command inside a database transaction.`);
    }
    const ctx = this.getCollectionContext(col);
    
    if (ctx.added.has(id)) {
      ctx.added.delete(id); // Discard uncommitted added item
    } else {
      ctx.deleted.add(id);
      ctx.updated.delete(id);
    }

    const store = this.getActiveContextInternal()!;
    if (command) {
      store.sqlQueries.push(command);
    } else {
      store.sqlQueries.push({
        sqlText: `DELETE FROM ${col} WHERE id = $1;`,
        parameters: [id],
        parameterTypes: ['string'],
        executionContext: 'Default Delete'
      });
    }
  }

  /**
   * Fetches an uncommitted item from the active transaction context.
   * Returns { deleted: true } if marked for deletion, { data: item } if found, or undefined.
   */
  public static getPendingById(col: string, id: string): { deleted?: boolean; data?: any } | undefined {
    const store = this.getActiveContextInternal();
    if (!store || !store.isActive) return undefined;

    const ctx = store.pendingChanges[col];
    if (!ctx) return undefined;

    if (ctx.deleted.has(id)) {
      return { deleted: true };
    }
    if (ctx.added.has(id)) {
      return { data: ctx.added.get(id) };
    }
    if (ctx.updated.has(id)) {
      return { data: ctx.updated.get(id) };
    }
    return undefined;
  }

  /**
   * Merges persistent list with the uncommitted changes in the active transaction context.
   */
  public static getPendingAll<T extends { id: string }>(col: string, baseList: T[]): T[] {
    const store = this.getActiveContextInternal();
    if (!store || !store.isActive) return baseList;

    const ctx = store.pendingChanges[col];
    if (!ctx) return baseList;

    // Filter out deleted, replace updated
    let merged = baseList
      .filter(item => !ctx.deleted.has(item.id))
      .map(item => {
        if (ctx.updated.has(item.id)) {
          return { ...item, ...ctx.updated.get(item.id) };
        }
        return item;
      });

    // Append newly added items
    for (const [id, item] of ctx.added.entries()) {
      if (!merged.some(m => m.id === id)) {
        merged.push(item);
      }
    }

    return merged;
  }

  // --- TRANSACTION LIFECYCLE ---

  /**
   * Commits all pending modifications accumulated in the active transaction context.
   * Leverages TransactionService to ensure atomic ACID compliance and GUI feedback.
   */
  public static async commit(): Promise<boolean> {
    const store = this.getActiveContextInternal();
    if (!store || !store.isActive) {
      throw new Error("No active transaction found to commit.");
    }

    EnterpriseLogger.info(`Committing transaction ${store.id}...`, 'UnitOfWork');
    store.sqlQueries.push("COMMIT; -- Persisting changes atomically");

    const metadata = store.metadata || {
      operationName: "عملية مركبة (Unit of Work)",
      userId: "system",
      userName: "النظام المركزي",
      ipAddress: "127.0.0.1",
      affectedTables: Object.keys(store.pendingChanges).filter(
        k => store.pendingChanges[k].added.size > 0 || store.pendingChanges[k].updated.size > 0 || store.pendingChanges[k].deleted.size > 0
      )
    };

    try {
      if (store.databaseTransaction) {
        EnterpriseLogger.info(`Processing PostgreSQL transaction ${store.id}...`, 'UnitOfWork');
        for (const command of store.sqlQueries) {
          if (typeof command === 'string') {
            if (/^\s*(BEGIN|COMMIT|ROLLBACK)\b/i.test(command)) continue;
            await store.databaseTransaction.query(command);
          } else {
            const result = await store.databaseTransaction.query(command.sqlText, command.parameters);
            if (command.failIfNoRows && result.rowCount < 1) {
              throw new Error(`Atomic accounting state transition affected no rows: ${command.executionContext || 'unknown command'}`);
            }
          }
        }
        await store.databaseTransaction.commit();
        await store.databaseTransaction.release();
        store.databaseTransaction = undefined;
      } else {
        EnterpriseLogger.info(`Committing local transaction buffer ${store.id}...`, 'UnitOfWork');
      }

      // Synchronize in-memory fallback state only when no database transaction exists.
      // A server-side PostgreSQL transaction is the source of truth for production writes.
      if (!this.transactionDriver) {
      for (const col of Object.keys(store.pendingChanges)) {
        const { added, updated, deleted } = store.pendingChanges[col];
        if (added.size === 0 && updated.size === 0 && deleted.size === 0) continue;

        const baseList = this.getFallbackCollectionList(col);
        
        // Apply deletions
        let updatedList = baseList.filter((item: any) => !deleted.has(item.id));
        
        // Apply updates
        updatedList = updatedList.map((item: any) => {
          if (updated.has(item.id)) {
            return { ...item, ...updated.get(item.id) };
          }
          return item;
        });

        // Apply additions
        for (const [id, item] of added.entries()) {
          if (!updatedList.some((m: any) => m.id === id)) {
            updatedList.unshift(item);
          }
        }

        // Save back to FallbackStorage
        this.saveFallbackCollectionList(col, updatedList);
      }
      }

      // Mark transaction as successfully finalized
      store.isActive = false;
      this.setActiveContext(null);
      EnterpriseLogger.info(`Transaction ${store.id} committed successfully.`, 'UnitOfWork');
      return true;

    } catch (err: any) {
      EnterpriseLogger.error(`Error during commit, executing rollback: ${err?.message || err}`, 'UnitOfWork', { error: err });
      if (this.isTransactionActive()) {
        await this.rollback();
      }
      throw err;
    }
  }

  /**
   * Aborts all modifications and rolls back to previous state.
   */
  public static async rollback(): Promise<void> {
    const store = this.getActiveContextInternal();
    if (!store || !store.isActive) {
      throw new Error('No active transaction found to roll back.');
    }

    EnterpriseLogger.warn(`Rolling back transaction ${store.id}...`, 'UnitOfWork');
    store.sqlQueries.push("ROLLBACK; -- Discarding all transaction operations");

    try {
      if (store.databaseTransaction) {
        await store.databaseTransaction.rollback();
        await store.databaseTransaction.release();
        store.databaseTransaction = undefined;
      }
    } finally {
      // Local pending changes are discarded by ending the request-scoped context.
      store.isActive = false;
      this.setActiveContext(null);
      EnterpriseLogger.info(`Transaction ${store.id} rolled back successfully.`, 'UnitOfWork');
    }
  }

  // --- FALLBACK STORAGE UTILITIES ---

  private static getFallbackCollectionList(col: string): any[] {
    switch (col) {
      case 'students': return FallbackStorage.getStudents();
      case 'invoices': return FallbackStorage.getInvoices();
      case 'exams_database': return [FallbackStorage.getExams()];
      case 'teachers': return FallbackStorage.getTeachers();
      case 'employees': return FallbackStorage.getEmployees();
      case 'inventory': return FallbackStorage.getInventory();
      case 'buses': return FallbackStorage.getBuses();
      case 'audit_logs': return FallbackStorage.getAuditLogs();
      case 'attendance': return FallbackStorage.getAttendance();
      case 'uniforms': return FallbackStorage.getUniforms();
      case 'library': return FallbackStorage.getLibrary();
      case 'guardians': return FallbackStorage.getGuardians();
      case 'student_guardians': return FallbackStorage.getStudentGuardians();
      case 'student_medical_records': return FallbackStorage.getStudentMedicalRecords();
      case 'student_transportation': return FallbackStorage.getStudentTransportation();
      case 'student_library_accounts': return FallbackStorage.getStudentLibraryAccounts();
      case 'student_uniform_accounts': return FallbackStorage.getStudentUniformAccounts();
      case 'student_assets': return FallbackStorage.getStudentAssets();
      case 'student_documents': return FallbackStorage.getStudentDocuments();
      case 'student_contacts': return FallbackStorage.getStudentContacts();
      case 'journal_entries': return FallbackStorage.getJournalEntries();
      case 'vouchers': return FallbackStorage.getVouchers();
      case 'accounts': return FallbackStorage.getAccounts();
      case 'fiscal_years': return FallbackStorage.getFiscalYears();
      case 'accounting_periods': return FallbackStorage.getAccountingPeriods();
      case 'general_ledger': return FallbackStorage.getGeneralLedgerLines();
      case 'installment_plans': return FallbackStorage.getInstallmentPlans();
      case 'installment_schedules': return FallbackStorage.getInstallmentSchedules();
      case 'installment_items': return FallbackStorage.getInstallmentItems();
      case 'installment_payments': return FallbackStorage.getInstallmentPayments();
      case 'installment_histories': return FallbackStorage.getInstallmentHistories();
      case 'installment_versions': return FallbackStorage.getInstallmentVersions();
      case 'academic_calendars': return FallbackStorage.getAcademicCalendars();
      case 'academic_terms': return FallbackStorage.getAcademicTerms();
      case 'academic_periods': return FallbackStorage.getAcademicPeriods();
      case 'recognition_policies': return FallbackStorage.getRecognitionPolicies();
      case 'recognition_schedules': return FallbackStorage.getRecognitionSchedules();
      case 'recognition_entries': return FallbackStorage.getRecognitionEntries();
      case 'recognition_histories': return FallbackStorage.getRecognitionHistories();
      case 'recognition_adjustments': return FallbackStorage.getRecognitionAdjustments();
      case 'financial_configurations': return FallbackStorage.getFinancialConfigurations();
      case 'financial_configuration_audit_logs': return FallbackStorage.getFinancialConfigurationAuditLogs();
      case 'receivable_accounts': return FallbackStorage.getReceivableAccounts();
      case 'receivable_transactions': return FallbackStorage.getReceivableTransactions();
      case 'receivable_balances': return FallbackStorage.getReceivableBalances();
      case 'receivable_allocations': return FallbackStorage.getReceivableAllocations();
      case 'receivable_settlements': return FallbackStorage.getReceivableSettlements();
      case 'receivable_adjustments': return FallbackStorage.getReceivableAdjustments();
      case 'receivable_write_offs': return FallbackStorage.getReceivableWriteOffs();
      case 'receivable_status_histories': return FallbackStorage.getReceivableStatusHistories();
      case 'receivable_audits': return FallbackStorage.getReceivableAudits();
      case 'collection_cases': return FallbackStorage.getCollectionCases();
      case 'collection_promises': return FallbackStorage.getCollectionPromises();
      case 'collection_receipts': return FallbackStorage.getCollectionReceipts();
      case 'collection_allocations': return FallbackStorage.getCollectionAllocations();
      case 'treasury_accounts': return FallbackStorage.getTreasuryAccounts();
      case 'treasury_transactions': return FallbackStorage.getTreasuryTransactions();
      case 'treasury_transfers': return FallbackStorage.getTreasuryTransfers();
      case 'payment_instruments': return FallbackStorage.getPaymentInstrumentConfigs();
      default: return [];
    }
  }

  private static saveFallbackCollectionList(col: string, list: any[]) {
    switch (col) {
      case 'students': FallbackStorage.saveStudents(list); break;
      case 'invoices': FallbackStorage.saveInvoices(list); break;
      case 'exams_database': FallbackStorage.saveExams(list[0] || {}); break;
      case 'teachers': FallbackStorage.saveTeachers(list); break;
      case 'employees': FallbackStorage.saveEmployees(list); break;
      case 'inventory': FallbackStorage.saveInventory(list); break;
      case 'buses': FallbackStorage.saveBuses(list); break;
      case 'audit_logs': FallbackStorage.saveAuditLogs(list); break;
      case 'attendance': FallbackStorage.saveAttendance(list); break;
      case 'uniforms': FallbackStorage.saveUniforms(list); break;
      case 'library': FallbackStorage.saveLibrary(list); break;
      case 'guardians': FallbackStorage.saveGuardians(list); break;
      case 'student_guardians': FallbackStorage.saveStudentGuardians(list); break;
      case 'student_medical_records': FallbackStorage.saveStudentMedicalRecords(list); break;
      case 'student_transportation': FallbackStorage.saveStudentTransportation(list); break;
      case 'student_library_accounts': FallbackStorage.saveStudentLibraryAccounts(list); break;
      case 'student_uniform_accounts': FallbackStorage.saveStudentUniformAccounts(list); break;
      case 'student_assets': FallbackStorage.saveStudentAssets(list); break;
      case 'student_documents': FallbackStorage.saveStudentDocuments(list); break;
      case 'student_contacts': FallbackStorage.saveStudentContacts(list); break;
      case 'journal_entries': FallbackStorage.saveJournalEntries(list); break;
      case 'vouchers': FallbackStorage.saveVouchers(list); break;
      case 'accounts': FallbackStorage.saveAccounts(list); break;
      case 'fiscal_years': FallbackStorage.saveFiscalYears(list); break;
      case 'accounting_periods': FallbackStorage.saveAccountingPeriods(list); break;
      case 'general_ledger': FallbackStorage.saveGeneralLedgerLines(list); break;
      case 'installment_plans': FallbackStorage.saveInstallmentPlans(list); break;
      case 'installment_schedules': FallbackStorage.saveInstallmentSchedules(list); break;
      case 'installment_items': FallbackStorage.saveInstallmentItems(list); break;
      case 'installment_payments': FallbackStorage.saveInstallmentPayments(list); break;
      case 'installment_histories': FallbackStorage.saveInstallmentHistories(list); break;
      case 'installment_versions': FallbackStorage.saveInstallmentVersions(list); break;
      case 'academic_calendars': FallbackStorage.saveAcademicCalendars(list); break;
      case 'academic_terms': FallbackStorage.saveAcademicTerms(list); break;
      case 'academic_periods': FallbackStorage.saveAcademicPeriods(list); break;
      case 'recognition_policies': FallbackStorage.saveRecognitionPolicies(list); break;
      case 'recognition_schedules': FallbackStorage.saveRecognitionSchedules(list); break;
      case 'recognition_entries': FallbackStorage.saveRecognitionEntries(list); break;
      case 'recognition_histories': FallbackStorage.saveRecognitionHistories(list); break;
      case 'recognition_adjustments': FallbackStorage.saveRecognitionAdjustments(list); break;
      case 'financial_configurations': FallbackStorage.saveFinancialConfigurations(list); break;
      case 'financial_configuration_audit_logs': FallbackStorage.saveFinancialConfigurationAuditLogs(list); break;
      case 'receivable_accounts': FallbackStorage.saveReceivableAccounts(list); break;
      case 'receivable_transactions': FallbackStorage.saveReceivableTransactions(list); break;
      case 'receivable_balances': FallbackStorage.saveReceivableBalances(list); break;
      case 'receivable_allocations': FallbackStorage.saveReceivableAllocations(list); break;
      case 'receivable_settlements': FallbackStorage.saveReceivableSettlements(list); break;
      case 'receivable_adjustments': FallbackStorage.saveReceivableAdjustments(list); break;
      case 'receivable_write_offs': FallbackStorage.saveReceivableWriteOffs(list); break;
      case 'receivable_status_histories': FallbackStorage.saveReceivableStatusHistories(list); break;
      case 'receivable_audits': FallbackStorage.saveReceivableAudits(list); break;
      case 'collection_cases': FallbackStorage.saveCollectionCases(list); break;
      case 'collection_promises': FallbackStorage.saveCollectionPromises(list); break;
      case 'collection_receipts': FallbackStorage.saveCollectionReceipts(list); break;
      case 'collection_allocations': FallbackStorage.saveCollectionAllocations(list); break;
      case 'treasury_accounts': FallbackStorage.saveTreasuryAccounts(list); break;
      case 'treasury_transactions': FallbackStorage.saveTreasuryTransactions(list); break;
      case 'treasury_transfers': FallbackStorage.saveTreasuryTransfers(list); break;
      case 'payment_instruments': FallbackStorage.savePaymentInstrumentConfigs(list); break;
    }
  }
}
