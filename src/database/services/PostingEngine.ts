import { FallbackStorage } from '../repositories/FallbackStorage';
import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from '../repositories/AuditRepository';
import { FinancialConfigurationRepository } from '../repositories/FinancialConfigurationRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { JournalRepository } from '../repositories/JournalRepository';
import { POSTING_ENGINE_CAPABILITY } from '../repositories/JournalRepository';
import { GeneralLedgerRepository } from '../repositories/GeneralLedgerRepository';
import { schoolsSeed, branchesSeed, costCentersSeed } from '../seed/mockData';
import { IoCContainer } from '../IoCContainer';
import { 
  JournalEntry, 
  Voucher, 
  Account, 
  GeneralLedger, 
  TrialBalanceItem, 
  AuditMetadata 
} from '../../types';

export class PostingEngine {
  private static readonly activePostingLocks = new Map<string, Promise<void>>();

  public static $inject = [
    'JournalRepository',
    'AccountRepository',
    'GeneralLedgerRepository',
    'FinancialConfigurationRepository',
    'AuditRepository'
  ];

  constructor(
    private journalRepo: JournalRepository,
    private accountRepo: AccountRepository,
    private generalLedgerRepo: GeneralLedgerRepository,
    private financialConfigRepo: FinancialConfigurationRepository,
    private auditRepo: AuditRepository
  ) {}

  private static get journalRepoInstance(): JournalRepository {
    return IoCContainer.getInstance().resolve<JournalRepository>('JournalRepository');
  }

  private static get accountRepoInstance(): AccountRepository {
    return IoCContainer.getInstance().resolve<AccountRepository>('AccountRepository');
  }

  private static get generalLedgerRepoInstance(): GeneralLedgerRepository {
    return IoCContainer.getInstance().resolve<GeneralLedgerRepository>('GeneralLedgerRepository');
  }

  private static get financialConfigRepoInstance(): FinancialConfigurationRepository {
    return IoCContainer.getInstance().resolve<FinancialConfigurationRepository>('FinancialConfigurationRepository');
  }

  private static get auditRepoInstance(): AuditRepository {
    return IoCContainer.getInstance().resolve<AuditRepository>('AuditRepository');
  }

  /**
   * Helper to resolve standard audit metadata.
   */
  private static getAuditMeta(meta?: AuditMetadata): AuditMetadata {
    return {
      userId: meta?.userId || 'system_posting_engine',
      userName: meta?.userName || 'Enterprise Posting Engine',
      userRole: meta?.userRole || 'Chief ERP Architect',
      ipAddress: meta?.ipAddress || '127.0.0.1'
    };
  }

  /**
   * Core posting implementation for a Journal Entry following the strict 12-step ERP flow.
   */
  public static async postJournalEntry(
    schoolId: string,
    entryId: string,
    meta?: AuditMetadata
  ): Promise<void> {
    const lockKey = `${schoolId}:${entryId}`;
    const inFlight = this.activePostingLocks.get(lockKey);
    if (inFlight) {
      await inFlight;
      const confirmed = await this.journalRepoInstance.getById(schoolId, entryId);
      if (confirmed?.status === 'posted') return;
      throw new Error(`لم يثبت ترحيل القيد بعد انتظار العملية المتزامنة: ${entryId}`);
    }

    let releaseLock!: () => void;
    const lock = new Promise<void>(resolve => { releaseLock = resolve; });
    this.activePostingLocks.set(lockKey, lock);

    try {
      await this.performPostJournalEntry(schoolId, entryId, meta);
    } finally {
      releaseLock();
      if (this.activePostingLocks.get(lockKey) === lock) {
        this.activePostingLocks.delete(lockKey);
      }
    }
  }

