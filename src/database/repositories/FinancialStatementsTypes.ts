export interface StatementOfChangesInEquity {
  openingBalance: number;
  netIncome: number;
  contributions: number;
  distributions: number;
  closingBalance: number;
  lines: { accountCode: string; accountName: string; opening: number; change: number; closing: number }[];
}

export interface FinancialStatementsSet {
  id: string;
  schoolId: string;
  periodId: string;
  periodName: string;
  generatedAt: string;
  generatedBy: string;
  postingVersion: string;
  configurationVersion: string;
  auditReference: string;
  trialBalance: any;
  generalLedger: any;
  subLedger: any;
  incomeStatement: any;
  balanceSheet: any;
  cashFlow: any;
  changesInEquity: StatementOfChangesInEquity;
  notes: string[];
}
