import { getSupabaseClient } from '../client';
import { FallbackStorage } from './FallbackStorage';
import { JournalEntry, AuditMetadata } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { ParameterizedCommand, SQLCommandBuilder } from '../transactions/SQLCommand';
import { AuditRepository } from './AuditRepository';
import { EnterpriseLogger } from '../services/EnterpriseLogger';

// Module-scoped capability: avoids embedding a reusable secret in the bundle.
// Only PostingEngine receives this capability through its explicit adapter path.
export const POSTING_ENGINE_CAPABILITY = Symbol('posting-engine-capability');

export class JournalRepository implements IBaseRepository<JournalEntry> {

  /**
   * Helper to extract audit metadata from item, options, or provide system defaults.
   */
  private getAuditMeta(item: any, options?: any): AuditMetadata {
    const meta = (options?.meta || options?.auditMeta || item?.meta || item?.auditMeta) as AuditMetadata;
    return {
      userId: meta?.userId || 'system_financial',
      userName: meta?.userName || 'Financial Engine',
      userRole: meta?.userRole || 'Accountant',
      ipAddress: meta?.ipAddress || '127.0.0.1'
    };
  }

  public async getById(schoolId: string, id: string): Promise<JournalEntry | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('id', id)
            .eq('school_id', schoolId)
            .maybeSingle();
          if (!error && data) {
            return this.mapFromDatabase(data);
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch journal entry by ID from Supabase:", "JournalRepository", { error: err?.message || err });
      }
    }

    // Fallback Read
    FallbackStorage.assertCanonicalPersistence(`journal entry read ${id}`);
    const entries = FallbackStorage.getJournalEntries();
    const entry = entries.find(e => e.id === id && (e as any).schoolId === schoolId);
    return entry || null;
  }

  public async getAll(schoolId: string, options?: { referenceId?: string; referenceType?: string; status?: string }): Promise<JournalEntry[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase
            .from('journal_entries')
            .select('*')
            .eq('school_id', schoolId);

          if (options?.referenceId) {
            query = query.eq('reference_id', options.referenceId);
          }
          if (options?.referenceType) {
            query = query.eq('reference_type', options.referenceType);
          }
          if (options?.status) {
            query = query.eq('status', options.status);
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query journal entries from Supabase:", "JournalRepository", { error: err?.message || err });
      }
    }

    // Fallback Read
    FallbackStorage.assertCanonicalPersistence(`journal entries list for ${schoolId}`);
    let entries = FallbackStorage.getJournalEntries().filter(e => (e as any).schoolId === schoolId);
    if (options?.referenceId) {
      entries = entries.filter(e => e.referenceId === options.referenceId);
    }
    if (options?.referenceType) {
      entries = entries.filter(e => e.referenceType === options.referenceType);
    }
    if (options?.status) {
      entries = entries.filter(e => e.status === options.status);
    }
    return entries;
  }

  public async create(schoolId: string, item: Partial<JournalEntry> & { meta?: AuditMetadata; postingCapability?: symbol }): Promise<JournalEntry> {
    if (item.postingCapability !== POSTING_ENGINE_CAPABILITY) {
      throw new Error('مخالفة معمارية محاسبية: يمنع منعاً باتاً إنشاء قيد يومية خارج PostingEngine. يجب استخدام PostingEngine.createJournalEntryDraft.');
    }
    const meta = this.getAuditMeta(item);

    // Business validation: entries must be balanced
    if (!item.items || item.items.length === 0) {
      throw new Error('يمنع إنشاء قيد مالي فارغ بدون تفاصيل');
    }

    const date = item.date || new Date().toISOString().split('T')[0];
    await this.validateDateAndAccounts(schoolId, date, item.items);

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of item.items) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error('يجب أن تكون قيم المدين والدائن موجبة فقط');
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Floating-point precision handling
    const tolerance = 0.001;
    if (Math.abs(totalDebit - totalCredit) > tolerance) {
      throw new Error(`القيد غير متوازن: مجموع المدين (${totalDebit}) يجب أن يساوي مجموع الدائن (${totalCredit})`);
    }

    const id = item.id || `jrnl_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newEntry: JournalEntry = {
      id,
      date: item.date || new Date().toISOString().split('T')[0],
      description: item.description || '',
      status: item.status || 'draft',
      items: item.items.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit),
        credit: Number(l.credit)
      })),
      totalDebit: Number(totalDebit.toFixed(3)),
      totalCredit: Number(totalCredit.toFixed(3)),
      referenceType: item.referenceType,
      referenceId: item.referenceId,
      createdAt: item.createdAt || new Date().toISOString()
    };

    // Include tenant tracking properties
    const dbRecord = {
      ...this.mapToDatabase(newEntry),
      school_id: schoolId
    };

    const fallbackRecord = {
      ...newEntry,
      schoolId
    };

    // If unit of work transaction is active, enlist it
    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `INSERT INTO journal_entries (id, school_id, date, description, status, items, total_debit, total_credit, reference_type, reference_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        parameters: [id, schoolId, dbRecord.date, dbRecord.description, dbRecord.status, JSON.stringify(dbRecord.items), dbRecord.total_debit, dbRecord.total_credit, dbRecord.reference_type, dbRecord.reference_id, dbRecord.created_at],
        executionContext: 'Create Journal Entry'
      });
      UnitOfWork.enlistCreate('journal_entries', id, fallbackRecord, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'CREATE_TRANSACTION',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `إدراج قيد يومية معلق في المعاملة المالية: ${id}`,
        { affectedRecord: id, valuesAfter: fallbackRecord }
      );
      return fallbackRecord as JournalEntry;
    }

    // Otherwise, execute synchronously with resilient storage
    return FallbackStorage.performWrite<JournalEntry>(
      schoolId,
      'journal_entries',
      id,
      'INSERT',
      fallbackRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('journal_entries')
          .insert([dbRecord])
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const all = FallbackStorage.getJournalEntries();
        all.unshift(fallbackRecord);
        FallbackStorage.saveJournalEntries(all);
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'CREATE',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `إنشاء قيد يومية متوازن: ${id}`,
        { affectedRecord: id, valuesAfter: res }
      );
      return res;
    });
  }

  public async update(schoolId: string, id: string, item: Partial<JournalEntry> & { meta?: AuditMetadata; postingCapability?: symbol }): Promise<JournalEntry> {
    if (item.postingCapability !== POSTING_ENGINE_CAPABILITY) {
      throw new Error('مخالفة معمارية محاسبية: يمنع منعاً باتاً تعديل قيد يومية خارج PostingEngine. يجب استخدام PostingEngine.updateJournalEntryDraft.');
    }
    const meta = this.getAuditMeta(item);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`قيد اليومية غير موجود: ${id}`);
    }

    // Business rule: Prevent modification of approved/posted entries
    if (existing.status === 'approved' || existing.status === 'posted') {
      throw new Error('يمنع تعديل القيد بعد ترحيله ومصادقته');
    }

    const merged = { ...existing, ...item };

    // Validate period and accounts
    await this.validateDateAndAccounts(schoolId, merged.date, merged.items);

    // Recalculate and validate if items changed
    if (item.items) {
      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of item.items) {
        if (line.debit < 0 || line.credit < 0) {
          throw new Error('يجب أن تكون قيم المدين والدائن موجبة فقط');
        }
        totalDebit += line.debit;
        totalCredit += line.credit;
      }

      const tolerance = 0.001;
      if (Math.abs(totalDebit - totalCredit) > tolerance) {
        throw new Error(`القيد غير متوازن: مجموع المدين (${totalDebit}) يجب أن يساوي مجموع الدائن (${totalCredit})`);
      }

      merged.items = item.items.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit),
        credit: Number(l.credit)
      }));
      merged.totalDebit = Number(totalDebit.toFixed(3));
      merged.totalCredit = Number(totalCredit.toFixed(3));
    }

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
        sqlText: `UPDATE journal_entries SET date = $1, description = $2, status = $3, items = $4, total_debit = $5, total_credit = $6, reference_type = $7, reference_id = $8 WHERE id = $9 AND school_id = $10;`,
        parameters: [dbRecord.date, dbRecord.description, dbRecord.status, JSON.stringify(dbRecord.items), dbRecord.total_debit, dbRecord.total_credit, dbRecord.reference_type, dbRecord.reference_id, id, schoolId],
        executionContext: 'Update Journal Entry'
      });
      UnitOfWork.enlistUpdate('journal_entries', id, fallbackRecord, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE_TRANSACTION',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `تعديل قيد يومية معلق في المعاملة المالية: ${id}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: fallbackRecord }
      );
      return fallbackRecord as JournalEntry;
    }

    return FallbackStorage.performWrite<JournalEntry>(
      schoolId,
      'journal_entries',
      id,
      'UPDATE',
      fallbackRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('journal_entries')
          .update(dbRecord)
          .eq('id', id)
          .eq('school_id', schoolId)
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const all = FallbackStorage.getJournalEntries();
        const idx = all.findIndex(e => e.id === id);
        if (idx > -1) {
          all[idx] = fallbackRecord;
          FallbackStorage.saveJournalEntries(all);
        }
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `تعديل قيد اليومية: ${id}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: res }
      );
      return res;
    });
  }

  public async delete(schoolId: string, id: string, options?: { meta?: AuditMetadata; postingCapability?: symbol }): Promise<boolean> {
    if (options?.postingCapability !== POSTING_ENGINE_CAPABILITY) {
      throw new Error('مخالفة معمارية محاسبية: يمنع منعاً باتاً حذف قيد يومية خارج PostingEngine. يجب استخدام PostingEngine.deleteJournalEntryDraft.');
    }
    const meta = this.getAuditMeta(null, options);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`قيد اليومية غير موجود لعملية الحذف: ${id}`);
    }

    // Business rule: Prevent deletion of approved/posted entries
    if (existing.status === 'approved' || existing.status === 'posted') {
      throw new Error('يمنع حذف قيد مالي مرحل ومصادق عليه');
    }

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `DELETE FROM journal_entries WHERE id = $1 AND school_id = $2;`,
        parameters: [id, schoolId],
        executionContext: 'Delete Journal Entry'
      });
      UnitOfWork.enlistDelete('journal_entries', id, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'DELETE_TRANSACTION',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `حذف قيد يومية معلق في المعاملة المالية: ${id}`,
        { affectedRecord: id, valuesBefore: existing }
      );
      return true;
    }

    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'journal_entries',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', id)
          .eq('school_id', schoolId);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getJournalEntries();
        const filtered = all.filter(e => e.id !== id);
        FallbackStorage.saveJournalEntries(filtered);
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'DELETE',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `حذف قيد اليومية: ${id}`,
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
   * Enlists the creation of a Journal Entry inside a UnitOfWork.
   */
  public static enlistCreateJournalEntry(
    id: string,
    schoolId: string,
    date: string,
    description: string,
    status: string,
    items: any[],
    totalDebit: number,
    totalCredit: number,
    referenceType: string,
    referenceId: string,
    createdAt: string,
    fallbackRecord: JournalEntry
  ): void {
    const command = SQLCommandBuilder.create({
      sqlText: `INSERT INTO journal_entries (id, school_id, date, description, status, items, total_debit, total_credit, reference_type, reference_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
      parameters: [id, schoolId, date, description, status, JSON.stringify(items), totalDebit, totalCredit, referenceType, referenceId, createdAt],
      parameterTypes: ['string', 'string', 'string', 'string', 'string', 'string', 'number', 'number', 'string', 'string', 'string'],
      executionContext: 'Create Journal Entry'
    });
    UnitOfWork.enlistCreate('journal_entries', id, fallbackRecord, command);
  }

  /**
   * Enlists the update of a Journal Entry status inside a UnitOfWork.
   */
  public static enlistUpdateJournalEntryStatus(
    id: string,
    schoolId: string,
    status: string,
    entry: JournalEntry,
    expectedStatus?: string
  ): void {
    const conditionalStatus = expectedStatus ? ' AND status = $4' : '';
    const command = SQLCommandBuilder.create({
      sqlText: `UPDATE journal_entries SET status = $1 WHERE id = $2 AND school_id = $3${conditionalStatus};`,
      parameters: expectedStatus ? [status, id, schoolId, expectedStatus] : [status, id, schoolId],
      parameterTypes: expectedStatus ? ['string', 'string', 'string', 'string'] : ['string', 'string', 'string'],
      executionContext: 'Update Journal Entry Status',
      failIfNoRows: Boolean(expectedStatus)
    });
    UnitOfWork.enlistUpdate('journal_entries', id, entry, command);
  }

  // --- Map Utilities to handle Snake Case in PostgreSQL ---

  private mapFromDatabase(data: any): JournalEntry {
    return {
      id: data.id,
      date: data.date,
      description: data.description,
      status: data.status,
      items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items,
      totalDebit: Number(data.total_debit || data.totalDebit),
      totalCredit: Number(data.total_credit || data.totalCredit),
      referenceType: data.reference_type || data.referenceType,
      referenceId: data.reference_id || data.referenceId,
      createdAt: data.created_at || data.createdAt
    };
  }

  private mapToDatabase(entry: JournalEntry): any {
    return {
      id: entry.id,
      date: entry.date,
      description: entry.description,
      status: entry.status,
      items: entry.items,
      total_debit: entry.totalDebit,
      total_credit: entry.totalCredit,
      reference_type: entry.referenceType || null,
      reference_id: entry.referenceId || null,
      created_at: entry.createdAt
    };
  }

  private async validateDateAndAccounts(schoolId: string, dateStr: string, items: { accountId: string }[]): Promise<void> {
    FallbackStorage.assertCanonicalPersistence(`journal validation for ${schoolId}`);
    // 1. Validate Fiscal Years & Periods
    const fiscalYears = FallbackStorage.getFiscalYears().filter(fy => fy.schoolId === schoolId);
    const date = new Date(dateStr);
    
    // Find the fiscal year enclosing this date
    const enclosingYear = fiscalYears.find(fy => {
      const start = new Date(fy.startDate);
      const end = new Date(fy.endDate);
      return date >= start && date <= end;
    });

    if (!enclosingYear) {
      throw new Error(`التاريخ المحدد (${dateStr}) لا يقع ضمن أي سنة مالية معرّفة في النظام`);
    }

    if (enclosingYear.status === 'closed') {
      throw new Error(`يمنع إدخال حركات محاسبية في سنة مالية مغلقة: ${enclosingYear.yearName}`);
    }

    // Find the accounting period enclosing this date
    const periods = FallbackStorage.getAccountingPeriods().filter(ap => ap.schoolId === schoolId && ap.fiscalYearId === enclosingYear.id);
    const enclosingPeriod = periods.find(ap => {
      const start = new Date(ap.startDate);
      const end = new Date(ap.endDate);
      return date >= start && date <= end;
    });

    if (!enclosingPeriod) {
      throw new Error(`التاريخ المحدد (${dateStr}) لا يقع ضمن أي فترة محاسبية معرّفة في النظام`);
    }

    if (enclosingPeriod.status === 'closed') {
      throw new Error(`يمنع إدخال حركات محاسبية في فترة مالية مغلقة: ${enclosingPeriod.periodName}`);
    }

    // 2. Validate Accounts (must be active and leaf/postable)
    const accounts = FallbackStorage.getAccounts();
    for (const item of items) {
      const acc = accounts.find(a => a.id === item.accountId);
      if (!acc) {
        throw new Error(`الحساب المالي المحدد غير موجود: ${item.accountId}`);
      }
      if (!acc.isActive) {
        throw new Error(`يمنع استخدام حساب مالي غير نشط أو موقوف: ${acc.code} - ${acc.name}`);
      }
      if (!acc.isLeaf) {
        throw new Error(`يمنع التسجيل على حساب تجميعي غير مخصص للحركة (حساب أب): ${acc.code} - ${acc.name}`);
      }
    }
  }
}
