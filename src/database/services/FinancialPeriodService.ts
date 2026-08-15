import { FiscalYear, AccountingPeriod, AuditMetadata } from '../../types';
import { FiscalYearRepository } from '../repositories/FiscalYearRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';

export interface QuarterPeriod {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  startDate: string;
  endDate: string;
  periods: AccountingPeriod[];
}

export class FinancialPeriodService {
  private static fiscalRepo = new FiscalYearRepository();

  /**
   * Get all defined fiscal years
   */
  public static async getFiscalYears(schoolId: string, options?: { status?: 'open' | 'closed' }): Promise<FiscalYear[]> {
    return await this.fiscalRepo.getAll(schoolId, options);
  }

  /**
   * Create a new fiscal year (automatically generates 12 monthly periods)
   */
  public static async createFiscalYear(
    schoolId: string,
    yearName: string,
    startDate: string,
    endDate: string,
    operator: { userId: string; userName: string; userRole: string; ipAddress: string }
  ): Promise<FiscalYear> {
    const meta: AuditMetadata = {
      userId: operator.userId,
      userName: operator.userName,
      userRole: operator.userRole,
      ipAddress: operator.ipAddress
    };
    return await this.fiscalRepo.create(schoolId, {
      yearName,
      startDate,
      endDate,
      status: 'open',
      meta
    } as any);
  }

  /**
   * Get all sub-accounting periods for a fiscal year
   */
  public static async getAccountingPeriods(schoolId: string, fiscalYearId: string): Promise<AccountingPeriod[]> {
    return await this.fiscalRepo.getPeriods(schoolId, fiscalYearId);
  }

  /**
   * Get all periods for a school
   */
  public static async getPeriodsForSchool(schoolId: string): Promise<AccountingPeriod[]> {
    return FallbackStorage.getAccountingPeriods().filter(p => p.schoolId === schoolId);
  }

  /**
   * Resolve specific Monthly period
   */
  public static async getPeriodByName(schoolId: string, fiscalYearId: string, periodName: string): Promise<AccountingPeriod | null> {
    const periods = await this.getAccountingPeriods(schoolId, fiscalYearId);
    return periods.find(p => p.periodName === periodName) || null;
  }

  /**
   * Get Quarters for a Fiscal Year
   */
  public static async getQuarterPeriods(schoolId: string, fiscalYearId: string): Promise<QuarterPeriod[]> {
    const periods = await this.getAccountingPeriods(schoolId, fiscalYearId);
    
    // Sort chronologically
    const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
    
    const quarters: QuarterPeriod[] = [
      { quarter: 'Q1', startDate: sorted[0]?.startDate || '', endDate: sorted[2]?.endDate || '', periods: sorted.slice(0, 3) },
      { quarter: 'Q2', startDate: sorted[3]?.startDate || '', endDate: sorted[5]?.endDate || '', periods: sorted.slice(3, 6) },
      { quarter: 'Q3', startDate: sorted[6]?.startDate || '', endDate: sorted[8]?.endDate || '', periods: sorted.slice(6, 9) },
      { quarter: 'Q4', startDate: sorted[9]?.startDate || '', endDate: sorted[11]?.endDate || '', periods: sorted.slice(9, 12) }
    ];

    return quarters;
  }

  /**
   * Opening Period Generator (Period 00 for carrying forward opening balances)
   */
  public static getOpeningPeriod(fiscalYear: FiscalYear): AccountingPeriod {
    return {
      id: `ap_${fiscalYear.id}_opening`,
      fiscalYearId: fiscalYear.id,
      periodName: `${fiscalYear.yearName}-00`,
      periodNumber: 0,
      startDate: fiscalYear.startDate,
      endDate: fiscalYear.startDate,
      status: 'closed', // Opening period is closed after initial balance setup
      schoolId: fiscalYear.schoolId
    };
  }

  /**
   * Adjustment Period Generator (Period 13 for year-end CPA audit corrections)
   */
  public static getAdjustmentPeriod(fiscalYear: FiscalYear): AccountingPeriod {
    return {
      id: `ap_${fiscalYear.id}_adjustment`,
      fiscalYearId: fiscalYear.id,
      periodName: `${fiscalYear.yearName}-13`,
      periodNumber: 13,
      startDate: fiscalYear.endDate,
      endDate: fiscalYear.endDate,
      status: 'open',
      schoolId: fiscalYear.schoolId
    };
  }

  /**
   * Closing Period Generator (Period 14 for final year-end close entries)
   */
  public static getClosingPeriod(fiscalYear: FiscalYear): AccountingPeriod {
    return {
      id: `ap_${fiscalYear.id}_closing`,
      fiscalYearId: fiscalYear.id,
      periodName: `${fiscalYear.yearName}-14`,
      periodNumber: 14,
      startDate: fiscalYear.endDate,
      endDate: fiscalYear.endDate,
      status: 'open',
      schoolId: fiscalYear.schoolId
    };
  }

  /**
   * Get active Academic Calendar periods
   */
  public static async getAcademicPeriods(schoolId: string): Promise<any[]> {
    return FallbackStorage.getAcademicPeriods().filter(ap => ap.calendarId && ap.startDate);
  }
}
