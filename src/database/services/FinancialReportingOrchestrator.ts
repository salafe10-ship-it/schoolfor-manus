import { FinancialReportingEngine, IncomeStatementReport, BalanceSheetReport, CashFlowReport } from './FinancialReportingEngine';
import { FinancialReportingValidator, ValidationResult } from './FinancialReportingValidator';
import { FinancialReportingPolicyService } from './FinancialReportingPolicyService';
import { FinancialSnapshotService, SnapshotComparisonResult } from './FinancialSnapshotService';
import { FinancialPeriodService } from './FinancialPeriodService';
import { FinancialCloseService } from './FinancialCloseService';
import { JournalRepository } from '../repositories/JournalRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { 
  JournalEntry, 
  GeneralLedger, 
  TrialBalanceItem, 
  TreasuryAccount, 
  TreasuryTransaction 
} from '../../types';

export class FinancialReportingOrchestrator {

  /**
   * Orchestrate full period reporting extraction and validate the structural rules
   */
  public static async orchestratePeriodReport(
    schoolId: string,
    periodId: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{
    trialBalance: { header: any; items: TrialBalanceItem[]; isBalanced: boolean };
    generalLedger: { header: any; lines: GeneralLedger[] };
    incomeStatement: IncomeStatementReport;
    balanceSheet: BalanceSheetReport;
    cashFlow: CashFlowReport;
    arAging: { header: any; buckets: any[] };
    deferredRevenue: { header: any; schedules: any[] };
    collections: { header: any; collections: any[]; stats: any };
    treasury: { header: any; accounts: TreasuryAccount[]; transactions: TreasuryTransaction[] };
    installments: { header: any; schedules: any[] };
    revenueRecognition: { header: any; recognitions: any[] };
    validation: ValidationResult;
  }> {

    // 1. Resolve period and year info
    const periods = await FinancialPeriodService.getPeriodsForSchool(schoolId);
    const period = periods.find(p => p.id === periodId);
    if (!period) {
      throw new Error(`الفترة المالية غير موجودة: ${periodId}`);
    }

    // 2. Mandatory Reporting Gate: Check access via FinancialCloseService
    const access = await FinancialCloseService.validateReportingAccess(schoolId, periodId);
    if (!access.allowed) {
        throw new Error(`تعذر استخراج التقرير: ${access.reason}`);
    }

    // 3. Fetch all period entries for validation
    const journalRepo = new JournalRepository();
    const allEntries = await journalRepo.getAll(schoolId);
    const entries = allEntries.filter(e => {
      const d = new Date(e.date);
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return d >= start && d <= end;
    });

    // 4. Pre-generation validation
    const validation = await FinancialReportingValidator.validateReportRequest(
      schoolId,
      requestSchoolId,
      period.status,
      entries
    );

    if (!validation.isValid) {
      throw new Error(`خطأ في التحقق من صحة القواعد المالية قبل توليد التقرير: ${validation.errors.join(' | ')}`);
    }

    // 5. Generate all core financial reports
    const trialBalance = await FinancialReportingEngine.generateTrialBalance(schoolId, period.periodName, generatedBy, requestSchoolId);
    const generalLedger = await FinancialReportingEngine.generateGeneralLedger(schoolId, period.periodName, generatedBy, requestSchoolId, {
      startDate: period.startDate,
      endDate: period.endDate
    });
    const incomeStatement = await FinancialReportingEngine.generateIncomeStatement(schoolId, period.periodName, generatedBy, requestSchoolId);
    const balanceSheet = await FinancialReportingEngine.generateBalanceSheet(schoolId, period.periodName, generatedBy, requestSchoolId);
    const cashFlow = await FinancialReportingEngine.generateCashFlow(schoolId, period.periodName, generatedBy, requestSchoolId);
    const arAging = await FinancialReportingEngine.generateARAging(schoolId, period.periodName, generatedBy, requestSchoolId);
    const deferredRevenue = await FinancialReportingEngine.generateDeferredRevenue(schoolId, period.periodName, generatedBy, requestSchoolId);
    const collections = await FinancialReportingEngine.generateCollectionsReport(schoolId, period.periodName, generatedBy, requestSchoolId);
    const treasury = await FinancialReportingEngine.generateTreasuryReport(schoolId, period.periodName, generatedBy, requestSchoolId);
    const installments = await FinancialReportingEngine.generateInstallmentsReport(schoolId, period.periodName, generatedBy, requestSchoolId);
    const revenueRecognition = await FinancialReportingEngine.generateRevenueRecognitionReport(schoolId, period.periodName, generatedBy, requestSchoolId);

    // 5. Post-generation consistency check (GL to Trial Balance integrity)
    const consistency = FinancialReportingValidator.validateLedgerConsistency(
      generalLedger.lines,
      trialBalance.items
    );

    if (!consistency.isValid) {
      throw new Error(`خطأ اتساق محاسبي: ${consistency.errors.join(' | ')}`);
    }

    // Log the audit event
    await AuditRepository.log(
      schoolId,
      'system_reporting',
      generatedBy,
      'Financial Controller',
      'GENERATE_REPORTS_ORCHESTRATED',
      'REPORTING_ORCHESTRATION',
      '127.0.0.1',
      `توليد مجموعة التقارير المالية المتكاملة للفترة: ${period.periodName}`,
      { affectedRecord: periodId }
    );

    return {
      trialBalance,
      generalLedger,
      incomeStatement,
      balanceSheet,
      cashFlow,
      arAging,
      deferredRevenue,
      collections,
      treasury,
      installments,
      revenueRecognition,
      validation
    };
  }

  /**
   * Capture and archive an immutable period snapshot
   */
  public static async captureReportingSnapshot(
    schoolId: string,
    periodId: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<any> {
    const periods = await FinancialPeriodService.getPeriodsForSchool(schoolId);
    const period = periods.find(p => p.id === periodId);
    if (!period) {
      throw new Error('الفترة المحددة غير موجودة لالتقاط اللقطة المحاسبية.');
    }

    // 1. Generate active reports
    const reportSet = await this.orchestratePeriodReport(schoolId, periodId, generatedBy, requestSchoolId);

    // 2. Create and archive snapshot
    const snapshot = await FinancialSnapshotService.createSnapshot(
      schoolId,
      periodId,
      period.periodName,
      generatedBy,
      {
        trialBalance: reportSet.trialBalance.items,
        generalLedger: reportSet.generalLedger.lines,
        incomeStatement: reportSet.incomeStatement,
        balanceSheet: reportSet.balanceSheet,
        cashFlow: reportSet.cashFlow,
        arAging: reportSet.arAging.buckets,
        deferredRevenue: reportSet.deferredRevenue.schedules,
        collections: reportSet.collections.collections,
        treasury: reportSet.treasury.accounts,
        installments: reportSet.installments.schedules,
        revenueRecognition: reportSet.revenueRecognition.recognitions
      }
    );

    return snapshot;
  }

  /**
   * Compare two frozen snapshots to find financial drift or differences
   */
  public static async comparePeriodSnapshots(
    schoolId: string,
    snapshotIdA: string,
    snapshotIdB: string,
    generatedBy: string
  ): Promise<SnapshotComparisonResult> {
    const result = await FinancialSnapshotService.compareSnapshots(schoolId, snapshotIdA, snapshotIdB);

    await AuditRepository.log(
      schoolId,
      'system_reporting',
      generatedBy,
      'Auditor',
      'COMPARE_SNAPSHOTS',
      'REPORTING_SNAPSHOTS',
      '127.0.0.1',
      `مقارنة ومطابقة اللقطات المالية المجمدة: ${snapshotIdA} و ${snapshotIdB}`,
      { affectedRecord: snapshotIdA, valuesAfter: { snapshotIdA, snapshotIdB, hasDiscrepancies: result.hasDiscrepancies } }
    );

    return result;
  }
}
