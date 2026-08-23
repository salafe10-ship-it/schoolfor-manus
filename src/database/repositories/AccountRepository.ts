import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { Account, AuditMetadata } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from './AuditRepository';
import { FinancialConfigurationRepository } from './FinancialConfigurationRepository';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class AccountRepository implements IBaseRepository<Account> {

  private getAuditMeta(item: any, options?: any): AuditMetadata {
    const meta = (options?.meta || options?.auditMeta || item?.meta || item?.auditMeta) as AuditMetadata;
    return {
      userId: meta?.userId || 'system_financial',
      userName: meta?.userName || 'Financial Engine',
      userRole: meta?.userRole || 'Accountant',
      ipAddress: meta?.ipAddress || '127.0.0.1'
    };
  }

  /**
   * Safe cycle detection. Prevents setting a parent that is either itself or one of its descendants.
   */
  public async wouldCreateCycle(schoolId: string, id: string, parentId: string): Promise<boolean> {
    if (id === parentId) return true;
    let currentParentId: string | undefined = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) return true; // prevent loop
      visited.add(currentParentId);

      if (currentParentId === id) return true;
      const parentAcc = await this.getById(schoolId, currentParentId);
      currentParentId = parentAcc?.parentAccountId;
    }
    return false;
  }

  public async getById(schoolId: string, id: string): Promise<Account | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', id)
            .eq('school_id', schoolId)
            .maybeSingle();
          if (!error && data) {
            return this.mapFromDatabase(data);
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch account by ID from Supabase:", "AccountRepository", { error: err });
      }
    }

    // Fallback Read
    FallbackStorage.assertCanonicalPersistence(`account read ${id}`);
    const accounts = FallbackStorage.getAccounts();
    return accounts.find(a => a.id === id && a.schoolId === schoolId) || null;
  }

  public async getAll(schoolId: string, options?: { parentAccountId?: string; nature?: string; isActive?: boolean }): Promise<Account[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase
            .from('accounts')
            .select('*')
            .eq('school_id', schoolId);

          if (options?.parentAccountId !== undefined) {
            if (options.parentAccountId === null) {
              query = query.is('parent_account_id', null);
            } else {
              query = query.eq('parent_account_id', options.parentAccountId);
            }
          }
          if (options?.nature) {
            query = query.eq('nature', options.nature);
          }
          if (options?.isActive !== undefined) {
            query = query.eq('is_active', options.isActive);
          }

          const { data, error } = await query.order('code', { ascending: true });
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query accounts from Supabase:", "AccountRepository", { error: err });
      }
    }

    // Fallback Read
    FallbackStorage.assertCanonicalPersistence(`accounts list for ${schoolId}`);
    let list = FallbackStorage.getAccounts().filter(a => a.schoolId === schoolId);
    if (options?.parentAccountId !== undefined) {
      list = list.filter(a => a.parentAccountId === (options.parentAccountId || undefined));
    }
    if (options?.nature) {
      list = list.filter(a => a.nature === options.nature);
    }
    if (options?.isActive !== undefined) {
      list = list.filter(a => a.isActive === options.isActive);
    }
    return list;
  }

  public async create(schoolId: string, item: Partial<Account> & { meta?: AuditMetadata }): Promise<Account> {
    const meta = this.getAuditMeta(item);

    if (!item.code) {
      throw new Error('رقم الحساب مطلوب وفريد');
    }
    if (!item.name) {
      throw new Error('اسم الحساب مطلوب');
    }
    if (!item.nature) {
      throw new Error('نوع الحساب مطلوب (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات)');
    }

    // Uniqueness validation
    const all = await this.getAll(schoolId);
    if (all.some(a => a.code === item.code)) {
      throw new Error(`رقم الحساب مكرر بالفعل في شجرة الحسابات: ${item.code}`);
    }

    // Parent Cycle check
    if (item.parentAccountId) {
      const parent = all.find(a => a.id === item.parentAccountId);
      if (!parent) {
        throw new Error('الحساب الأب المحدد غير موجود');
      }
    }

    const config = await FinancialConfigurationRepository.getBySchoolId(schoolId);
    const defaultCurrencyCode = config.currency.code || 'CUR';

    const id = item.id || `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newAccount: Account = {
      id,
      code: item.code,
      name: item.name,
      shortName: item.shortName,
      nature: item.nature,
      level: item.level || 1,
      parentAccountId: item.parentAccountId || undefined,
      hierarchyPath: item.hierarchyPath || id,
      isActive: item.isActive !== undefined ? item.isActive : true,
      isLeaf: item.isLeaf !== undefined ? item.isLeaf : true,
      balance: item.balance || 0,
      currency: item.currency || defaultCurrencyCode,
      defaultCostCenter: item.defaultCostCenter
    };

    const dbRecord = {
      ...this.mapToDatabase(newAccount),
      school_id: schoolId
    };

    const fallbackRecord = {
      ...newAccount,
      schoolId
    };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `INSERT INTO accounts (id, school_id, code, name, short_name, nature, level, parent_account_id, hierarchy_path, is_active, is_leaf, balance, currency, default_cost_center) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
        parameters: [id, schoolId, dbRecord.code, dbRecord.name, dbRecord.short_name || null, dbRecord.nature, dbRecord.level, dbRecord.parent_account_id || null, dbRecord.hierarchy_path, dbRecord.is_active, dbRecord.is_leaf, dbRecord.balance, dbRecord.currency, dbRecord.default_cost_center || null],
        executionContext: 'Create Account'
      });
      UnitOfWork.enlistCreate('accounts', id, fallbackRecord, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'CREATE_TRANSACTION',
        'CHART_OF_ACCOUNTS',
        meta.ipAddress,
        `إدراج حساب مالي معلق في شجرة الحسابات: ${newAccount.code} - ${newAccount.name}`,
        { affectedRecord: id, valuesAfter: fallbackRecord }
      );
      return fallbackRecord as Account;
    }

    return FallbackStorage.performWrite<Account>(
      schoolId,
      'accounts',
      id,
      'INSERT',
      fallbackRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('accounts')
          .insert([dbRecord])
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const list = FallbackStorage.getAccounts();
        list.push(fallbackRecord);
        FallbackStorage.saveAccounts(list);
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'CREATE',
        'CHART_OF_ACCOUNTS',
        meta.ipAddress,
        `إنشاء حساب مالي جديد: ${res.code} - ${res.name}`,
        { affectedRecord: id, valuesAfter: res }
      );
      return res;
    });
  }

  public async update(schoolId: string, id: string, item: Partial<Account> & { meta?: AuditMetadata }): Promise<Account> {
    const meta = this.getAuditMeta(item);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`الحساب المالي غير موجود للتعديل: ${id}`);
    }

    // Business validation: unique code
    if (item.code && item.code !== existing.code) {
      const all = await this.getAll(schoolId);
      if (all.some(a => a.code === item.code)) {
        throw new Error(`كود الحساب الجديد مكرر بالفعل: ${item.code}`);
      }
    }

    // Business validation: Parent Cycle Prevention
    if (item.parentAccountId && item.parentAccountId !== existing.parentAccountId) {
      const isCycle = await this.wouldCreateCycle(schoolId, id, item.parentAccountId);
      if (isCycle) {
        throw new Error('يمنع ربط الحساب المالي بأحد الحسابات الفرعية التابعة له منعاً للدورات الحلقية المرجعية (Parent Cycle Detection)');
      }
    }

    const merged = { ...existing, ...item };
    const dbRecord = {
      ...this.mapToDatabase(merged),
      school_id: schoolId
    };

    const fallbackRecord = {
      ...merged,
      schoolId
    };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE accounts SET code = $1, name = $2, short_name = $3, nature = $4, level = $5, parent_account_id = $6, hierarchy_path = $7, is_active = $8, is_leaf = $9, balance = $10, currency = $11, default_cost_center = $12 WHERE id = $13 AND school_id = $14;`,
        parameters: [dbRecord.code, dbRecord.name, dbRecord.short_name || null, dbRecord.nature, dbRecord.level, dbRecord.parent_account_id || null, dbRecord.hierarchy_path, dbRecord.is_active, dbRecord.is_leaf, dbRecord.balance, dbRecord.currency, dbRecord.default_cost_center || null, id, schoolId],
        executionContext: 'Update Account'
      });
      UnitOfWork.enlistUpdate('accounts', id, fallbackRecord, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE_TRANSACTION',
        'CHART_OF_ACCOUNTS',
        meta.ipAddress,
        `تعديل حساب مالي معلق في شجرة الحسابات: ${existing.code}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: fallbackRecord }
      );
      return fallbackRecord as Account;
    }

    return FallbackStorage.performWrite<Account>(
      schoolId,
      'accounts',
      id,
      'UPDATE',
      fallbackRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('accounts')
          .update(dbRecord)
          .eq('id', id)
          .eq('school_id', schoolId)
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const list = FallbackStorage.getAccounts();
        const idx = list.findIndex(a => a.id === id);
        if (idx > -1) {
          list[idx] = fallbackRecord;
          FallbackStorage.saveAccounts(list);
        }
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'CHART_OF_ACCOUNTS',
        meta.ipAddress,
        `تعديل الحساب المالي: ${res.code} - ${res.name}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: res }
      );
      return res;
    });
  }

  public async delete(schoolId: string, id: string, options?: { meta?: AuditMetadata }): Promise<boolean> {
    const meta = this.getAuditMeta(null, options);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`الحساب المالي غير موجود للحذف: ${id}`);
    }

    const all = await this.getAll(schoolId);

    // Business Rule 0: Prevent deleting system-protected accounts
    if (existing.isSystemProtected) {
      throw new Error('يمنع حذف هذا الحساب لأنه حساب نظامي محمي، يمكن إعادة تسميته أو ربطه بوظيفة أخرى');
    }

    // Business Rule 1: Prevent deleting account if it has sub-accounts (children)
    const hasChildren = all.some(a => a.parentAccountId === id);
    if (hasChildren) {
      throw new Error('يمنع حذف الحساب المالي المختار نظراً لوجود حسابات فرعية تابعة له في شجرة الحسابات');
    }

    // Business Rule 2: Prevent deleting account if it has transactions
    // Transaction existence is authoritative and must never be inferred from browser fallback data.
    FallbackStorage.assertCanonicalPersistence(`account delete transaction check ${id}`);
    // Check Journal Entries
    const journalEntries = FallbackStorage.getJournalEntries();
    const hasJournalEntries = journalEntries.some(e => 
      (e as any).schoolId === schoolId && 
      e.items.some(item => item.accountId === id)
    );
    if (hasJournalEntries) {
      throw new Error('يمنع حذف الحساب المالي نظراً لوجود قيود يومية وحركات محاسبية مسجلة عليه تاريخياً');
    }

    // Check Vouchers
    const vouchers = FallbackStorage.getVouchers();
    const hasVouchers = vouchers.some(v => 
      (v as any).schoolId === schoolId && 
      v.accountId === id
    );
    if (hasVouchers) {
      throw new Error('يمنع حذف الحساب المالي نظراً لوجود سندات قبض أو صرف مسجلة عليه تاريخياً');
    }

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `DELETE FROM accounts WHERE id = $1 AND school_id = $2;`,
        parameters: [id, schoolId],
        executionContext: 'Delete Account'
      });
      UnitOfWork.enlistDelete('accounts', id, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'DELETE_TRANSACTION',
        'CHART_OF_ACCOUNTS',
        meta.ipAddress,
        `حذف معلق للحساب المالي من شجرة الحسابات: ${existing.code}`,
        { affectedRecord: id, valuesBefore: existing }
      );
      return true;
    }

    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'accounts',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('id', id)
          .eq('school_id', schoolId);
        if (error) throw error;
        return true;
      },
      () => {
        const list = FallbackStorage.getAccounts();
        const filtered = list.filter(a => a.id !== id);
        FallbackStorage.saveAccounts(filtered);
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'DELETE',
        'CHART_OF_ACCOUNTS',
        meta.ipAddress,
        `حذف الحساب المالي بالكامل: ${existing.code} - ${existing.name}`,
        { affectedRecord: id, valuesBefore: existing }
      );
      return res;
    });
  }

  public async exists(schoolId: string, id: string): Promise<boolean> {
    const record = await this.getById(schoolId, id);
    return record !== null;
  }

  public async count(schoolId: string, options?: any): Promise<number> {
    const records = await this.getAll(schoolId, options);
    return records.length;
  }

  /**
   * Enlists an account balance update inside a UnitOfWork.
   */
  public static enlistUpdateAccountBalance(
    id: string,
    schoolId: string,
    balance: number,
    debitBalance: number,
    creditBalance: number,
    acc: Account
  ): void {
    const command = SQLCommandBuilder.create({
        sqlText: `UPDATE accounts SET balance = $1, debit_balance = $2, credit_balance = $3 WHERE id = $4 AND school_id = $5;`,
        parameters: [balance, debitBalance, creditBalance, id, schoolId],
        executionContext: 'Update Account Balance'
    });
    UnitOfWork.enlistUpdate('accounts', id, acc, command);
  }

  // --- Map utilities ---

  private mapFromDatabase(data: any): Account {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      shortName: data.short_name || data.shortName,
      nature: data.nature,
      level: Number(data.level),
      parentAccountId: data.parent_account_id || data.parentAccountId || undefined,
      hierarchyPath: data.hierarchy_path || data.hierarchyPath,
      isActive: data.is_active !== undefined ? data.is_active : data.isActive,
      isLeaf: data.is_leaf !== undefined ? data.is_leaf : data.isLeaf,
      isSystemProtected: data.is_system_protected !== undefined ? data.is_system_protected : data.isSystemProtected,
      balance: Number(data.balance || 0),
      currency: data.currency,
      defaultCostCenter: data.default_cost_center || data.defaultCostCenter
    };
  }

  private mapToDatabase(acc: Account): any {
    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      short_name: acc.shortName || null,
      nature: acc.nature,
      level: acc.level,
      parent_account_id: acc.parentAccountId || null,
      hierarchy_path: acc.hierarchyPath || null,
      is_active: acc.isActive,
      is_leaf: acc.isLeaf,
      is_system_protected: acc.isSystemProtected || false,
      balance: acc.balance,
      currency: acc.currency || 'CUR',
      default_cost_center: acc.defaultCostCenter || null
    };
  }
}