  private static async performPostJournalEntry(
    schoolId: string,
    entryId: string,
    meta?: AuditMetadata
  ): Promise<void> {
    const auditMeta = this.getAuditMeta(meta);

    // Fetch the Journal Entry
    const journalRepo = this.journalRepoInstance;
    const entry = await journalRepo.getById(schoolId, entryId);

    // Step 1: التحقق من صلاحية المستند
    if (!entry) {
      throw new Error(`مستند قيد اليومية المحدد غير موجود: ${entryId}`);
    }
    if (entry.status === 'posted') {
      throw new Error(`الحالة غير صالحة: تم ترحيل قيد اليومية (${entryId}) مسبقاً في النظام ولا يسمح بالتكرار`);
    }
    if (entry.status === 'cancelled') {
      throw new Error(`يمنع ترحيل مستند ملغى: ${entryId}`);
    }

    const docDate = entry.date;

    // Step 2 & 3: التحقق من الفترة المالية والسنة المالية
    await this.validatePeriodAndYear(schoolId, docDate);

    // Step 4 & 5: التدقيق والرقابة الشاملة على توازن القيد وصلاحية الحسابات والمدارس والفروع ومراكز التكلفة
    const accounts = await this.fetchAccountsFromDB(schoolId);
    this.validateJournalEntry(schoolId, entry, accounts);

    // Step 6: بدء Transaction (إدارة وحدة العمل المحاسبية المعزولة)
    await UnitOfWork.runInTransaction(schoolId, {
      operationName: `ترحيل قيد يومية ${entry.id}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress,
      affectedTables: ['journal_entries', 'general_ledger', 'accounts']
    } as any, async () => {

      // Step 7: إنشاء قيود الأستاذ العام وتحديث أرصدة الحسابات
      const ledgerLines: GeneralLedger[] = [];
      const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
      const precision = config.rounding.precision;
      
      for (const item of entry!.items) {
        const acc = accounts.find(a => a.id === item.accountId)!;

        // Calculate Balance After based on Account Nature
        let oldBalance = acc.balance;
        let change = 0;
        
        if (acc.nature === 'asset' || acc.nature === 'expense') {
          change = item.debit - item.credit;
        } else {
          change = item.credit - item.debit;
        }
        
        const newBalance = Number((oldBalance + change).toFixed(precision));
        const newDebitTotal = Number(((acc.debitBalance || 0) + item.debit).toFixed(precision));
        const newCreditTotal = Number(((acc.creditBalance || 0) + item.credit).toFixed(precision));

        // Create General Ledger record
        const glId = `gl_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const glLine: GeneralLedger = {
          id: glId,
          schoolId,
          accountId: item.accountId,
          date: docDate,
          debit: item.debit,
          credit: item.credit,
          balanceAfter: newBalance,
          referenceType: 'journal',
          referenceId: entry!.id,
          description: entry!.description || `قيد ترحيل مركزي للمستند رقم ${entry!.id}`,
          createdAt: new Date().toISOString()
        };

        // Enlist GL insertion via Repository
        GeneralLedgerRepository.enlistCreateGeneralLedger(
          glId,
          schoolId,
          item.accountId,
          docDate,
          item.debit,
          item.credit,
          newBalance,
          'journal',
          entry!.id,
          glLine.description,
          glLine.createdAt,
          glLine
        );

        // Step 8: تحديث أرصدة الحسابات (Leaf accounts update)
        acc.balance = newBalance;
        acc.debitBalance = newDebitTotal;
        acc.creditBalance = newCreditTotal;

        AccountRepository.enlistUpdateAccountBalance(acc.id, schoolId, newBalance, newDebitTotal, newCreditTotal, acc);

        // Recursive Rollup to all Parent Accounts (الحفاظ على دقة المجاميع الشجرية للأرصدة)
        await this.rollupParentBalances(schoolId, acc.id, item.debit, item.credit, accounts);
      }

      // Step 9: تحديث ميزان المراجعة (Done via real-time balance propagation in step 8)

      // Step 10: تحديث حالة المستند إلى Posted
      const previousStatus = entry!.status;
      entry!.status = 'posted' as any;
      JournalRepository.enlistUpdateJournalEntryStatus(entry!.id, schoolId, 'posted', entry!, previousStatus);

      // Step 11: تسجيل العملية في Audit Trail
      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'POST_TRANSACTION',
        'FINANCIAL_ENGINE',
        auditMeta.ipAddress,
        `ترحيل واعتماد قيد اليومية رقم ${entry!.id} بنجاح للأستاذ العام وميزان المراجعة`,
        { affectedRecord: entry!.id, valuesAfter: { id: entry!.id, status: 'posted' } }
      );

      // Step 12: Commit is automatically finalized by the runInTransaction wrapper
    });
  }

  /**
   * Reverses a posted journal entry by creating a mirror reversal entry and posting it.
   * Standard enterprise accounting practice for correcting errors.
   */
  public static async reversePostJournalEntry(
    schoolId: string,
    entryId: string,
    meta?: AuditMetadata
  ): Promise<string> {
    const auditMeta = this.getAuditMeta(meta);

    // Fetch the target Journal Entry
    const journalRepo = this.journalRepoInstance;
    const entry = await journalRepo.getById(schoolId, entryId);

    if (!entry) {
      throw new Error(`مستند قيد اليومية المراد عكسه غير موجود: ${entryId}`);
    }
    if (entry.status !== 'posted') {
      throw new Error(`الحالة غير صالحة: لا يمكن عمل قيد عكسي لقيد لم يتم ترحيله مسبقاً`);
    }

    // Check period and year
    await this.validatePeriodAndYear(schoolId, entry.date);

    // Prepare reversed items (Swap Debits and Credits)
    const reversedItems = entry.items.map(item => ({
      accountId: item.accountId,
      debit: item.credit, // Debit becomes Credit
      credit: item.debit  // Credit becomes Debit
    }));

    const reversalEntryId = `jrnl_rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const reversalEntry: Partial<JournalEntry> = {
      id: reversalEntryId,
      date: new Date().toISOString().split('T')[0],
      description: `قيد عكسي آلي لتصحيح وإلغاء أثر قيد اليومية رقم ${entry.id}`,
      status: 'draft' as any,
      items: reversedItems,
      totalDebit: entry.totalCredit,
      totalCredit: entry.totalDebit,
      referenceType: 'reversal',
      referenceId: entry.id
    };

    // Use UnitOfWork to create the reversal entry, then post it
    await UnitOfWork.runInTransaction(schoolId, {
      operationName: `إنشاء قيد عكسي وتصحيح للأستاذ العام: ${reversalEntryId}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress,
      affectedTables: ['journal_entries']
    } as any, async () => {
      // Create Reversal Entry
      const dbRecord = {
        id: reversalEntryId,
        school_id: schoolId,
        date: reversalEntry.date,
        description: reversalEntry.description,
        status: 'draft',
        items: JSON.stringify(reversedItems),
        total_debit: reversalEntry.totalDebit,
        total_credit: reversalEntry.totalCredit,
        reference_type: 'reversal',
        reference_id: entry!.id,
        created_at: new Date().toISOString()
      };

      const fallbackRecord = {
        ...reversalEntry,
        schoolId,
        createdAt: dbRecord.created_at
      } as JournalEntry;

      JournalRepository.enlistCreateJournalEntry(
        reversalEntryId,
        schoolId,
        dbRecord.date || '',
        dbRecord.description || '',
        'draft',
        reversedItems,
        dbRecord.total_debit || 0,
        dbRecord.total_credit || 0,
        'reversal',
        entry!.id,
        dbRecord.created_at,
        fallbackRecord
      );

      // Log in audit trail
      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'CREATE_REVERSAL',
        'FINANCIAL_ENGINE',
        auditMeta.ipAddress,
        `إنشاء قيد يومية عكسي رقم ${reversalEntryId} للقيد الأصلي ${entry!.id}`,
        { affectedRecord: reversalEntryId }
      );
    });

    // Now Post the Reversal Entry immediately to update Ledger and Accounts
    await this.postJournalEntry(schoolId, reversalEntryId, meta);

    return reversalEntryId;
  }

  /**
   * Unposts a posted journal entry, reversing all account balances and removing General Ledger lines.
   */
  public static async unpostJournalEntry(
    schoolId: string,
    entryId: string,
    meta?: AuditMetadata
  ): Promise<void> {
    const auditMeta = this.getAuditMeta(meta);

    // Fetch the Journal Entry
    const journalRepo = this.journalRepoInstance;
    const entry = await journalRepo.getById(schoolId, entryId);

    if (!entry) {
      throw new Error(`مستند قيد اليومية المراد إلغاء ترحيله غير موجود: ${entryId}`);
    }
    if (entry.status !== 'posted') {
      throw new Error(`الحالة غير صالحة: لا يمكن إلغاء ترحيل قيد غير مرحل مسبقاً`);
    }

    const docDate = entry.date;
    await this.validatePeriodAndYear(schoolId, docDate);

    const accounts = await this.fetchAccountsFromDB(schoolId);

    await UnitOfWork.runInTransaction(schoolId, {
      operationName: `إلغاء ترحيل قيد يومية ${entry.id}`,
      userId: auditMeta.userId,
      userName: auditMeta.userName,
      ipAddress: auditMeta.ipAddress,
      affectedTables: ['journal_entries', 'general_ledger', 'accounts']
    } as any, async () => {

      // Reverse account balances and rollup
      for (const item of entry!.items) {
        const acc = accounts.find(a => a.id === item.accountId);
        if (!acc) continue;

        let oldBalance = acc.balance;
        let change = 0;
        
        if (acc.nature === 'asset' || acc.nature === 'expense') {
          change = item.debit - item.credit;
        } else {
          change = item.credit - item.debit;
        }
        
        const newBalance = Number((oldBalance - change).toFixed(3));
        const newDebitTotal = Number(((acc.debitBalance || 0) - item.debit).toFixed(3));
        const newCreditTotal = Number(((acc.creditBalance || 0) - item.credit).toFixed(3));

        // Canonical persistence: enlist the deletion in the active transaction.
        // Do not mutate fallback storage here; doing so would create a second,
        // non-transactional source of truth during an unpost operation.
        GeneralLedgerRepository.enlistDeleteGeneralLedgerByReference(schoolId, entry!.id, 'journal');

        acc.balance = newBalance;
        acc.debitBalance = newDebitTotal;
        acc.creditBalance = newCreditTotal;

        AccountRepository.enlistUpdateAccountBalance(acc.id, schoolId, newBalance, newDebitTotal, newCreditTotal, acc);

        await this.rollupParentBalances(schoolId, acc.id, -item.debit, -item.credit, accounts);
      }

      // Mark Draft
      const previousStatus = entry!.status;
      entry!.status = 'draft' as any;
      JournalRepository.enlistUpdateJournalEntryStatus(entry!.id, schoolId, 'draft', entry!, previousStatus);

      // Audit Log
      await AuditRepository.log(
        schoolId,
        auditMeta.userId,
        auditMeta.userName,
        auditMeta.userRole,
        'UNPOST_TRANSACTION',
        'FINANCIAL_ENGINE',
        auditMeta.ipAddress,
        `إلغاء ترحيل قيد اليومية رقم ${entry!.id} وعكس تأثيره على الأستاذ العام وميزان المراجعة`,
        { affectedRecord: entry!.id, valuesAfter: { id: entry!.id, status: 'draft' } }
      );
    });
  }

  /**
   * Batch Posting Service for robust processing of multiple financial documents.
   */
  public static async batchPostJournalEntries(
    schoolId: string,
    entryIds: string[],
    meta?: AuditMetadata
  ): Promise<{ successCount: number; errors: { id: string; error: string }[] }> {
    const results = {
      successCount: 0,
      errors: [] as { id: string; error: string }[]
    };

    for (const id of entryIds) {
      try {
        await this.postJournalEntry(schoolId, id, meta);
        results.successCount++;
      } catch (err: any) {
        results.errors.push({ id, error: err.message || String(err) });
      }
    }

    return results;
  }

  /**
   * Bulk Posting Service executing all operations in a single massive atomic transaction block.
   * If any fails, the entire batch rolls back completely (All-or-Nothing).
   */
  public static async bulkPostJournalEntries(
    schoolId: string,
    entryIds: string[],
    meta?: AuditMetadata
  ): Promise<{ successCount: number; errors: { id: string; error: string }[] }> {
    const auditMeta = this.getAuditMeta(meta);

    try {
      // Execute the bulk operations inside ONE big Transaction block
      const result = await UnitOfWork.runInTransaction(schoolId, {
        operationName: `ترحيل مجمع Bulk لعدد ${entryIds.length} مستند مالي`,
        userId: auditMeta.userId,
        userName: auditMeta.userName,
        ipAddress: auditMeta.ipAddress,
        affectedTables: ['journal_entries', 'general_ledger', 'accounts']
      } as any, async () => {
        // Since we are already inside a transaction, we cannot easily call postJournalEntry 
        // which starts its own transaction because nested transactions are disallowed by UnitOfWork.
        // Therefore, we perform the posting logic directly for each entry within this active transaction.
        
        const accounts = await FallbackStorage.getAccounts(); // Fallback is fine as UnitOfWork reads it
        let postedCount = 0;

        for (const entryId of entryIds) {
          const entryList = FallbackStorage.getJournalEntries();
          const entry = entryList.find(e => e.id === entryId && (e as any).schoolId === schoolId);
          
          if (!entry) {
            throw new Error(`مستند غير موجود للتسجيل المجمع: ${entryId}`);
          }
          if (entry.status === 'posted') {
            throw new Error(`المستند ${entryId} تم ترحيله مسبقاً`);
          }

          // Validate period, balance, account, cost center, school and branch
          await this.validatePeriodAndYear(schoolId, entry.date);
          this.validateJournalEntry(schoolId, entry, accounts);

          // Create ledger and update accounts
          for (const item of entry.items) {
            const acc = accounts.find(a => a.id === item.accountId);
            if (!acc) continue; // Already validated in validateJournalEntry so it definitely exists

            let oldBalance = acc.balance;
            let change = (acc.nature === 'asset' || acc.nature === 'expense') 
              ? (item.debit - item.credit) 
              : (item.credit - item.debit);

            const newBalance = Number((oldBalance + change).toFixed(3));
            const newDebitTotal = Number(((acc.debitBalance || 0) + item.debit).toFixed(3));
            const newCreditTotal = Number(((acc.creditBalance || 0) + item.credit).toFixed(3));

            const glId = `gl_${Date.now()}_bulk_${Math.floor(Math.random() * 10000)}`;
            const glLine: GeneralLedger = {
              id: glId,
              schoolId,
              accountId: item.accountId,
              date: entry.date,
              debit: item.debit,
              credit: item.credit,
              balanceAfter: newBalance,
              referenceType: 'journal',
              referenceId: entry.id,
              description: entry.description || 'ترحيل مجمع آمن للأستاذ العام',
              createdAt: new Date().toISOString()
            };

            GeneralLedgerRepository.enlistCreateGeneralLedger(
              glId,
              schoolId,
              item.accountId,
              entry.date,
              item.debit,
              item.credit,
              newBalance,
              'journal',
              entry.id,
              glLine.description,
              glLine.createdAt,
              glLine
            );

            // Update Account Balances
            acc.balance = newBalance;
            acc.debitBalance = newDebitTotal;
            acc.creditBalance = newCreditTotal;

            AccountRepository.enlistUpdateAccountBalance(acc.id, schoolId, newBalance, newDebitTotal, newCreditTotal, acc);

            // Rollup recursively to parent accounts
            await this.rollupParentBalances(schoolId, acc.id, item.debit, item.credit, accounts);
          }

          // Mark Posted
          const previousStatus = entry.status;
          entry.status = 'posted' as any;
          JournalRepository.enlistUpdateJournalEntryStatus(entry.id, schoolId, 'posted', entry, previousStatus);

          postedCount++;
        }

        return { successCount: postedCount, errors: [] };
      });

      return result;
    } catch (err: any) {
      return {
        successCount: 0,
        errors: [{ id: 'BULK_TRANSACTION_FAILED', error: err.message || String(err) }]
      };
    }
  }

  /**
   * Generates a fully mathematically balanced Trial Balance (ميزان المراجعة بالمجاميع والأرصدة).
   */
  public static async getTrialBalance(schoolId: string): Promise<TrialBalanceItem[]> {
    FallbackStorage.assertCanonicalPersistence(`trial balance read for ${schoolId}`);
    const isHealthy = await FallbackStorage.isHealthy();
    const accounts = isHealthy ? await this.fetchAccountsFromDB(schoolId) : FallbackStorage.getAccounts();
    const ledgerLines = FallbackStorage.getGeneralLedgerLines().filter(gl => gl.schoolId === schoolId);

    const trialBalance: TrialBalanceItem[] = [];

    // Filter to only leaf accounts first to construct initial balances, then roll up
    for (const acc of accounts) {
      const accGl = ledgerLines.filter(l => l.accountId === acc.id);
      
      const periodDebit = accGl.reduce((sum, l) => sum + l.debit, 0);
      const periodCredit = accGl.reduce((sum, l) => sum + l.credit, 0);

      // Simple calculation
      let closingDebit = 0;
      let closingCredit = 0;

      if (acc.nature === 'asset' || acc.nature === 'expense') {
        const net = (acc.balance || 0);
        if (net >= 0) closingDebit = net;
        else closingCredit = Math.abs(net);
      } else {
        const net = (acc.balance || 0);
        if (net >= 0) closingCredit = net;
        else closingDebit = Math.abs(net);
      }

      trialBalance.push({
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        nature: acc.nature,
        openingDebit: 0, // In simple model, starts at 0 or initialized on closed years
        openingCredit: 0,
        periodDebit: Number(periodDebit.toFixed(3)),
        periodCredit: Number(periodCredit.toFixed(3)),
        closingDebit: Number(closingDebit.toFixed(3)),
        closingCredit: Number(closingCredit.toFixed(3))
      });
    }

    return trialBalance;
  }

  // --- Private Helper Methods ---

  /**
   * Period & Fiscal Year Validator ensuring financial transactions fall into open accounting timelines.
   */
  private static async validatePeriodAndYear(schoolId: string, dateStr: string): Promise<void> {
    FallbackStorage.assertCanonicalPersistence(`accounting period validation for ${schoolId}`);
    const date = new Date(dateStr);
    const fiscalYears = FallbackStorage.getFiscalYears().filter(fy => fy.schoolId === schoolId);

    const enclosingYear = fiscalYears.find(fy => {
      const start = new Date(fy.startDate);
      const end = new Date(fy.endDate);
      return date >= start && date <= end;
    });

    if (!enclosingYear) {
      throw new Error(`تاريخ المستند (${dateStr}) لا ينتمي لأي سنة مالية معرّفة في النظام`);
    }
    if (enclosingYear.status === 'closed') {
      throw new Error(`العملية مرفوضة محاسبياً: السنة المالية (${enclosingYear.yearName}) مغلقة حالياً ولا تقبل الترحيل`);
    }

    const periods = FallbackStorage.getAccountingPeriods().filter(
      ap => ap.schoolId === schoolId && ap.fiscalYearId === enclosingYear.id
    );
    const enclosingPeriod = periods.find(ap => {
      const start = new Date(ap.startDate);
      const end = new Date(ap.endDate);
      return date >= start && date <= end;
    });

    if (!enclosingPeriod) {
      throw new Error(`تاريخ المستند (${dateStr}) لا يقع ضمن أي فترة محاسبية فرعية معرّفة في النظام`);
    }
    if (enclosingPeriod.status === 'closed') {
      throw new Error(`العملية مرفوضة محاسبياً: الفترة المالية (${enclosingPeriod.periodName}) مغلقة حالياً ولا تقبل الترحيل`);
    }
  }

  /**
   * Fetches the hierarchy of accounts directly from Supabase.
   */
  private static async fetchAccountsFromDB(schoolId: string): Promise<Account[]> {
    const accountRepo = this.accountRepoInstance;
    return await accountRepo.getAll(schoolId);
  }

  /**
   * Rollup balances recursively to keep parent/aggregating accounts mathematically in-sync.
   */
  private static async rollupParentBalances(
    schoolId: string,
    accountId: string,
    debit: number,
    credit: number,
    accounts: Account[]
  ): Promise<void> {
    const current = accounts.find(a => a.id === accountId);
    if (!current || !current.parentAccountId) return;

    const parent = accounts.find(a => a.id === current.parentAccountId);
    if (!parent) return;

    // Determine change in balance for parent based on parent's nature
    let change = 0;
    if (parent.nature === 'asset' || parent.nature === 'expense') {
      change = debit - credit;
    } else {
      change = credit - debit;
    }

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const precision = config.rounding.precision;

    const newParentBalance = Number(((parent.balance || 0) + change).toFixed(precision));
    const newParentDebit = Number(((parent.debitBalance || 0) + debit).toFixed(precision));
    const newParentCredit = Number(((parent.creditBalance || 0) + credit).toFixed(precision));

    parent.balance = newParentBalance;
    parent.debitBalance = newParentDebit;
    parent.creditBalance = newParentCredit;

    AccountRepository.enlistUpdateAccountBalance(parent.id, schoolId, newParentBalance, newParentDebit, newParentCredit, parent);

    // Recurse to grand-parents
    await this.rollupParentBalances(schoolId, parent.id, debit, credit, accounts);
  }

  /**
   * Secure draft journal entry creation. Only accessible via PostingEngine.
   */
  public static async createJournalEntryDraft(
    schoolId: string,
    item: Partial<JournalEntry> & { meta?: AuditMetadata }
  ): Promise<JournalEntry> {
    const journalRepo = this.journalRepoInstance;
    const itemWithCapability = {
      ...item,
      postingCapability: POSTING_ENGINE_CAPABILITY
    };
    return journalRepo.create(schoolId, itemWithCapability as any);
  }

  /**
   * Secure draft journal entry update. Only accessible via PostingEngine.
   */
  public static async updateJournalEntryDraft(
    schoolId: string,
    id: string,
    item: Partial<JournalEntry> & { meta?: AuditMetadata }
  ): Promise<JournalEntry> {
    const journalRepo = this.journalRepoInstance;
    const itemWithCapability = {
      ...item,
      postingCapability: POSTING_ENGINE_CAPABILITY
    };
    return journalRepo.update(schoolId, id, itemWithCapability as any);
  }

  /**
   * Secure journal entry deletion. Only accessible via PostingEngine.
   */
  public static async deleteJournalEntryDraft(
    schoolId: string,
    id: string,
    options?: { meta?: AuditMetadata }
  ): Promise<boolean> {
    const journalRepo = this.journalRepoInstance;
    return journalRepo.delete(schoolId, id, { ...options, postingCapability: POSTING_ENGINE_CAPABILITY } as any);
  }

  /**
   * Performs absolute integrity audits on a Journal Entry before any state changes are committed.
   */
  public static validateJournalEntry(
    schoolId: string,
    entry: JournalEntry,
    accounts: Account[]
  ): void {
    // 1. مجموع المدين = مجموع الدائن
    let totalDebit = 0;
    let totalCredit = 0;
    for (const item of entry.items) {
      if (item.debit < 0 || item.credit < 0) {
        throw new Error(`القيد ${entry.id} يحتوي على مبالغ سالبة غير مسموح بها في القيود المتوازنة`);
      }
      totalDebit += item.debit;
      totalCredit += item.credit;
    }
    const tolerance = 0.001;
    if (Math.abs(totalDebit - totalCredit) > tolerance) {
      throw new Error(`مخالفة توازن القيد ${entry.id}: مجموع المدين (${totalDebit.toLocaleString()}) لا يساوي مجموع الدائن (${totalCredit.toLocaleString()})`);
    }

    // 2. التحقق من الحسابات (حذف أو إلغاء أو غير موجود)
    for (const item of entry.items) {
      const acc = accounts.find(a => a.id === item.accountId || a.code === item.accountId);
      if (!acc) {
        throw new Error(`الحساب المالي ذو الكود/المعرف (${item.accountId}) في القيد ${entry.id} غير موجود في دليل الحسابات (محذوف أو غير معرف)`);
      }
      if (!acc.isActive) {
        throw new Error(`الحساب المالي (${acc.code} - ${acc.name}) في القيد ${entry.id} ملغى أو غير نشط في دليل الحسابات`);
      }
      if (!acc.isLeaf) {
        throw new Error(`الحساب المالي (${acc.code} - ${acc.name}) في القيد ${entry.id} هو حساب رئيسي (تجميعي). يمنع الترحيل على حساب غير فرعي.`);
      }
    }

    // 3. التحقق من Cost Center (عدم وجود Cost Center غير موجود)
    const validCostCenters = ['cc_kg', 'cc_primary', 'cc_middle', 'cc_high', 'kindergarten', 'primary', 'middle', 'secondary', 'all', 'stage_kg', 'stage_primary', 'stage_middle', 'stage_high'];
    for (const item of entry.items) {
      const cc = (item as any).costCenter || (item as any).costCenterId;
      if (cc) {
        if (!validCostCenters.includes(cc)) {
          throw new Error(`مركز التكلفة (${cc}) المحدد في القيد ${entry.id} غير معرّف أو غير موجود بالنظام`);
        }
      }
    }

    // 4. التحقق من الفرع (عدم وجود فرع خاطئ)
    const validBranches = ['branch_1_1', 'branch_1_2', 'branch_2_1', 'branch_3_1', 'الفرع الرئيسي', 'الفرع الرئيسي - طرابلس', 'الفرع الغربي'];
    const entryBranch = (entry as any).branchId || (entry as any).branch;
    if (entryBranch) {
      if (!validBranches.includes(entryBranch)) {
        throw new Error(`فرع القيد (${entryBranch}) المحدد في القيد ${entry.id} غير معرّف أو غير موجود بنظام الفروع المعتمد`);
      }
    }
    for (const item of entry.items) {
      const lineBranch = (item as any).branch || (item as any).branchId;
      if (lineBranch) {
        if (!validBranches.includes(lineBranch)) {
          throw new Error(`فرع السطر (${lineBranch}) في القيد ${entry.id} غير معرّف أو غير موجود بنظام الفروع المعتمد`);
        }
      }
    }

    // 5. التحقق من School ID (عدم وجود School ID خاطئ)
    const validSchools = ['school_1', 'school_2', 'school_3', 'مدرسة الأسرة الحديثة - فرع طرابلس', 'مجمع المدارس الموحد'];
    const entrySchool = (entry as any).schoolId || (entry as any).school;
    if (entrySchool) {
      if (!validSchools.includes(entrySchool)) {
        throw new Error(`مدرسة القيد (${entrySchool}) المحددة في القيد ${entry.id} غير صحيحة أو غير موجودة بنظام المدارس`);
      }
    }
    if (schoolId) {
      if (!validSchools.includes(schoolId)) {
        throw new Error(`المعرف المدرسي للبيئة (${schoolId}) في القيد ${entry.id} غير صحيح أو غير موجود بنظام المدارس`);
      }
    }
  }

  /**
   * Explicitly audit all journal entries in FallbackStorage or DB,
   * checking each against the strict ERP integrity constraints.
   */
  public static async auditJournalEntries(schoolId: string): Promise<{
    isValid: boolean;
    violationsCount: number;
    auditLog: string[];
  }> {
    FallbackStorage.assertCanonicalPersistence(`journal audit read for ${schoolId}`);
    const isHealthy = await FallbackStorage.isHealthy();
    const accounts = isHealthy ? await this.fetchAccountsFromDB(schoolId) : FallbackStorage.getAccounts();
    const entries = FallbackStorage.getJournalEntries();
    
    const auditLog: string[] = [];
    let violationsCount = 0;
    
    auditLog.push(`🔍 بدء التدقيق والرقابة الشاملة لجميع القيود المحاسبية للمدرسة (${schoolId})`);
    auditLog.push(`✓ تم تحميل عدد (${entries.length}) قيد يومية، وعدد (${accounts.length}) حساب مالي من دليل الحسابات الموحد`);
    
    for (const entry of entries) {
      try {
        this.validateJournalEntry(schoolId, entry, accounts);
        auditLog.push(`✓ القيد (${entry.id}) متوازن وسليم ومطابق لكافة شروط الرقابة والتدقيق الثنائي.`);
      } catch (err: any) {
        violationsCount++;
        const errMsg = `❌ خطأ في القيد (${entry.id}): ${err.message || String(err)}`;
        auditLog.push(errMsg);
        
        // Write complete error log in audit trail
        await AuditRepository.log(
          schoolId,
          'system_auditor',
          'مدقق القيود الآلي',
          'Auditor',
          'ENTRY_AUDIT_FAILURE',
          'FINANCIAL_ENGINE',
          '127.0.0.1',
          errMsg,
          { affectedRecord: entry.id, result: 'failure' } as any
        );
      }
    }
    
    auditLog.push(`🏁 انتهت عملية التدقيق والرقابة الجنائية للقيود. إجمالي الانتهاكات المكتشفة: (${violationsCount})`);
    
    return {
      isValid: violationsCount === 0,
      violationsCount,
      auditLog
    };
  }
}
