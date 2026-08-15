import { getSupabaseClient } from '../client';
import { EnterpriseLogger } from '../services/EnterpriseLogger';
import { FallbackStorage } from './FallbackStorage';
import { AuditMetadata } from '../../types';

export interface FinancialReportSnapshot {
  id: string;
  schoolId: string;
  periodId: string;
  periodName: string;
  version: number;
  timestamp: string;
  generatedBy: string;
  trialBalance: any[];
  generalLedger: any[];
  incomeStatement: any;
  balanceSheet: any;
  cashFlow: any;
  accountsReceivableAging: any[];
  deferredRevenueReport: any[];
  collectionsReport: any[];
  treasuryReport: any[];
  installmentsReport: any[];
  revenueRecognitionReport: any[];
  filtersApplied: any;
}

export class FinancialReportingRepository {

  /**
   * Save a financial snapshot to database or fallback local storage
   */
  public static async saveSnapshot(schoolId: string, snapshot: FinancialReportSnapshot): Promise<void> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          // Attempt to store in database if table exists, otherwise log warning and save to local
          const { error } = await supabase
            .from('financial_snapshots')
            .upsert({
              id: snapshot.id,
              school_id: schoolId,
              period_id: snapshot.periodId,
              period_name: snapshot.periodName,
              version: snapshot.version,
              timestamp: snapshot.timestamp,
              generated_by: snapshot.generatedBy,
              trial_balance: snapshot.trialBalance,
              general_ledger: snapshot.generalLedger,
              income_statement: snapshot.incomeStatement,
              balance_sheet: snapshot.balanceSheet,
              cash_flow: snapshot.cashFlow,
              ar_aging: snapshot.accountsReceivableAging,
              deferred_revenue: snapshot.deferredRevenueReport,
              collections: snapshot.collectionsReport,
              treasury: snapshot.treasuryReport,
              installments: snapshot.installmentsReport,
              revenue_recognition: snapshot.revenueRecognitionReport,
              filters: snapshot.filtersApplied
            });
          
          if (!error) return;
          EnterpriseLogger.warn('Could not save snapshot to Supabase (table may not exist), saving to local storage instead.', "FinancialReportingRepository");
        }
      } catch (err: any) {
        EnterpriseLogger.error('Error saving snapshot to Supabase:', "FinancialReportingRepository", { error: err });
      }
    }

    // Fallback Local Storage
    const key = `school_snapshots_${schoolId}`;
    const snapshots = this.getLocalSnapshots(schoolId);
    
    // Remove if already exists with same ID
    const filtered = snapshots.filter(s => s.id !== snapshot.id);
    filtered.push(snapshot);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(filtered));
    } else {
      // In Server environment, we can save via FallbackStorage safe write
      FallbackStorage.safeWriteFile(`snapshots_${schoolId}.json`, filtered);
    }
  }

  /**
   * Retrieve a specific snapshot by ID
   */
  public static async getSnapshotById(schoolId: string, snapshotId: string): Promise<FinancialReportSnapshot | null> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('financial_snapshots')
            .select('*')
            .eq('id', snapshotId)
            .eq('school_id', schoolId)
            .maybeSingle();

          if (!error && data) {
            return this.mapSnapshotFromDB(data);
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error('Error reading snapshot from Supabase:', "FinancialReportingRepository", { error: err });
      }
    }

    const list = this.getLocalSnapshots(schoolId);
    return list.find(s => s.id === snapshotId) || null;
  }

  /**
   * Retrieve all snapshots for a school
   */
  public static async getAllSnapshots(schoolId: string): Promise<FinancialReportSnapshot[]> {
    const isHealthy = await FallbackStorage.isHealthy();
    if (isHealthy) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('financial_snapshots')
            .select('*')
            .eq('school_id', schoolId)
            .order('timestamp', { ascending: false });

          if (!error && data) {
            return data.map(d => this.mapSnapshotFromDB(d));
          }
        }
      } catch (err: any) {
        EnterpriseLogger.error('Error reading all snapshots from Supabase:', "FinancialReportingRepository", { error: err });
      }
    }

    return this.getLocalSnapshots(schoolId);
  }

  /**
   * Helper to retrieve from offline storage
   */
  private static getLocalSnapshots(schoolId: string): FinancialReportSnapshot[] {
    if (typeof window !== 'undefined') {
      const key = `school_snapshots_${schoolId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } else {
      return FallbackStorage.safeReadFile<FinancialReportSnapshot[]>(`snapshots_${schoolId}.json`, []);
    }
  }

  /**
   * Map database record to model
   */
  private static mapSnapshotFromDB(data: any): FinancialReportSnapshot {
    return {
      id: data.id,
      schoolId: data.school_id,
      periodId: data.period_id,
      periodName: data.period_name,
      version: Number(data.version),
      timestamp: data.timestamp,
      generatedBy: data.generated_by,
      trialBalance: typeof data.trial_balance === 'string' ? JSON.parse(data.trial_balance) : data.trial_balance,
      generalLedger: typeof data.general_ledger === 'string' ? JSON.parse(data.general_ledger) : data.general_ledger,
      incomeStatement: typeof data.income_statement === 'string' ? JSON.parse(data.income_statement) : data.income_statement,
      balanceSheet: typeof data.balance_sheet === 'string' ? JSON.parse(data.balance_sheet) : data.balance_sheet,
      cashFlow: typeof data.cash_flow === 'string' ? JSON.parse(data.cash_flow) : data.cash_flow,
      accountsReceivableAging: typeof data.ar_aging === 'string' ? JSON.parse(data.ar_aging) : data.ar_aging,
      deferredRevenueReport: typeof data.deferred_revenue === 'string' ? JSON.parse(data.deferred_revenue) : data.deferred_revenue,
      collectionsReport: typeof data.collections === 'string' ? JSON.parse(data.collections) : data.collections,
      treasuryReport: typeof data.treasury === 'string' ? JSON.parse(data.treasury) : data.treasury,
      installmentsReport: typeof data.installments === 'string' ? JSON.parse(data.installments) : data.installments,
      revenueRecognitionReport: typeof data.revenue_recognition === 'string' ? JSON.parse(data.revenue_recognition) : data.revenue_recognition,
      filtersApplied: typeof data.filters === 'string' ? JSON.parse(data.filters) : data.filters
    };
  }
}
