import { FallbackStorage } from '../repositories/FallbackStorage';
import { PostingEngine } from './PostingEngine';
import { AgingEngine } from './AgingEngine';
import { AcademicRevenueRecognitionEngine } from './AcademicRevenueRecognitionEngine';
import { FinancialReportingDomainRules } from './FinancialReportingDomainRules';
import { FinancialReportingValidator } from './FinancialReportingValidator';
import { FinancialReportingPolicyService } from './FinancialReportingPolicyService';
import { 
  JournalEntry, 
  GeneralLedger, 
  TrialBalanceItem, 
  Account, 
  Invoice, 
  TreasuryAccount, 
  TreasuryTransaction, 
  InstallmentSchedule 
} from '../../types';

export interface FinancialReportHeader {
  reportId: string;
  reportName: string;
  generationTimestamp: string;
  generatedBy: string;
  schoolId: string;
  periodName: string;
  snapshotVersion: number;
  filtersApplied: any;
  disclaimer: string;
  postingVersion: string;
  configurationVersion: string;
  auditReference: string;
}

export interface IncomeStatementReport {
  header: FinancialReportHeader;
  revenueLines: { accountCode: string; accountName: string; amount: number }[];
  totalRevenue: number;
  expenseLines: { accountCode: string; accountName: string; amount: number }[];
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheetReport {
  header: FinancialReportHeader;
  assetLines: { accountCode: string; accountName: string; amount: number }[];
  totalAssets: number;
  liabilityLines: { accountCode: string; accountName: string; amount: number }[];
  totalLiabilities: number;
  equityLines: { accountCode: string; accountName: string; amount: number }[];
  totalEquity: number;
  isBalanced: boolean;
  discrepancy: number;
}

export interface CashFlowReport {
  header: FinancialReportHeader;
  operatingInflows: { description: string; amount: number }[];
  operatingOutflows: { description: string; amount: number }[];
  netOperatingCash: number;
  investingActivities: { description: string; amount: number }[];
  netInvestingCash: number;
  financingActivities: { description: string; amount: number }[];
  netFinancingCash: number;
  netChangeInCash: number;
  openingCashBalance: number;
  closingCashBalance: number;
}

export class FinancialReportingEngine {

  private static constructHeader(
    reportId: string,
    reportName: string,
    schoolId: string,
    periodName: string,
    generatedBy: string,
    filters: any = {},
    postingVersion: string = '1.0.0',
    configurationVersion: string = '1.0.0',
    auditReference: string = 'AUDIT_REF_' + Date.now()
  ): FinancialReportHeader {
    return {
      reportId,
      reportName,
      generationTimestamp: new Date().toISOString(),
      generatedBy,
      schoolId,
      periodName,
      snapshotVersion: 0, // 0 indicates live, custom versions indicate frozen snapshots
      filtersApplied: filters,
      disclaimer: 'سرّي ومخصّص للاستخدام الإداري والتدقيق المالي الداخلي فقط - يتوافق مع معايير التقارير المالية الدولية (IFRS)',
      postingVersion,
      configurationVersion,
      auditReference
    };
  }

  /**
   * REPORT 1: Trial Balance (ميزان المراجعة)
   */
  public static async generateTrialBalance(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{ header: FinancialReportHeader; items: TrialBalanceItem[]; isBalanced: boolean }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const items = await PostingEngine.getTrialBalance(schoolId);

    // Apply strict verification: sum of debits === sum of credits
    const totalDebit = items.reduce((sum, item) => sum + item.periodDebit, 0);
    const totalCredit = items.reduce((sum, item) => sum + item.periodCredit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const header = this.constructHeader('REP_TB_' + Date.now(), 'ميزان المراجعة المجمع', schoolId, periodName, generatedBy);

    return { header, items, isBalanced };
  }

  /**
   * REPORT 2: General Ledger (دفتر الأستاذ العام)
   */
  public static async generateGeneralLedger(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string,
    filters: { accountId?: string; startDate?: string; endDate?: string } = {}
  ): Promise<{ header: FinancialReportHeader; lines: GeneralLedger[] }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    let lines = FallbackStorage.getGeneralLedgerLines().filter(gl => gl.schoolId === schoolId);

    if (filters.accountId) {
      lines = lines.filter(l => l.accountId === filters.accountId);
    }
    if (filters.startDate) {
      lines = lines.filter(l => l.date >= filters.startDate!);
    }
    if (filters.endDate) {
      lines = lines.filter(l => l.date <= filters.endDate!);
    }

    // Sort chronologically
    lines.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

    const header = this.constructHeader('REP_GL_' + Date.now(), 'كشف الأستاذ العام التفصيلي', schoolId, periodName, generatedBy, filters);

    return { header, lines };
  }

