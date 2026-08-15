import { getSupabaseClient } from '../client';
import { FallbackStorage } from '../repositories/FallbackStorage';
import { ClosingAuditLog } from '../repositories/FinancialClosingTypes';
import { PersistenceHealthService } from './PersistenceHealthService';
import { AuditRepository } from '../repositories/AuditRepository';
import { FiscalYearRepository } from '../repositories/FiscalYearRepository';
import { JournalRepository } from '../repositories/JournalRepository';
import { JournalEntry, AccountingPeriod, FiscalYear } from '../../types';
import { EnterpriseLogger } from './EnterpriseLogger';

export interface IFinancialClosingStorageProvider {
  saveClosingLog(schoolId: string, log: ClosingAuditLog): Promise<void>;
  getClosingLogs(schoolId: string): Promise<ClosingAuditLog[]>;
  updatePeriodStatus(schoolId: string, periodId: string, status: 'open' | 'closed' | 'locked', operator: any): Promise<boolean>;
  getJournalEntries(schoolId: string): Promise<JournalEntry[]>;
  getGeneralLedgerLines(schoolId: string): Promise<any[]>;
  getPeriodsForSchool(schoolId: string): Promise<AccountingPeriod[]>;
  getFiscalYears(schoolId: string, options?: { status?: 'open' | 'closed' }): Promise<FiscalYear[]>;
  getPeriods(schoolId: string, fiscalYearId: string): Promise<AccountingPeriod[]>;
}

export class ProductionClosingDatabaseProvider implements IFinancialClosingStorageProvider {
  private fiscalRepo = new FiscalYearRepository();
  private journalRepo = new JournalRepository();

  public async saveClosingLog(schoolId: string, log: ClosingAuditLog): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('خطأ إنتاجي حرج: عميل قاعدة البيانات غير متوفر أو غير مهيأ.');
    }

    // Save closing log into the verified production audit_logs table
    const serializedDetails = JSON.stringify({
      closingType: log.closingType,
      details: log.details,
      auditReference: log.auditReference,
      status: log.status,
      executedBy: log.executedBy
    });

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        id: log.id,
        school_id: schoolId,
        timestamp: log.executedAt,
        user_id: log.executedBy.userId,
        user_name: log.executedBy.userName,
        user_role: log.executedBy.userRole,
        action: 'CLOSE_PERIOD_EXECUTION',
        module: 'FINANCIAL_CLOSING',
        ip_address: log.executedBy.ipAddress,
        details: serializedDetails
      }]);

    if (error) {
      throw new Error(`فشل تسجيل سجل الإغلاق المالي في قاعدة البيانات الرسمية لبيئة الإنتاج: ${error.message}`);
    }
  }

  public async getClosingLogs(schoolId: string): Promise<ClosingAuditLog[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('خطأ إنتاجي حرج: عميل قاعدة البيانات غير متوفر أو غير مهيأ.');
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .eq('module', 'FINANCIAL_CLOSING')
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`فشل جلب سجلات الإغلاق المالي من قاعدة البيانات الرسمية للإنتاج: ${error.message}`);
    }

    return (data || []).map(d => this.mapFromDB(d));
  }

  public async updatePeriodStatus(
    schoolId: string,
    periodId: string,
    status: 'open' | 'closed' | 'locked',
    operator: any
  ): Promise<boolean> {
    const meta = {
      userId: operator.userId,
      userName: operator.userName,
      userRole: operator.userRole,
      ipAddress: operator.ipAddress
    };
    return await this.fiscalRepo.updatePeriodStatus(schoolId, periodId, status, meta);
  }

  public async getJournalEntries(schoolId: string): Promise<JournalEntry[]> {
    return await this.journalRepo.getAll(schoolId);
  }

  public async getGeneralLedgerLines(schoolId: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('general_ledger')
          .select('*')
          .eq('school_id', schoolId);
        if (!error && data) {
          return data.map(d => ({
            id: d.id,
            schoolId: d.school_id,
            accountId: d.account_id,
            date: d.date,
            debit: d.debit,
            credit: d.credit,
            balanceAfter: d.balance_after,
            referenceType: d.reference_type,
            referenceId: d.reference_id,
            description: d.description,
            createdAt: d.created_at
          }));
        }
      } catch (err: any) {
        EnterpriseLogger.error(
          "Failed to query general ledger from Supabase",
          "FinancialClosingStorage",
          { error: err?.message || String(err) }
        );
      }
    }
    return FallbackStorage.getGeneralLedgerLines().filter(gl => gl.schoolId === schoolId);
  }

  public async getPeriodsForSchool(schoolId: string): Promise<AccountingPeriod[]> {
    const years = await this.fiscalRepo.getAll(schoolId);
    const allPeriods: AccountingPeriod[] = [];
    for (const yr of years) {
      const periods = await this.fiscalRepo.getPeriods(schoolId, yr.id);
      allPeriods.push(...periods);
    }
    return allPeriods;
  }

  public async getFiscalYears(schoolId: string, options?: { status?: 'open' | 'closed' }): Promise<FiscalYear[]> {
    return await this.fiscalRepo.getAll(schoolId, options);
  }

  public async getPeriods(schoolId: string, fiscalYearId: string): Promise<AccountingPeriod[]> {
    return await this.fiscalRepo.getPeriods(schoolId, fiscalYearId);
  }

  private mapFromDB(data: any): ClosingAuditLog {
    let parsed: any = {};
    try {
      parsed = JSON.parse(data.details);
    } catch {
      parsed = {};
    }

    return {
      id: data.id,
      schoolId: data.school_id,
      periodId: parsed.periodId || data.affectedRecord || '',
      periodName: parsed.periodName || '',
      closingType: parsed.closingType || 'monthly',
      executedBy: parsed.executedBy || {
        userId: data.user_id,
        userName: data.user_name,
        userRole: data.user_role,
        ipAddress: data.ip_address || ''
      },
      executedAt: data.timestamp,
      status: parsed.status || 'success',
      auditReference: parsed.auditReference || '',
      details: parsed.details || {}
    };
  }
}

