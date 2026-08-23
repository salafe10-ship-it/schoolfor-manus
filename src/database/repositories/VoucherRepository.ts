import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { Voucher, AuditMetadata, VoucherType } from '../../types';
import { IBaseRepository } from './IBaseRepository';
import { UnitOfWork } from '../UnitOfWork';
import { AuditRepository } from './AuditRepository';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class VoucherRepository implements IBaseRepository<Voucher> {

  /**
   * Helper to extract audit metadata.
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

  /**
   * Generates a professional, sequential, collision-free code for voucher number.
   * e.g., RV-202607-0001 (Receipt), PV-202607-0001 (Payment), JV-202607-0001 (Journal)
   */
  public async generateVoucherNumber(schoolId: string, type: VoucherType, dateStr: string): Promise<string> {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    let prefix = 'JV';
    if (type === 'receipt') prefix = 'RV';
    else if (type === 'payment') prefix = 'PV';
    else if (type === 'contra') prefix = 'CV';
    
    // Read all vouchers for sequential number checking
    const all = await this.getAll(schoolId);
    const countThisMonth = all.filter(v => 
      v.type === type && 
      v.date.startsWith(`${year}-${month}`)
    ).length;
    
    let index = countThisMonth + 1;
    let code = `${prefix}-${year}${month}-${String(index).padStart(4, '0')}`;
    
    // Prevent duplicate codes by scanning existing ones
    while (all.some(v => v.voucherNumber === code)) {
      index++;
      code = `${prefix}-${year}${month}-${String(index).padStart(4, '0')}`;
    }
    
    return code;
  }

  public async getById(schoolId: string, id: string): Promise<Voucher | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('id', id)
            .eq('school_id', schoolId)
            .maybeSingle();
          if (!error && data) {
            return this.mapFromDatabase(data);
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch voucher by ID from Supabase:", "VoucherRepository", { error: err });
      }
    }

    // Fallback Read
    FallbackStorage.assertCanonicalPersistence('voucher by id read');
    const vouchers = FallbackStorage.getVouchers();
    return vouchers.find(v => v.id === id && (v as any).schoolId === schoolId) || null;
  }

  public async getAll(schoolId: string, options?: { type?: VoucherType; status?: string; accountId?: string }): Promise<Voucher[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          let query = supabase
            .from('vouchers')
            .select('*')
            .eq('school_id', schoolId);

          if (options?.type) {
            query = query.eq('type', options.type);
          }
          if (options?.status) {
            query = query.eq('status', options.status);
          }
          if (options?.accountId) {
            query = query.eq('account_id', options.accountId);
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to query vouchers from Supabase:", "VoucherRepository", { error: err });
      }
    }

    // Fallback Read
    FallbackStorage.assertCanonicalPersistence('voucher list read');
    let vouchers = FallbackStorage.getVouchers().filter(v => (v as any).schoolId === schoolId);
    if (options?.type) {
      vouchers = vouchers.filter(v => v.type === options.type);
    }
    if (options?.status) {
      vouchers = vouchers.filter(v => v.status === options.status);
    }
    if (options?.accountId) {
      vouchers = vouchers.filter(v => v.accountId === options.accountId);
    }
    return vouchers;
  }

  public async create(schoolId: string, item: Partial<Voucher> & { meta?: AuditMetadata }): Promise<Voucher> {
    const meta = this.getAuditMeta(item);

    // Business validations
    if (!item.type) {
      throw new Error('نوع السند مطلوب ومحدد برمجياً');
    }
    if (!item.accountId) {
      throw new Error('الحساب المالي المرتبط بالسند مطلوب');
    }
    if (item.amount === undefined || item.amount <= 0) {
      throw new Error('قيمة السند يجب أن تكون أكبر من صفر');
    }

    const date = item.date || new Date().toISOString().split('T')[0];
    await this.validateDateAndAccount(schoolId, date, item.accountId);
    
    // Auto-generate professional voucher number
    const voucherNumber = item.voucherNumber || await this.generateVoucherNumber(schoolId, item.type, date);

    // Verify duplicate codes directly
    const all = await this.getAll(schoolId);
    if (all.some(v => v.voucherNumber === voucherNumber)) {
      throw new Error(`رقم السند مكرر بالفعل في النظام: ${voucherNumber}`);
    }

    const id = item.id || `vch_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newVoucher: Voucher = {
      id,
      voucherNumber,
      type: item.type,
      date,
      amount: Number(item.amount),
      accountId: item.accountId,
      description: item.description || '',
      status: item.status || 'draft',
      journalEntryId: item.journalEntryId,
      createdAt: item.createdAt || new Date().toISOString()
    };

    const dbRecord = {
      ...this.mapToDatabase(newVoucher),
      school_id: schoolId
    };

    const fallbackRecord = {
      ...newVoucher,
      schoolId
    };

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `INSERT INTO vouchers (id, school_id, voucher_number, type, date, amount, account_id, description, status, journal_entry_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        parameters: [id, schoolId, dbRecord.voucher_number, dbRecord.type, dbRecord.date, dbRecord.amount, dbRecord.account_id, dbRecord.description, dbRecord.status, dbRecord.journal_entry_id, dbRecord.created_at],
        executionContext: 'Create Voucher'
      });
      UnitOfWork.enlistCreate('vouchers', id, fallbackRecord, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'CREATE_TRANSACTION',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `إدراج سند مالي معلق في المعاملة المالية: ${voucherNumber}`,
        { affectedRecord: id, valuesAfter: fallbackRecord }
      );
      return fallbackRecord as Voucher;
    }

    return FallbackStorage.performWrite<Voucher>(
      schoolId,
      'vouchers',
      id,
      'INSERT',
      fallbackRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('vouchers')
          .insert([dbRecord])
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const all = FallbackStorage.getVouchers();
        all.unshift(fallbackRecord);
        FallbackStorage.saveVouchers(all);
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
        `إنشاء سند مالي تلقائي الرقم: ${res.voucherNumber}`,
        { affectedRecord: id, valuesAfter: res }
      );
      return res;
    });
  }

  public async update(schoolId: string, id: string, item: Partial<Voucher> & { meta?: AuditMetadata }): Promise<Voucher> {
    const meta = this.getAuditMeta(item);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`السند المالي غير موجود للتعديل: ${id}`);
    }

    // Business rule: Prevent modification of posted vouchers
    if (existing.status === 'posted') {
      throw new Error('يمنع تعديل السند المالي بعد ترحيله واعتماده');
    }

    if (item.amount !== undefined && item.amount <= 0) {
      throw new Error('قيمة السند المالي المعدلة يجب أن تكون أكبر من صفر');
    }

    // If voucherNumber is being updated, verify uniqueness
    if (item.voucherNumber && item.voucherNumber !== existing.voucherNumber) {
      const all = await this.getAll(schoolId);
      if (all.some(v => v.voucherNumber === item.voucherNumber && v.id !== id)) {
        throw new Error(`رقم السند الجديد مكرر بالفعل في النظام: ${item.voucherNumber}`);
      }
    }

    const merged = { ...existing, ...item };
    await this.validateDateAndAccount(schoolId, merged.date, merged.accountId);

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
        sqlText: `UPDATE vouchers SET voucher_number = $1, type = $2, date = $3, amount = $4, account_id = $5, description = $6, status = $7, journal_entry_id = $8 WHERE id = $9 AND school_id = $10;`,
        parameters: [dbRecord.voucher_number, dbRecord.type, dbRecord.date, dbRecord.amount, dbRecord.account_id, dbRecord.description, dbRecord.status, dbRecord.journal_entry_id, id, schoolId],
        executionContext: 'Update Voucher'
      });
      UnitOfWork.enlistUpdate('vouchers', id, fallbackRecord, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'UPDATE_TRANSACTION',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `تعديل سند مالي معلق في المعاملة المالية: ${existing.voucherNumber}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: fallbackRecord }
      );
      return fallbackRecord as Voucher;
    }

    return FallbackStorage.performWrite<Voucher>(
      schoolId,
      'vouchers',
      id,
      'UPDATE',
      fallbackRecord,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { data, error } = await supabase
          .from('vouchers')
          .update(dbRecord)
          .eq('id', id)
          .eq('school_id', schoolId)
          .select()
          .single();
        if (error) throw error;
        return this.mapFromDatabase(data);
      },
      () => {
        const all = FallbackStorage.getVouchers();
        const idx = all.findIndex(v => v.id === id);
        if (idx > -1) {
          all[idx] = fallbackRecord;
          FallbackStorage.saveVouchers(all);
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
        `تعديل السند المالي الرقم: ${res.voucherNumber}`,
        { affectedRecord: id, valuesBefore: existing, valuesAfter: res }
      );
      return res;
    });
  }

  public async delete(schoolId: string, id: string, options?: { meta?: AuditMetadata }): Promise<boolean> {
    const meta = this.getAuditMeta(null, options);
    const existing = await this.getById(schoolId, id);
    if (!existing) {
      throw new Error(`السند المالي غير موجود للحذف: ${id}`);
    }

    // Business rule: Prevent deletion of posted vouchers
    if (existing.status === 'posted') {
      throw new Error('يمنع حذف سند مالي بعد ترحيله واعتماده');
    }

    if (UnitOfWork.isTransactionActive()) {
      const command = SQLCommandBuilder.create({
        sqlText: `DELETE FROM vouchers WHERE id = $1 AND school_id = $2;`,
        parameters: [id, schoolId],
        executionContext: 'Delete Voucher'
      });
      UnitOfWork.enlistDelete('vouchers', id, command);

      await AuditRepository.log(
        schoolId,
        meta.userId,
        meta.userName,
        meta.userRole,
        'DELETE_TRANSACTION',
        'FINANCIAL_ENGINE',
        meta.ipAddress,
        `حذف سند مالي معلق في المعاملة المالية: ${existing.voucherNumber}`,
        { affectedRecord: id, valuesBefore: existing }
      );
      return true;
    }

    return FallbackStorage.performWrite<boolean>(
      schoolId,
      'vouchers',
      id,
      'DELETE',
      true,
      async () => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("No Supabase client available");
        const { error } = await supabase
          .from('vouchers')
          .delete()
          .eq('id', id)
          .eq('school_id', schoolId);
        if (error) throw error;
        return true;
      },
      () => {
        const all = FallbackStorage.getVouchers();
        const filtered = all.filter(v => v.id !== id);
        FallbackStorage.saveVouchers(filtered);
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
        `حذف السند المالي الرقم: ${existing.voucherNumber}`,
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

  // --- Map Utilities to handle Snake Case in PostgreSQL ---

  private mapFromDatabase(data: any): Voucher {
    return {
      id: data.id,
      voucherNumber: data.voucher_number || data.voucherNumber,
      type: data.type as VoucherType,
      date: data.date,
      amount: Number(data.amount),
      accountId: data.account_id || data.accountId,
      description: data.description,
      status: data.status,
      journalEntryId: data.journal_entry_id || data.journalEntryId,
      createdAt: data.created_at || data.createdAt
    };
  }

  private mapToDatabase(vch: Voucher): any {
    return {
      id: vch.id,
      voucher_number: vch.voucherNumber,
      type: vch.type,
      date: vch.date,
      amount: vch.amount,
      account_id: vch.accountId,
      description: vch.description,
      status: vch.status,
      journal_entry_id: vch.journalEntryId || null,
      created_at: vch.createdAt
    };
  }

  private async validateDateAndAccount(schoolId: string, dateStr: string, accountId: string): Promise<void> {
    FallbackStorage.assertCanonicalPersistence('voucher fiscal and account validation read');
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

    // 2. Validate Account (must be active and leaf/postable)
    const accounts = FallbackStorage.getAccounts();
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) {
      throw new Error(`الحساب المالي المحدد غير موجود: ${accountId}`);
    }
    if (!acc.isActive) {
      throw new Error(`يمنع استخدام حساب مالي غير نشط أو موقوف: ${acc.code} - ${acc.name}`);
    }
    if (!acc.isLeaf) {
      throw new Error(`يمنع التسجيل على حساب تجميعي غير مخصص للحركة (حساب أب): ${acc.code} - ${acc.name}`);
    }
  }
}
