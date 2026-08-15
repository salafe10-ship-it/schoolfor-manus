import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { FiscalYear, AccountingPeriod, AuditMetadata, JournalEntry } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from './AuditRepository';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class FiscalYearRepository implements IBaseRepository<FiscalYear> {

  private getAuditMeta(item: any, options?: any): AuditMetadata {
    const meta = (options?.meta || options?.auditMeta || item?.meta || item?.auditMeta) as AuditMetadata;
    return {
      userId: meta?.userId || 'system_financial',
      userName: meta?.userName || 'Financial Engine',
      userRole: meta?.userRole || 'Accountant',
      ipAddress: meta?.ipAddress || '127.0.0.1'
    };
  }

  public async getById(schoolId: string, id: string): Promise<FiscalYear | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('fiscal_years')
            .select('*')
            .eq('id', id)
            .eq('school_id', schoolId)
            .maybeSingle();
          if (!error && data) {
            return this.mapFromDatabase(data);
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch fiscal year by ID from Supabase:", "FiscalYearRepository", { error: err });
      }
    }

    // Fallback Read
    const list = FallbackStorage.getFiscalYears();
    return list.find(fy => fy.id === id && fy.schoolId === schoolId) || null;
  }

  public async getAll(schoolId: string, options?: { status?: 'open' | 'closed' }): Promise<FiscalYear[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase
            .from('fiscal_years')
            .select('*')
            .eq('school_id', schoolId);

          if (options?.status) {
            query = query.eq('status', options.status);
          }

          const { data, error } = await query.order('start_date', { ascending: false });
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query fiscal years from Supabase:", "FiscalYearRepository", { error: err });
      }
    }

    // Fallback Read
    let list = FallbackStorage.getFiscalYears().filter(fy => fy.schoolId === schoolId);
    if (options?.status) {
      list = list.filter(fy => fy.status === options.status);
    }
    return list;
  }

  public async create(schoolId: string, item: Partial<FiscalYear> & { meta?: AuditMetadata }): Promise<FiscalYear> {
    const meta = this.getAuditMeta(item);

    if (!item.yearName) {
      throw new Error('اسم السنة المالية مطلوب (مثال: 2026)');
    }
    if (!item.startDate || !item.endDate) {
      throw new Error('تاريخ البداية والنهاية مطلوب للسنة المالية');
    }

    // Validation: prevent overlapping years
    const all = await this.getAll(schoolId);
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    if (start >= end) {
      throw new Error('تاريخ بداية السنة المالية يجب أن يكون أسبق من تاريخ النهاية');
    }

    for (const fy of all) {
      const fyStart = new Date(fy.startDate);
      const fyEnd = new Date(fy.endDate);
      if (
        (start >= fyStart && start <= fyEnd) ||
        (end >= fyStart && end <= fyEnd) ||
        (start <= fyStart && end >= fyEnd)
      ) {
        throw new Error(`تداخل تواريخ السنة المالية الجديدة مع سنة مالية قائمة بالفعل: ${fy.yearName}`);
      }
    }

    const id = item.id || `fy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newYear: FiscalYear = {
      id,
      yearName: item.yearName,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status || 'open',
      schoolId
    };

    const dbRecord = {
      id: newYear.id,
      year_name: newYear.yearName,
      start_date: newYear.startDate,
      end_date: newYear.endDate,
      status: newYear.status,
      school_id: schoolId
    };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `INSERT INTO fiscal_years (id, school_id, year_name, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5, $6);`,
        parameters: [id, schoolId, dbRecord.year_name, dbRecord.start_date, dbRecord.end_date, dbRecord.status],
        executionContext: 'Create Fiscal Year'
      });
      UnitOfWork.enlistCreate('fiscal_years', id, newYear, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'CREATE_TRANSACTION',
        'FISCAL_MANAGEMENT',
        meta.ipAddress,
        `إدراج سنة مالية معلقة: ${newYear.yearName}`,
        { affectedRecord: id, valuesAfter: newYear }
      );
      return newYear;
    }

    return FallbackStorage.performWrite<FiscalYear>(
      schoolId,
      'fiscal_years',
      id,
      'INSERT',
      newYear,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('fiscal_years')
          .insert([dbRecord])
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const list = FallbackStorage.getFiscalYears();
        list.push(newYear);
        FallbackStorage.saveFiscalYears(list);
      }
    ).then(async (res) => {
      // Automatically generate 12 monthly accounting periods for this fiscal year as an ERP best practice
      await this.generateMonthlyPeriods(schoolId, res);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'CREATE',
        'FISCAL_MANAGEMENT',
        meta.ipAddress,
        `فتح سنة مالية جديدة وتوليد فتراتها تلقائياً: ${res.yearName}`,
        { affectedRecord: id, valuesAfter: res }
      );
      return res;
    });
  }

  public async update(schoolId: string, id: string, item: Partial<FiscalYear> & { meta?: AuditMetadata }): Promise<FiscalYear> {
    const meta = this.getAuditMeta(item);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`السنة المالية غير موجودة للتعديل: ${id}`);
    }

    const merged = { ...existing, ...item };
    const dbRecord = {
      id: merged.id,
      year_name: merged.yearName,
      start_date: merged.startDate,
      end_date: merged.endDate,
      status: merged.status,
      school_id: schoolId
    };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE fiscal_years SET year_name = $1, start_date = $2, end_date = $3, status = $4 WHERE id = $5 AND school_id = $6;`,
        parameters: [dbRecord.year_name, dbRecord.start_date, dbRecord.end_date, dbRecord.status, id, schoolId],
        executionContext: 'Update Fiscal Year'
      });
      UnitOfWork.enlistUpdate('fiscal_years', id, merged, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE_TRANSACTION',
        'FISCAL_MANAGEMENT',
        meta.ipAddress,
        `تعديل سنة مالية معلق: ${existing.yearName}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: merged }
      );
      return merged;
    }

    return FallbackStorage.performWrite<FiscalYear>(
      schoolId,
      'fiscal_years',
      id,
      'UPDATE',
      merged,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('fiscal_years')
          .update(dbRecord)
          .eq('id', id)
          .eq('school_id', schoolId)
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const list = FallbackStorage.getFiscalYears();
        const idx = list.findIndex(fy => fy.id === id);
        if (idx > -1) {
          list[idx] = merged;
          FallbackStorage.saveFiscalYears(list);
        }
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE',
        'FISCAL_MANAGEMENT',
        meta.ipAddress,
        `تعديل السنة المالية: ${res.yearName}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: res }
      );
      return res;
    });
  }

  public async delete(schoolId: string, id: string, options?: { meta?: AuditMetadata }): Promise<boolean> {
    const meta = this.getAuditMeta(null, options);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`السنة المالية غير موجودة للحذف: ${id}`);
    }

    if (existing.status === 'closed') {
      throw new Error('يمنع حذف سنة مالية مغلقة بالكامل');
    }

    // Check if contains transactions
    const entries = FallbackStorage.getJournalEntries();
    const start = new Date(existing.startDate);
    const end = new Date(existing.endDate);
    const hasTx = entries.some(e => {
      const d = new Date(e.date);
      return d >= start && d <= end && (e as any).schoolId === schoolId;
    });

    if (hasTx) {
      throw new Error('يمنع حذف السنة المالية نظراً لوجود قيود وحركات مالية مسجلة فيها');
    }

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `DELETE FROM fiscal_years WHERE id = $1 AND school_id = $2;`,
        parameters: [id, schoolId],
        executionContext: 'Delete Fiscal Year'
      });
      UnitOfWork.enlistDelete('fiscal_years', id, command);
      return true;
    }

    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'fiscal_years',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { error } = await supabase
          .from('fiscal_years')
          .delete()
          .eq('id', id)
          .eq('school_id', schoolId);
        if (error) throw error;
        return true;
      },
      () => {
        const list = FallbackStorage.getFiscalYears();
        FallbackStorage.saveFiscalYears(list.filter(fy => fy.id !== id));
        
        // Also delete sub periods
        const periods = FallbackStorage.getAccountingPeriods();
        FallbackStorage.saveAccountingPeriods(periods.filter(ap => ap.fiscalYearId !== id));
      }
    ).then(async (res) => {
      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'DELETE',
        'FISCAL_MANAGEMENT',
        meta.ipAddress,
        `حذف السنة المالية وتطهير فتراتها بالكامل: ${existing.yearName}`,
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
    const list = await this.getAll(schoolId, options);
    return list.length;
  }

  // --- PERIOD-SPECIFIC ENDPOINTS ---

  public async getPeriods(schoolId: string, fiscalYearId: string): Promise<AccountingPeriod[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('accounting_periods')
            .select('*')
            .eq('fiscal_year_id', fiscalYearId)
            .eq('school_id', schoolId)
            .order('start_date', { ascending: true });
          if (!error && data) {
            return data.map(d => ({
              id: d.id,
              fiscalYearId: d.fiscal_year_id,
              periodName: d.period_name,
              startDate: d.start_date,
              endDate: d.end_date,
              status: d.status,
              schoolId: d.school_id
            }));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query periods from Supabase:", "FiscalYearRepository", { error: err });
      }
    }

    return FallbackStorage.getAccountingPeriods().filter(ap => ap.fiscalYearId === fiscalYearId && ap.schoolId === schoolId);
  }

  public async updatePeriodStatus(
    schoolId: string, 
    periodId: string, 
    status: 'open' | 'closed' | 'locked', 
    meta?: AuditMetadata
  ): Promise<boolean> {
    const auditContext = meta || { userId: 'system', userName: 'Financial Administrator', userRole: 'Accountant', ipAddress: '127.0.0.1' };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `UPDATE accounting_periods SET status = $1 WHERE id = $2 AND school_id = $3;`,
        parameters: [status, periodId, schoolId],
        executionContext: 'Update Accounting Period'
      });
      const all = FallbackStorage.getAccountingPeriods();
      const existing = all.find(p => p.id === periodId && p.schoolId === schoolId);
      if (existing) {
        UnitOfWork.enlistUpdate('accounting_periods', periodId, { status }, command);
        
        await AuditRepository.log(
          schoolId,
          auditContext.userId,
          auditContext.userName,
          auditContext.userRole,
          'UPDATE',
          'FISCAL_MANAGEMENT',
          auditContext.ipAddress,
          `تعديل حالة الفترة المالية المحاسبية ${existing.periodName} إلى: ${status === 'open' ? 'مفتوحة' : status === 'locked' ? 'مغلقة محاسبياً (مؤمنة)' : 'مغلقة قطعياً'}`,
          { affectedRecord: periodId, valuesBefore: existing, valuesAfter: { ...existing, status } }
        );
      }
      return true;
    }

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { error } = await supabase
            .from('accounting_periods')
            .update({ status })
            .eq('id', periodId)
            .eq('school_id', schoolId);
          if (error) throw error;
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to update period status in Supabase:", "FiscalYearRepository", { error: err });
      }
    }

    const all = FallbackStorage.getAccountingPeriods();
    const idx = all.findIndex(p => p.id === periodId && p.schoolId === schoolId);
    if (idx > -1) {
      const old = all[idx];
      all[idx] = { ...old, status };
      FallbackStorage.saveAccountingPeriods(all);

      await AuditRepository.log(
        schoolId,
        auditContext.userId,
        auditContext.userName,
        auditContext.userRole,
        'UPDATE',
        'FISCAL_MANAGEMENT',
        auditContext.ipAddress,
        `تعديل حالة الفترة المالية المحاسبية ${old.periodName} إلى: ${status === 'open' ? 'مفتوحة' : status === 'locked' ? 'مغلقة محاسبياً (مؤمنة)' : 'مغلقة قطعياً'}`,
        { affectedRecord: periodId, valuesBefore: old, valuesAfter: all[idx] }
      );
      return true;
    }
    return false;
  }

  /**
   * Generates 12 monthly accounting periods for a given fiscal year automatically.
   */
  private async generateMonthlyPeriods(schoolId: string, fy: FiscalYear): Promise<void> {
    const start = new Date(fy.startDate);
    const periods: AccountingPeriod[] = [];

    for (let i = 0; i < 12; i++) {
      const pStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const pEnd = new Date(start.getFullYear(), start.getMonth() + i + 1, 0);

      // format ISO date string
      const startStr = pStart.toISOString().split('T')[0];
      const endStr = pEnd.toISOString().split('T')[0];
      const periodName = `${start.getFullYear()}-${String(pStart.getMonth() + 1).padStart(2, '0')}`;

      periods.push({
        id: `ap_${fy.id}_${i + 1}`,
        fiscalYearId: fy.id,
        periodName,
        startDate: startStr,
        endDate: endStr,
        status: 'open',
        schoolId
      });
    }

    // Save
    const existingPeriods = FallbackStorage.getAccountingPeriods();
    FallbackStorage.saveAccountingPeriods([...existingPeriods, ...periods]);

    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const dbRecords = periods.map(p => ({
            id: p.id,
            fiscal_year_id: p.fiscalYearId,
            period_name: p.periodName,
            start_date: p.startDate,
            end_date: p.endDate,
            status: p.status,
            school_id: schoolId
          }));
          await supabase.from('accounting_periods').insert(dbRecords);
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to insert generated periods to Supabase:", "FiscalYearRepository", { error: err });
      }
    }
  }

  /**
   * CPA standard closure function:
   * Transfers opening balances from a closed year to a new active year.
   */
  public async transferOpeningBalances(
    schoolId: string,
    fromYearId: string,
    toYearId: string,
    meta?: AuditMetadata
  ): Promise<JournalEntry> {
    const auditContext = meta || { userId: 'system', userName: 'Financial Administrator', userRole: 'Accountant', ipAddress: '127.0.0.1' };

    const fromYear = await this.getById(schoolId, fromYearId);
    const toYear = await this.getById(schoolId, toYearId);

    if (!fromYear || !toYear) {
      throw new Error('السنة المالية المصدر أو المستهدفة غير موجودة للتدوير');
    }

    if (toYear.status !== 'open') {
      throw new Error('يمنع تدوير الأرصدة إلى سنة مالية مغلقة بالكامل');
    }

    // Calculate balances of each account up to the endDate of fromYear
    const accounts = FallbackStorage.getAccounts();
    const journalEntries = FallbackStorage.getJournalEntries().filter(e => {
      const d = new Date(e.date);
      const fromStart = new Date(fromYear.startDate);
      const fromEnd = new Date(fromYear.endDate);
      return d >= fromStart && d <= fromEnd && (e as any).schoolId === schoolId;
    });

    const vouchers = FallbackStorage.getVouchers().filter(v => {
      const d = new Date(v.date);
      const fromStart = new Date(fromYear.startDate);
      const fromEnd = new Date(fromYear.endDate);
      return d >= fromStart && d <= fromEnd && (v as any).schoolId === schoolId;
    });

    // Compute actual balances for Asset, Liability, and Equity accounts
    const openingBalances: { accountId: string; debit: number; credit: number }[] = [];
    let netDebit = 0;
    let netCredit = 0;

    for (const acc of accounts) {
      // Only Balance Sheet accounts are carried forward (Assets, Liabilities, Equity)
      if (acc.nature !== 'asset' && acc.nature !== 'liability' && acc.nature !== 'equity') {
        continue;
      }

      if (!acc.isLeaf) {
        continue;
      }

      // Starting seed balance plus summing all entries
      let balance = acc.balance;

      // Sum debits and credits of journal entries
      for (const entry of journalEntries) {
        for (const item of entry.items) {
          if (item.accountId === acc.id) {
            if (acc.nature === 'asset') {
              balance += (item.debit - item.credit);
            } else {
              balance += (item.credit - item.debit);
            }
          }
        }
      }

      // Sum vouchers
      for (const v of vouchers) {
        if (v.accountId === acc.id) {
          if (v.type === 'receipt') {
            if (acc.nature === 'asset') balance += v.amount;
            else balance -= v.amount;
          } else if (v.type === 'payment') {
            if (acc.nature === 'asset') balance -= v.amount;
            else balance += v.amount;
          }
        }
      }

      if (balance !== 0) {
        if (acc.nature === 'asset') {
          if (balance > 0) {
            openingBalances.push({ accountId: acc.id, debit: balance, credit: 0 });
            netDebit += balance;
          } else {
            openingBalances.push({ accountId: acc.id, debit: 0, credit: Math.abs(balance) });
            netCredit += Math.abs(balance);
          }
        } else {
          // liability or equity
          if (balance > 0) {
            openingBalances.push({ accountId: acc.id, debit: 0, credit: balance });
            netCredit += balance;
          } else {
            openingBalances.push({ accountId: acc.id, debit: Math.abs(balance), credit: 0 });
            netDebit += Math.abs(balance);
          }
        }
      }
    }

    if (openingBalances.length === 0) {
      throw new Error('لا توجد أرصدة محاسبية مستمرة لترحيلها وتدويرها');
    }

    // Verify equation balance
    const diff = Math.abs(netDebit - netCredit);
    if (diff > 0.001) {
      // Create a balanced discrepancy adjustment to the equity/retained earnings account
      const retainedEarningsAcc = accounts.find(a => a.name.includes('أرباح') || a.nature === 'equity');
      if (retainedEarningsAcc) {
        if (netDebit > netCredit) {
          openingBalances.push({ accountId: retainedEarningsAcc.id, debit: 0, credit: diff });
          netCredit += diff;
        } else {
          openingBalances.push({ accountId: retainedEarningsAcc.id, debit: diff, credit: 0 });
          netDebit += diff;
        }
      } else {
        throw new Error(`ميزانية السنة مغلقة بفرق غير متوازن بقيمة (${diff}) ولم يتم العثور على حساب أرباح محتجزة لتسوية الفروقات`);
      }
    }

    // Create the balanced opening journal entry in the target year
    const openingEntryDate = toYear.startDate;
    const openingEntryId = `jrnl_opening_${toYear.yearName}_${Date.now()}`;

    const PostingEngine = (await import('../services/PostingEngine')).PostingEngine;
    const result = await PostingEngine.createJournalEntryDraft(schoolId, {
      id: openingEntryId,
      date: openingEntryDate,
      description: `قيد تدوير الأرصدة الافتتاحية المدققة من السنة المالية السابقة: ${fromYear.yearName}`,
      status: 'approved',
      items: openingBalances,
      totalDebit: netDebit,
      totalCredit: netCredit,
      referenceType: 'other',
      referenceId: fromYear.id,
      meta: auditContext
    } as any);

    await AuditRepository.log(
      schoolId,
      auditContext.userId,
      auditContext.userName,
      auditContext.userRole,
      'UPDATE',
      'FISCAL_MANAGEMENT',
      auditContext.ipAddress,
      `إتمام عملية إقفال السنة المالية ${fromYear.yearName} بنجاح وترحيل الأرصدة الافتتاحية للسنة ${toYear.yearName}`,
      { affectedRecord: fromYearId, valuesAfter: { fromYear: fromYearId, toYear: toYearId, openingEntry: result.id } }
    );

    return result;
  }

  // --- Map Utilities ---

  private mapFromDatabase(data: any): FiscalYear {
    return {
      id: data.id,
      yearName: data.year_name || data.yearName,
      startDate: data.start_date || data.startDate,
      endDate: data.end_date || data.endDate,
      status: data.status,
      baseCurrency: data.base_currency || data.baseCurrency,
      notes: data.notes,
      createdAt: data.created_at || data.createdAt,
      createdBy: data.created_by || data.createdBy,
      schoolId: data.school_id || data.schoolId
    };
  }
}
