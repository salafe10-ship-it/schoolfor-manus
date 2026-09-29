import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('financial payroll account isolation', () => {
  const posting = readFileSync('src/modules/financial/application/CanonicalErpPostingService.ts', 'utf8');
  const hrPortal = readFileSync('src/components/hr/HumanResourcesPortal.tsx', 'utf8');

  it('does not reuse fixed-asset or operating-expense accounts for payroll and advances', () => {
    expect(posting).toContain("'hr.payroll.expense': '5110'");
    expect(posting).toContain("'hr.advance.receivable': '1220'");
    expect(posting).toContain("'hr.advance.long_term.receivable': '1221'");
    expect(posting).not.toContain("'hr.advance.receivable': '1210'");
    expect(posting).not.toContain("'hr.payroll.expense': '5101'");
  });

  it('keeps the HR setup defaults aligned with the canonical mapping registry', () => {
    expect(hrPortal).toContain("defaultSalariesExpenseAccount: '5110'");
    expect(hrPortal).toContain("shortTermAdvanceAccount: '1220'");
    expect(hrPortal).toContain("longTermAdvanceAccount: '1221'");
  });
});