  /**
   * REPORT 3: Sub Ledger (دفتر الأستاذ المساعد للذمم والطلاب)
   */
  public static async generateSubLedger(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string,
    filters: { studentId?: string } = {}
  ): Promise<{ header: FinancialReportHeader; accounts: any[] }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    let accounts = FallbackStorage.getReceivableAccounts().filter(acc => (acc as any).schoolId === schoolId);
    const txs = FallbackStorage.getReceivableTransactions().filter(tx => (tx as any).schoolId === schoolId);

    if (filters.studentId) {
      accounts = accounts.filter(a => a.studentId === filters.studentId);
    }

    const subLedgerDetails = accounts.map(acc => {
      const accTxs = txs.filter(t => t.receivableAccountId === acc.id);
      return {
        ...acc,
        transactions: accTxs
      };
    });

    const header = this.constructHeader('REP_SL_' + Date.now(), 'دفتر الأستاذ المساعد لذمم الطلاب', schoolId, periodName, generatedBy, filters);

    return { header, accounts: subLedgerDetails };
  }

  /**
   * REPORT 4: Income Statement (قائمة الدخل - الأرباح والخسائر)
   */
  public static async generateIncomeStatement(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<IncomeStatementReport> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const accounts = FallbackStorage.getAccounts().filter(acc => (acc as any).schoolId === schoolId);

    const revenueLines = accounts
      .filter(acc => acc.nature === 'revenue' && acc.isLeaf)
      .map(acc => ({
        accountCode: acc.code,
        accountName: acc.name,
        amount: Math.abs(acc.balance)
      }));

    const expenseLines = accounts
      .filter(acc => acc.nature === 'expense' && acc.isLeaf)
      .map(acc => ({
        accountCode: acc.code,
        accountName: acc.name,
        amount: Math.abs(acc.balance)
      }));

    const totalRevenue = revenueLines.reduce((sum, line) => sum + line.amount, 0);
    const totalExpenses = expenseLines.reduce((sum, line) => sum + line.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    const header = this.constructHeader('REP_IS_' + Date.now(), 'قائمة الدخل والأرباح والخسائر', schoolId, periodName, generatedBy);

    return {
      header,
      revenueLines,
      totalRevenue,
      expenseLines,
      totalExpenses,
      netIncome
    };
  }

  /**
   * REPORT 5: Balance Sheet (الميزانية العمومية)
   */
  public static async generateBalanceSheet(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<BalanceSheetReport> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const accounts = FallbackStorage.getAccounts().filter(acc => (acc as any).schoolId === schoolId);

    const assetLines = accounts
      .filter(acc => acc.nature === 'asset' && acc.isLeaf)
      .map(acc => ({
        accountCode: acc.code,
        accountName: acc.name,
        amount: acc.balance
      }));

    const liabilityLines = accounts
      .filter(acc => acc.nature === 'liability' && acc.isLeaf)
      .map(acc => ({
        accountCode: acc.code,
        accountName: acc.name,
        amount: acc.balance
      }));

    // Calculate current net income to add to Equity (Retained Earnings)
    const revenueAccounts = accounts.filter(acc => acc.nature === 'revenue' && acc.isLeaf);
    const expenseAccounts = accounts.filter(acc => acc.nature === 'expense' && acc.isLeaf);
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const currentPeriodNetIncome = totalRevenue - totalExpenses;

    const equityLines = accounts
      .filter(acc => acc.nature === 'equity' && acc.isLeaf)
      .map(acc => ({
        accountCode: acc.code,
        accountName: acc.name,
        amount: acc.balance
      }));

    // Append Net Income for current period to Equity representation
    equityLines.push({
      accountCode: '3999',
      accountName: 'صافي أرباح الفترة الحالية (أرباح وخسائر)',
      amount: currentPeriodNetIncome
    });

    const totalAssets = assetLines.reduce((sum, line) => sum + line.amount, 0);
    const totalLiabilities = liabilityLines.reduce((sum, line) => sum + line.amount, 0);
    const totalEquity = equityLines.reduce((sum, line) => sum + line.amount, 0);

    const discrepancy = Math.abs(totalAssets - (totalLiabilities + totalEquity));
    const isBalanced = discrepancy < 0.05;

    const header = this.constructHeader('REP_BS_' + Date.now(), 'قائمة المركز المالي (الميزانية العمومية)', schoolId, periodName, generatedBy);

    return {
      header,
      assetLines,
      totalAssets,
      liabilityLines,
      totalLiabilities,
      equityLines,
      totalEquity,
      isBalanced,
      discrepancy
    };
  }

  /**
   * REPORT 6: Cash Flow Statement (قائمة التدفقات النقدية)
   */
  public static async generateCashFlow(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<CashFlowReport> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const vouchers = FallbackStorage.getVouchers().filter(v => (v as any).schoolId === schoolId);

    const operatingInflows: { description: string; amount: number }[] = [];
    const operatingOutflows: { description: string; amount: number }[] = [];

    let totalInflows = 0;
    let totalOutflows = 0;

    for (const v of vouchers) {
      if (v.type === 'receipt') {
        operatingInflows.push({ description: `متحصلات المقبوضات - سند رقم ${v.id} (${v.description || ''})`, amount: v.amount });
        totalInflows += v.amount;
      } else if (v.type === 'payment') {
        operatingOutflows.push({ description: `مدفوعات الصرف - سند رقم ${v.id} (${v.description || ''})`, amount: v.amount });
        totalOutflows += v.amount;
      }
    }

    const netOperatingCash = totalInflows - totalOutflows;
    const netChangeInCash = netOperatingCash;

    // Get current cash/bank account balance sum
    const accounts = FallbackStorage.getAccounts().filter(acc => (acc as any).schoolId === schoolId);
    const cashAndBankAccs = accounts.filter(acc => acc.isLeaf && (acc.code.startsWith('11') || acc.name.includes('نقد') || acc.name.includes('بنك')));
    const closingCashBalance = cashAndBankAccs.reduce((sum, acc) => sum + acc.balance, 0);
    const openingCashBalance = closingCashBalance - netChangeInCash;

    const header = this.constructHeader('REP_CF_' + Date.now(), 'قائمة التدفقات النقدية المحاسبية', schoolId, periodName, generatedBy);

    return {
      header,
      operatingInflows,
      operatingOutflows,
      netOperatingCash,
      investingActivities: [],
      netInvestingCash: 0,
      financingActivities: [],
      netFinancingCash: 0,
      netChangeInCash,
      openingCashBalance,
      closingCashBalance
    };
  }

  /**
   * REPORT 7: Accounts Receivable Aging (تقرير أعمار الذمم)
   */
  public static async generateARAging(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{ header: FinancialReportHeader; buckets: any[] }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const buckets = await AgingEngine.calculateCompanyWideAging(schoolId);
    const header = this.constructHeader('REP_AGE_' + Date.now(), 'تقرير أعمار الذمم التفصيلي للطلاب', schoolId, periodName, generatedBy);

    return { header, buckets };
  }

  /**
   * REPORT 8: Deferred Revenue Report (تقرير الإيرادات المؤجلة)
   */
  public static async generateDeferredRevenue(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{ header: FinancialReportHeader; schedules: any[] }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const schedules = FallbackStorage.getRecognitionSchedules().filter(
      s => (s as any).schoolId === schoolId && s.recognitionStatus !== 'Recognized'
    );

    const header = this.constructHeader('REP_DEF_' + Date.now(), 'تقرير الإيرادات المؤجلة وغير المكتسبة', schoolId, periodName, generatedBy);

    return { header, schedules };
  }

  /**
   * REPORT 9: Collections Report (تقرير التحصيلات والمقبوضات)
   */
  public static async generateCollectionsReport(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{ header: FinancialReportHeader; collections: any[]; stats: any }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const transactions = FallbackStorage.getReceivableTransactions().filter(
      t => (t as any).schoolId === schoolId && (t.type === 'credit' || t.type === 'settlement')
    );

    const stats = {
      totalCollected: transactions.reduce((sum, t) => sum + (t.credit || 0), 0),
      count: transactions.length,
      byPaymentMethod: {
        Cash: transactions.filter(t => (t as any).paymentMethod === 'Cash' || (t as any).paymentMethod === 'نقدي').reduce((sum, t) => sum + (t.credit || 0), 0),
        Bank: transactions.filter(t => (t as any).paymentMethod === 'Bank' || (t as any).paymentMethod === 'حوالة بنكية').reduce((sum, t) => sum + (t.credit || 0), 0),
        Card: transactions.filter(t => (t as any).paymentMethod === 'Card' || (t as any).paymentMethod === 'بطاقة مدى').reduce((sum, t) => sum + (t.credit || 0), 0),
        Check: transactions.filter(t => (t as any).paymentMethod === 'Check' || (t as any).paymentMethod === 'شيك').reduce((sum, t) => sum + (t.credit || 0), 0)
      }
    };

    const header = this.constructHeader('REP_COL_' + Date.now(), 'تقرير المقبوضات والتحصيلات التفصيلي', schoolId, periodName, generatedBy);

    return { header, collections: transactions, stats };
  }

  /**
   * REPORT 10: Treasury Report (تقرير الخزينة والسيولة والمنقولات)
   */
  public static async generateTreasuryReport(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{ header: FinancialReportHeader; accounts: TreasuryAccount[]; transactions: TreasuryTransaction[] }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const accounts = FallbackStorage.getTreasuryAccounts().filter(acc => acc.schoolId === schoolId);
    const transactions = FallbackStorage.getTreasuryTransactions().filter(tx => tx.schoolId === schoolId);

    const header = this.constructHeader('REP_TR_' + Date.now(), 'تقرير حسابات الخزينة والمنقولات والسيولة الكلية', schoolId, periodName, generatedBy);

    return { header, accounts, transactions };
  }

  /**
   * REPORT 11: Installments Report (تقرير جدولة الأقساط والالتزامات)
   */
  public static async generateInstallmentsReport(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{ header: FinancialReportHeader; schedules: any[] }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const schedules = FallbackStorage.getInstallmentSchedules().filter(s => (s as any).schoolId === schoolId);
    const header = this.constructHeader('REP_INS_' + Date.now(), 'تقرير جدولة الأقساط والالتزامات السدادية', schoolId, periodName, generatedBy);

    return { header, schedules };
  }

  /**
   * REPORT 12: Revenue Recognition Report (تقرير الاعتراف بالإيرادات المحققة)
   */
  public static async generateRevenueRecognitionReport(
    schoolId: string,
    periodName: string,
    generatedBy: string,
    requestSchoolId: string
  ): Promise<{ header: FinancialReportHeader; recognitions: any[] }> {
    FinancialReportingDomainRules.verifyMultiTenantBoundary(schoolId, requestSchoolId);

    const recognitions = FallbackStorage.getRecognitionSchedules().filter(
      s => (s as any).schoolId === schoolId && s.recognitionStatus === 'Recognized'
    );

    const header = this.constructHeader('REP_REV_' + Date.now(), 'تقرير الاعتراف بالإيرادات والتحويل من المؤجل للفترة', schoolId, periodName, generatedBy);

    return { header, recognitions };
  }
}
