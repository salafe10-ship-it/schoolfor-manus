import { getSupabaseClient } from '../client';
import { AccountingPeriod, AuditMetadata } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { AuditRepository } from './AuditRepository';
import { v4 as uuidv4 } from 'uuid';

export class AccountingPeriodRepository {
  public async getByFiscalYearId(schoolId: string, fiscalYearId: string): Promise<AccountingPeriod[]> {
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
            .order('period_number', { ascending: true });
          if (!error && data) {
            return data.map(d => this.mapFromDatabase(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error("Failed to fetch accounting periods from Supabase:", "AccountingPeriodRepository", { error: err });
      }
    }
    FallbackStorage.assertCanonicalPersistence(`accounting periods read for ${schoolId}`);
    return FallbackStorage.getAccountingPeriods().filter(ap => ap.fiscalYearId === fiscalYearId && ap.schoolId === schoolId);
  }

  public async updateStatus(
    schoolId: string,
    periodId: string,
    status: 'open' | 'closed' | 'locked',
    meta?: AuditMetadata
  ): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      FallbackStorage.assertCanonicalPersistence(`accounting period status update ${periodId}`);
      throw new Error('مصدر الفترات المالية المركزي غير متاح.');
    }

    const { data, error } = await supabase
      .from('accounting_periods')
      .update({ status })
      .eq('id', periodId)
      .eq('school_id', schoolId)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(`فشل تحديث حالة الفترة المالية: ${error.message}`);
    if (!data) throw new Error(`الفترة المالية غير موجودة: ${periodId}`);

    await AuditRepository.log(
      schoolId,
      meta?.userId || 'system_financial',
      meta?.userName || 'Financial Engine',
      meta?.userRole || 'Accountant',
      'UPDATE_PERIOD_STATUS',
      'ACCOUNTING_PERIODS',
      meta?.ipAddress || '127.0.0.1',
      `تحديث حالة الفترة المالية ${periodId} إلى ${status}`,
      { affectedRecord: periodId }
    );
    return true;
  }

  private mapFromDatabase(data: any): AccountingPeriod {
    return {
      id: data.id,
      fiscalYearId: data.fiscal_year_id || data.fiscalYearId,
      periodName: data.period_name || data.periodName,
      periodNumber: data.period_number || data.periodNumber,
      startDate: data.start_date || data.startDate,
      endDate: data.end_date || data.endDate,
      status: data.status,
      schoolId: data.school_id || data.schoolId
    };
  }
}
