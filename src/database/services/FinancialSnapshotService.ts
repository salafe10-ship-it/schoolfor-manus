import { FinancialReportSnapshot, FinancialReportingRepository } from '../repositories/FinancialReportingRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { FallbackStorage } from '../repositories/FallbackStorage';

export interface SnapshotComparisonResult {
  snapshotIdA: string;
  snapshotIdB: string;
  trialBalanceDiff: { accountId: string; accountName: string; diffDebit: number; diffCredit: number }[];
  incomeStatementDiff: { fieldName: string; diffAmount: number }[];
  balanceSheetDiff: { fieldName: string; diffAmount: number }[];
  hasDiscrepancies: boolean;
}

export class FinancialSnapshotService {

  /**
   * Create a new immutable snapshot of a period
   */
  public static async createSnapshot(
    schoolId: string,
    periodId: string,
    periodName: string,
    generatedBy: string,
    reportsData: {
      trialBalance: any[];
      generalLedger: any[];
      incomeStatement: any;
      balanceSheet: any;
      cashFlow: any;
      arAging: any[];
      deferredRevenue: any[];
      collections: any[];
      treasury: any[];
      installments: any[];
      revenueRecognition: any[];
    },
    filters: any = {}
  ): Promise<FinancialReportSnapshot> {
    
    // Check existing snapshots of this period to increment version
    const all = await FinancialReportingRepository.getAllSnapshots(schoolId);
    const periodSnapshots = all.filter(s => s.periodId === periodId);
    const nextVersion = periodSnapshots.length + 1;

    const snapshotId = `snap_${periodId}_v${nextVersion}_${Date.now()}`;

    const snapshot: FinancialReportSnapshot = {
      id: snapshotId,
      schoolId,
      periodId,
      periodName,
      version: nextVersion,
      timestamp: new Date().toISOString(),
      generatedBy,
      trialBalance: reportsData.trialBalance,
      generalLedger: reportsData.generalLedger,
      incomeStatement: reportsData.incomeStatement,
      balanceSheet: reportsData.balanceSheet,
      cashFlow: reportsData.cashFlow,
      accountsReceivableAging: reportsData.arAging,
      deferredRevenueReport: reportsData.deferredRevenue,
      collectionsReport: reportsData.collections,
      treasuryReport: reportsData.treasury,
      installmentsReport: reportsData.installments,
      revenueRecognitionReport: reportsData.revenueRecognition,
      filtersApplied: filters
    };

    // Save snapshot
    await FinancialReportingRepository.saveSnapshot(schoolId, snapshot);

    await AuditRepository.log(
      schoolId,
      'system_reporting',
      generatedBy,
      'Financial Analyst',
      'CREATE_SNAPSHOT',
      'REPORTING_SNAPSHOTS',
      '127.0.0.1',
      `تم التقاط لقطة بيانات مالية غير قابلة للتعديل للفترة ${periodName} (الإصدار ${nextVersion})`,
      { affectedRecord: snapshotId, valuesAfter: { version: nextVersion } }
    );

    return snapshot;
  }

  /**
   * Retrieve a specific snapshot
   */
  public static async getSnapshot(schoolId: string, snapshotId: string): Promise<FinancialReportSnapshot | null> {
    return await FinancialReportingRepository.getSnapshotById(schoolId, snapshotId);
  }

  /**
   * List all snapshots for auditing purposes
   */
  public static async listSnapshots(schoolId: string): Promise<FinancialReportSnapshot[]> {
    return await FinancialReportingRepository.getAllSnapshots(schoolId);
  }

  /**
   * Compare two snapshots to inspect differences (for audits)
   */
  public static async compareSnapshots(
    schoolId: string,
    snapshotIdA: string,
    snapshotIdB: string
  ): Promise<SnapshotComparisonResult> {
    const snapA = await this.getSnapshot(schoolId, snapshotIdA);
    const snapB = await this.getSnapshot(schoolId, snapshotIdB);

    if (!snapA || !snapB) {
      throw new Error('تعذر إيجاد إحدى اللقطات المالية المحددة للمقارنة.');
    }

    const trialBalanceDiff: { accountId: string; accountName: string; diffDebit: number; diffCredit: number }[] = [];

    // Compare Trial Balances
    const accIds = new Set([
      ...snapA.trialBalance.map(t => t.accountId),
      ...snapB.trialBalance.map(t => t.accountId)
    ]);

    for (const accId of accIds) {
      const itemA = snapA.trialBalance.find(t => t.accountId === accId);
      const itemB = snapB.trialBalance.find(t => t.accountId === accId);

      const debA = itemA?.periodDebit || 0;
      const credA = itemA?.periodCredit || 0;
      const debB = itemB?.periodDebit || 0;
      const credB = itemB?.periodCredit || 0;

      const diffDebit = debB - debA;
      const diffCredit = credB - credA;

      if (Math.abs(diffDebit) > 0.001 || Math.abs(diffCredit) > 0.001) {
        trialBalanceDiff.push({
          accountId: accId,
          accountName: itemA?.accountName || itemB?.accountName || 'حساب غير معروف',
          diffDebit: Number(diffDebit.toFixed(3)),
          diffCredit: Number(diffCredit.toFixed(3))
        });
      }
    }

    // Compare simple fields in Income Statement
    const incomeStatementDiff: { fieldName: string; diffAmount: number }[] = [];
    const fields = ['netRevenue', 'totalExpenses', 'netIncome', 'totalTuitionRevenue'];
    for (const f of fields) {
      const valA = snapA.incomeStatement?.[f] || 0;
      const valB = snapB.incomeStatement?.[f] || 0;
      const diff = valB - valA;
      if (Math.abs(diff) > 0.001) {
        incomeStatementDiff.push({ fieldName: f, diffAmount: Number(diff.toFixed(3)) });
      }
    }

    // Compare simple fields in Balance Sheet
    const balanceSheetDiff: { fieldName: string; diffAmount: number }[] = [];
    const bsFields = ['totalAssets', 'totalLiabilities', 'totalEquity'];
    for (const f of bsFields) {
      const valA = snapA.balanceSheet?.[f] || 0;
      const valB = snapB.balanceSheet?.[f] || 0;
      const diff = valB - valA;
      if (Math.abs(diff) > 0.001) {
        balanceSheetDiff.push({ fieldName: f, diffAmount: Number(diff.toFixed(3)) });
      }
    }

    const hasDiscrepancies = trialBalanceDiff.length > 0 || incomeStatementDiff.length > 0 || balanceSheetDiff.length > 0;

    return {
      snapshotIdA,
      snapshotIdB,
      trialBalanceDiff,
      incomeStatementDiff,
      balanceSheetDiff,
      hasDiscrepancies
    };
  }
}
