export interface BankReconciliationTransaction {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer' | string;
  status: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  amount: number;
}

export interface BankReconciliationSummary {
  unclearedDeposits: number;
  unpresentedChecks: number;
  adjustedBankBalance: number;
  difference: number;
}

/**
 * Reconcile the statement balance to the posted ledger balance. Deposits in
 * transit and outstanding checks adjust the bank statement side, not the
 * book balance, because posted transactions are already in the ledger.
 */
export function calculateBankReconciliation(input: {
  bankAccountId: string;
  bankLedgerBalance: number;
  bankStatementBalance: number;
  transactions: BankReconciliationTransaction[];
  clearedTransactionIds: string[];
}): BankReconciliationSummary {
  const clearedIds = new Set(input.clearedTransactionIds);
  let unclearedDeposits = 0;
  let unpresentedChecks = 0;

  for (const transaction of input.transactions) {
    const status = String(transaction.status || '').toLowerCase();
    if (!['posted', 'reconciled'].includes(status) || status === 'cancelled') continue;
    if (status === 'reconciled' || clearedIds.has(transaction.id)) continue;

    const amount = Math.max(0, Number(transaction.amount) || 0);
    const isDeposit = transaction.type === 'Deposit'
      ? transaction.destinationAccountId === input.bankAccountId
      : transaction.type === 'Transfer' && transaction.destinationAccountId === input.bankAccountId;
    const isWithdrawal = transaction.type === 'Withdrawal'
      ? transaction.sourceAccountId === input.bankAccountId
      : transaction.type === 'Transfer' && transaction.sourceAccountId === input.bankAccountId;

    if (isDeposit) unclearedDeposits += amount;
    if (isWithdrawal) unpresentedChecks += amount;
  }

  const adjustedBankBalance = roundCurrency(
    Number(input.bankStatementBalance || 0) + unclearedDeposits - unpresentedChecks
  );
  const difference = roundCurrency(adjustedBankBalance - Number(input.bankLedgerBalance || 0));

  return {
    unclearedDeposits: roundCurrency(unclearedDeposits),
    unpresentedChecks: roundCurrency(unpresentedChecks),
    adjustedBankBalance,
    difference
  };
}

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
