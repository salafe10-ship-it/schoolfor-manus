import { getSupabaseClient } from '../client';
import { AccountingPeriod, AuditMetadata } from '../../types';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
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
    return FallbackStorage.getAccountingPeriods().filter(ap => ap.fiscalYearId === fiscalYearId && ap.schoolId === schoolId);
  }

  public async updateStatus(
    schoolId: string,
    periodId: string,
    status: 'open' | 'closed' | 'locked',
    meta?: AuditMetadata
  ): Promise<boolean> {
    // Logic to update status with audit trail
    // ... (This should call AuditRepository as well)
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
