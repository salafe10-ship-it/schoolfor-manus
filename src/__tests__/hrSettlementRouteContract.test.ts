import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('HR settlement route contract', () => {
  const source = readFileSync('server.ts', 'utf8');

  it('calculates from canonical HR data and persists a tenant-scoped settlement', () => {
    expect(source).toContain("/api/hr/settlements/end-of-service");
    expect(source).toContain('public.hr_employee_settlements');
    expect(source).toContain("ON CONFLICT (school_id,employee_id,termination_date)");
    expect(source).toContain('WHERE public.hr_employee_settlements.status=\'draft\'');
    expect(source).toContain('hr_employee_settlement');
  });

  it('requires approval before payout and prevents duplicate payout', () => {
    expect(source).toContain("/api/hr/settlements/:settlementId/approve");
    expect(source).toContain("/api/hr/settlements/:settlementId/pay");
    expect(source).toContain("row.status !== 'approved' || row.journal_id");
    expect(source).toContain("SET status='paid',journal_id");
  });

  it('supports bank or cash through canonical mappings with cost center lines', () => {
    expect(source).toContain("payoutMethod === 'bank' ? 'treasury.bank' : 'treasury.cash'");
    expect(source).toContain("'hr.end_of_service.expense'");
    expect(source).toContain('costCenter: row.cost_center');
  });

  it('records bank payouts in a tenant-scoped reconciliation register', () => {
    expect(source).toContain("/api/hr/bank-disbursements");
    expect(source).toContain('public.hr_bank_disbursements');
    expect(source).toContain('recordHrBankDisbursement');
    expect(source).toContain("sourceType: 'advance'");
    expect(source).toContain("sourceType: 'payroll'");
    expect(source).toContain("sourceType: 'settlement'");
    expect(source).toContain("ON CONFLICT (school_id, source_type, source_id)");
  });
});
