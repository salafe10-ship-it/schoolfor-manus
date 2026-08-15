import { ClosingAuditLog } from './FinancialClosingTypes';
import { FinancialClosingStorageResolver } from '../services/FinancialClosingStorageStrategy';
import { JournalEntry, AccountingPeriod, FiscalYear } from '../../types';

export interface QuarterPeriod {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  startDate: string;
  endDate: string;
  periods: AccountingPeriod[];
}

export class FinancialClosingRepository {
  /**
   * Save a financial closing audit log
   */
  public static async saveClosingLog(schoolId: string, log: ClosingAuditLog): Promise<void> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    await provider.saveClosingLog(schoolId, log);
  }

  /**
   * Retrieve all financial closing audit logs
   */
  public static async getClosingLogs(schoolId: string): Promise<ClosingAuditLog[]> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    return await provider.getClosingLogs(schoolId);
  }

  /**
   * Update the status of an accounting period (open/closed)
   */
  public static async updatePeriodStatus(
    schoolId: string,
    periodId: string,
    status: 'open' | 'closed' | 'locked',
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<boolean> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    return await provider.updatePeriodStatus(schoolId, periodId, status, operator);
  }

  /**
   * Retrieve all journal entries for a school
   */
  public static async getJournalEntries(schoolId: string): Promise<JournalEntry[]> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    return await provider.getJournalEntries(schoolId);
  }

  /**
   * Retrieve all general ledger lines for a school
   */
  public static async getGeneralLedgerLines(schoolId: string): Promise<any[]> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    return await provider.getGeneralLedgerLines(schoolId);
  }

  /**
   * Retrieve all periods for a school
   */
  public static async getPeriodsForSchool(schoolId: string): Promise<AccountingPeriod[]> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    return await provider.getPeriodsForSchool(schoolId);
  }

  /**
   * Retrieve specific Accounting Period by ID
   */
  public static async getPeriodById(schoolId: string, periodId: string): Promise<AccountingPeriod | null> {
    const periods = await this.getPeriodsForSchool(schoolId);
    return periods.find(p => p.id === periodId) || null;
  }

  /**
   * Retrieve all fiscal years for a school
   */
  public static async getFiscalYears(schoolId: string, options?: { status?: 'open' | 'closed' }): Promise<FiscalYear[]> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    return await provider.getFiscalYears(schoolId, options);
  }

  /**
   * Retrieve specific Fiscal Year by ID
   */
  public static async getFiscalYearById(schoolId: string, yearId: string): Promise<FiscalYear | null> {
    const years = await this.getFiscalYears(schoolId);
    return years.find(y => y.id === yearId) || null;
  }

  /**
   * Retrieve quarter periods for a school
   */
  public static async getQuarterPeriods(schoolId: string, fiscalYearId: string): Promise<QuarterPeriod[]> {
    const provider = await FinancialClosingStorageResolver.resolveProvider();
    const periods = await provider.getPeriods(schoolId, fiscalYearId);
    
    // Sort chronologically
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (sorted.length === 0) {
      return [];
    }
    
    const quarters: QuarterPeriod[] = [
      { quarter: 'Q1', startDate: sorted[0]?.startDate || '', endDate: sorted[2]?.endDate || '', periods: sorted.slice(0, 3) },
      { quarter: 'Q2', startDate: sorted[3]?.startDate || '', endDate: sorted[5]?.endDate || '', periods: sorted.slice(3, 6) },
      { quarter: 'Q3', startDate: sorted[6]?.startDate || '', endDate: sorted[8]?.endDate || '', periods: sorted.slice(6, 9) },
      { quarter: 'Q4', startDate: sorted[9]?.startDate || '', endDate: sorted[11]?.endDate || '', periods: sorted.slice(9, 12) }
    ];

    return quarters;
  }
}
