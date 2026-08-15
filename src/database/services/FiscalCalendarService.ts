import { FiscalYearRepository } from '../repositories/FiscalYearRepository';
import { AccountingPeriodRepository } from '../repositories/AccountingPeriodRepository';
import { FiscalYear, AccountingPeriod, AuditMetadata } from '../../types';
import { IoCContainer } from '../IoCContainer';

export class FiscalCalendarService {
  public static $inject = ['FiscalYearRepository', 'AccountingPeriodRepository'];

  constructor(
    private fiscalYearRepo: FiscalYearRepository,
    private periodRepo: AccountingPeriodRepository
  ) {}

  private static get fiscalYearRepoInstance(): FiscalYearRepository {
    return IoCContainer.getInstance().resolve<FiscalYearRepository>('FiscalYearRepository');
  }

  private static get periodRepoInstance(): AccountingPeriodRepository {
    return IoCContainer.getInstance().resolve<AccountingPeriodRepository>('AccountingPeriodRepository');
  }

  public static async validateAction(schoolId: string, date: string): Promise<void> {
    // Check if the date is within an open period/year
    const fiscalYears = await this.fiscalYearRepoInstance.getAll(schoolId);
    const targetDate = new Date(date);
    
    const activeYear = fiscalYears.find(fy => targetDate >= new Date(fy.startDate) && targetDate <= new Date(fy.endDate));
    
    if (!activeYear) {
      throw new Error('التاريخ المحدد خارج نطاق أي سنة مالية معتمدة');
    }
    
    if (activeYear.status === 'closed' || activeYear.status === 'archived') {
      throw new Error('لا يسمح بإجراء عمليات في سنة مالية مغلقة أو مؤرشفة');
    }
    
    const periods = await this.periodRepoInstance.getByFiscalYearId(schoolId, activeYear.id);
    const activePeriod = periods.find(p => targetDate >= new Date(p.startDate) && targetDate <= new Date(p.endDate));
    
    if (!activePeriod) {
      throw new Error('التاريخ المحدد خارج نطاق أي فترة محاسبية');
    }
    
    if (activePeriod.status !== 'open') {
      throw new Error(`لا يسمح بإجراء عمليات في فترة محاسبية ${activePeriod.status === 'closed' ? 'مغلقة' : 'مقفلة نهائياً'}`);
    }
  }

  // Add more methods for closing/opening/validation checks
}
