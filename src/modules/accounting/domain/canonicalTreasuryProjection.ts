import type { TreasuryAccount, TreasuryTransaction } from '../../../types';

type FinancialRow = Record<string, any>;

const value = (row: FinancialRow, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
};

const text = (row: FinancialRow, ...keys: string[]): string => String(value(row, ...keys) ?? '').trim();

const amount = (row: FinancialRow, ...keys: string[]): number => {
  const parsed = Number(value(row, ...keys));
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

const isLiquidityAccount = (code: string): boolean => /^(1101|1102|1110|1120)(?:\.|$)/.test(code);

const accountType = (code: string): TreasuryAccount['type'] => {
  return code === '1102' || code.startsWith('1102.') || code.startsWith('1120')
    ? 'Bank Account'
    : 'Main Chest';
};

const transactionFromLine = (
  schoolId: string,
  journal: FinancialRow,
  line: FinancialRow,
  index: number,
): TreasuryTransaction | null => {
  const accountCode = text(line, 'accountCode', 'account_code');
  const debit = amount(line, 'debit');
  const credit = amount(line, 'credit');
  const transactionAmount = debit > 0 ? debit : credit;
  if (!isLiquidityAccount(accountCode) || transactionAmount <= 0 || (debit > 0 && credit > 0)) return null;

  const journalId = text(journal, 'id') || text(line, 'journalEntryId', 'journal_entry_id');
  const sourceType = text(journal, 'sourceType', 'source_type') || 'journal_entry';
  const sourceId = text(journal, 'sourceId', 'source_id') || journalId;
  const entryDate = text(journal, 'date', 'entry_date') || new Date().toISOString().slice(0, 10);
  const isDeposit = debit > 0;

  return {
    id: `erp-treasury-${journalId}-${accountCode}-${index}`,
    schoolId,
    type: isDeposit ? 'Deposit' : 'Withdrawal',
    status: 'Posted',
    sourceAccountId: isDeposit ? undefined : accountCode,
    destinationAccountId: isDeposit ? accountCode : undefined,
    amount: transactionAmount,
    currency: 'LYD',
    exchangeRate: 1,
    paymentInstrument: accountCode === '1102' || accountCode.startsWith('1102.') ? 'Bank Transfer' : 'Cash',
    referenceType: sourceType,
    referenceId: sourceId,
    description: text(journal, 'description') || `حركة مالية ${journalId}`,
    transactionDate: entryDate.slice(0, 10),
    preparedBy: 'canonical-erp',
    postedBy: 'canonical-erp',
    postedAt: text(journal, 'createdAt', 'created_at') || undefined,
    journalEntryId: journalId,
    notes: 'حركة مقروءة من دفتر الأستاذ الكانوني؛ لا تُنشئ نسخة خزينة ثانية.',
    version: 1,
    createdAt: text(journal, 'createdAt', 'created_at') || new Date().toISOString(),
    updatedAt: text(journal, 'createdAt', 'created_at') || new Date().toISOString(),
  };
};

/**
 * Projects only canonical GL liquidity lines into the treasury read model.
 * This is deliberately a read projection: the ERP journal remains the sole
 * financial source and no legacy treasury transaction is created here.
 */
export function buildCanonicalTreasuryProjection(
  data: Record<string, any> | null | undefined,
  schoolId: string,
): { accounts: TreasuryAccount[]; transactions: TreasuryTransaction[] } | null {
  if (!data || !Array.isArray(data.erpLedgerEntries) || !Array.isArray(data.erpChartOfAccounts)) return null;

  const chart = data.erpChartOfAccounts as FinancialRow[];
  const ledger = data.erpLedgerEntries as FinancialRow[];
  const accountsByCode = new Map<string, TreasuryAccount>();

  for (const row of chart) {
    const code = text(row, 'code', 'accountCode', 'account_code');
    if (!code || !isLiquidityAccount(code) || row.isActive === false || row.is_active === false || row.isLeaf === false || row.is_leaf === false) continue;
    accountsByCode.set(code, {
      id: code,
      schoolId,
      name: text(row, 'name', 'nameAr', 'accountName', 'account_name') || code,
      code,
      type: accountType(code),
      glAccountId: code,
      currency: 'LYD',
      balance: amount(row, 'balance'),
      isActive: true,
      allowNegativeBalance: false,
      notes: 'حساب مُدار من دفتر الأستاذ الكانوني',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const transactions = ledger
    .map((line, index) => {
      const journal = {
        id: text(line, 'journalEntryId', 'journal_entry_id'),
        date: value(line, 'entryDate', 'entry_date'),
        description: value(line, 'description'),
        sourceType: value(line, 'sourceType', 'source_type'),
        sourceId: value(line, 'sourceId', 'source_id'),
        createdAt: value(line, 'createdAt', 'created_at'),
      };
      return transactionFromLine(schoolId, journal, line, index);
    })
    .filter((row): row is TreasuryTransaction => Boolean(row));

  return {
    accounts: [...accountsByCode.values()],
    transactions,
  };
}