export class FallbackClosingStorageProvider implements IFinancialClosingStorageProvider {
  private fiscalRepo = new FiscalYearRepository();

  public async saveClosingLog(schoolId: string, log: ClosingAuditLog): Promise<void> {
    EnterpriseLogger.warn(
      'Using LocalStorage/JSON fallback for Development/Test environment.',
      'FallbackClosingStorage'
    );
    const key = `closing_logs_${schoolId}`;
    const logs = await this.getClosingLogs(schoolId);
    logs.unshift(log);

    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(logs));
    } else {
      FallbackStorage.safeWriteFile(`closing_logs_${schoolId}.json`, logs);
    }

    // Also register in Fallback AuditLogs
    await AuditRepository.create(schoolId, {
      id: log.id,
      timestamp: log.executedAt,
      userId: log.executedBy.userId,
      userName: log.executedBy.userName,
      userRole: log.executedBy.userRole as any,
      action: 'CLOSE_PERIOD_EXECUTION',
      module: 'FINANCIAL_CLOSING',
      ipAddress: log.executedBy.ipAddress,
      details: JSON.stringify(log)
    });
  }

  public async getClosingLogs(schoolId: string): Promise<ClosingAuditLog[]> {
    EnterpriseLogger.warn(
      'Reading from local offline cache for Development/Test environment.',
      'FallbackClosingStorage'
    );
    if (typeof window !== 'undefined') {
      const key = `closing_logs_${schoolId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } else {
      return FallbackStorage.safeReadFile<ClosingAuditLog[]>(`closing_logs_${schoolId}.json`, []);
    }
  }

  public async updatePeriodStatus(
    schoolId: string,
    periodId: string,
    status: 'open' | 'closed' | 'locked',
    operator: any
  ): Promise<boolean> {
    const meta = {
      userId: operator.userId,
      userName: operator.userName,
      userRole: operator.userRole,
      ipAddress: operator.ipAddress
    };
    return await this.fiscalRepo.updatePeriodStatus(schoolId, periodId, status, meta);
  }

  public async getJournalEntries(schoolId: string): Promise<JournalEntry[]> {
    return FallbackStorage.getJournalEntries().filter(e => (e as any).schoolId === schoolId);
  }

  public async getGeneralLedgerLines(schoolId: string): Promise<any[]> {
    return FallbackStorage.getGeneralLedgerLines().filter(gl => gl.schoolId === schoolId);
  }

  public async getPeriodsForSchool(schoolId: string): Promise<AccountingPeriod[]> {
    return FallbackStorage.getAccountingPeriods().filter(p => p.schoolId === schoolId);
  }

  public async getFiscalYears(schoolId: string, options?: { status?: 'open' | 'closed' }): Promise<FiscalYear[]> {
    let list = FallbackStorage.getFiscalYears().filter(fy => fy.schoolId === schoolId);
    if (options?.status) {
      list = list.filter(fy => fy.status === options.status);
    }
    return list;
  }

  public async getPeriods(schoolId: string, fiscalYearId: string): Promise<AccountingPeriod[]> {
    return FallbackStorage.getAccountingPeriods().filter(ap => ap.fiscalYearId === fiscalYearId && ap.schoolId === schoolId);
  }
}

export class FinancialClosingStorageResolver {
  private static isProductionEnvironment(): boolean {
    const nodeEnv = typeof process !== 'undefined' && process.env?.NODE_ENV;
    const isNodeProd = nodeEnv === 'production';
    
    const isViteProd = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD === true;
    
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    return isNodeProd || isViteProd || (typeof window !== 'undefined' && !isLocalHost);
  }

  public static async resolveProvider(): Promise<IFinancialClosingStorageProvider> {
    const isProd = this.isProductionEnvironment();
    const isHealthy = await PersistenceHealthService.isDatabaseHealthy();

    if (isProd) {
      if (!isHealthy) {
        throw new Error('خطأ إنتاجي حرج: قاعدة البيانات الرسمية غير متصلة أو غير مستقرة حالياً. يمنع تشغيل عمليات الإقفال المالي خارج قاعدة البيانات الرسمية في بيئة الإنتاج.');
      }
      return new ProductionClosingDatabaseProvider();
    }

    if (isHealthy) {
      return new ProductionClosingDatabaseProvider();
    }
    return new FallbackClosingStorageProvider();
  }
}
