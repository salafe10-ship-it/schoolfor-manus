import { describe, expect, it } from 'vitest';
import { calculateBankReconciliation } from '../modules/accounting/domain/bankReconciliation';
import { evaluateCalculatorExpression } from '../modules/accounting/domain/calculator';

describe('bank reconciliation calculations', () => {
  it('adjusts the bank statement for posted items in transit instead of adding them to book balance', () => {
    const result = calculateBankReconciliation({
      bankAccountId: 'bank-1',
      bankLedgerBalance: 1500,
      bankStatementBalance: 0,
      clearedTransactionIds: [],
      transactions: [
        { id: 'deposit-1', type: 'Deposit', status: 'Posted', destinationAccountId: 'bank-1', amount: 1500 },
        { id: 'withdrawal-1', type: 'Withdrawal', status: 'Posted', sourceAccountId: 'bank-1', amount: 100 },
        { id: 'draft-1', type: 'Deposit', status: 'Draft', destinationAccountId: 'bank-1', amount: 900 },
        { id: 'cancelled-1', type: 'Withdrawal', status: 'Cancelled', sourceAccountId: 'bank-1', amount: 500 },
      ]
    });

    expect(result.unclearedDeposits).toBe(1500);
    expect(result.unpresentedChecks).toBe(100);
    expect(result.adjustedBankBalance).toBe(1400);
    expect(result.difference).toBe(-100);
  });

  it('excludes items already cleared or reconciled and handles transfers by account direction', () => {
    const result = calculateBankReconciliation({
      bankAccountId: 'bank-1',
      bankLedgerBalance: 125,
      bankStatementBalance: 100,
      clearedTransactionIds: ['cleared-deposit'],
      transactions: [
        { id: 'cleared-deposit', type: 'Deposit', status: 'Posted', destinationAccountId: 'bank-1', amount: 25 },
        { id: 'done-withdrawal', type: 'Withdrawal', status: 'Reconciled', sourceAccountId: 'bank-1', amount: 5 },
        { id: 'transfer-in', type: 'Transfer', status: 'Posted', destinationAccountId: 'bank-1', amount: 10 },
        { id: 'transfer-out', type: 'Transfer', status: 'Posted', sourceAccountId: 'bank-1', amount: 10 },
      ]
    });

    expect(result.unclearedDeposits).toBe(10);
    expect(result.unpresentedChecks).toBe(10);
    expect(result.adjustedBankBalance).toBe(100);
    expect(result.difference).toBe(-25);
  });
});

describe('accounting keypad calculator', () => {
  it('evaluates chained arithmetic with precedence and parentheses', () => {
    expect(evaluateCalculatorExpression('7+8')).toBe(15);
    expect(evaluateCalculatorExpression('(7+8)*2')).toBe(30);
    expect(evaluateCalculatorExpression('10/4')).toBe(2.5);
  });

  it('rejects malformed expressions and non-finite results', () => {
    expect(() => evaluateCalculatorExpression('7+')).toThrow();
    expect(() => evaluateCalculatorExpression('1/0')).toThrow();
    expect(() => evaluateCalculatorExpression('2;alert(1)')).toThrow();
  });
});
