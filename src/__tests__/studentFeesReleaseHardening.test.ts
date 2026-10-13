import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const server = readFileSync('server.ts', 'utf8');
const portal = readFileSync('src/components/StudentFinancialPortal.tsx', 'utf8');
const reversalMigration = readFileSync('supabase/migrations/202610131000_student_fee_receipt_reversal_audit.sql', 'utf8');
const stagingUat = readFileSync('scripts/uat-student-fees-staging.ts', 'utf8');

function section(source: string, start: string, end: string) {
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt + start.length);
  expect(startAt, `missing section start: ${start}`).toBeGreaterThanOrEqual(0);
  expect(endAt, `missing section end: ${end}`).toBeGreaterThan(startAt);
  return source.slice(startAt, endAt);
}

describe('student-fees release hardening', () => {
  it('makes a repeated bulk assignment reuse canonical assignment and invoice identities', () => {
    const bulk = section(server, 'app.post("/api/financial/fee-assignments/bulk"', 'app.post("/api/financial/invoices/:invoiceId/installment-plan"');
    expect(bulk).toContain('existingAssignment');
    expect(bulk).toContain('const assignmentKey = String(assignment.idempotencyKey || key)');
    expect(bulk).toContain('id: String(canonicalInvoice.id)');
    expect(bulk).toContain('atomic: true');
    expect(bulk).toContain('allIdempotentReplay');
  });

  it('rejects cross-student allocations and installments outside the selected invoice', () => {
    const allocate = section(server, 'app.post("/api/financial/receipts/:receiptId/allocate"', 'app.post("/api/financial/receipts/:receiptId/reverse"');
    expect(allocate).toContain('receipt.rows[0].studentId) !== String(invoice.rows[0].studentId)');
    expect(allocate).toContain('String(schedule.invoiceId) !== invoiceId');
    expect(allocate).toContain('schedule.amount || 0) - Number(schedule.paidAmount || 0)');
  });

  it('issues multiple invoices in one transaction and voids canonical invoice and ledger together', () => {
    const issue = section(server, 'const issueCanonicalFeeInvoices = async', 'app.post("/api/financial/invoices/:invoiceId/void"');
    expect(issue).toContain('UnitOfWork.runInTransaction');
    expect(issue).toContain('assertCanonicalFeeOperationalScope');
    expect(issue).toContain('assertCanonicalFeeRevenueAccount');
    expect(issue).toContain('sameInstallmentPlan');
    expect(issue).toContain('sourcePayload.discountAccount');
    expect(issue).toContain('issue-batch');
    expect(issue).toContain('meta: { source: \'canonical_postgres\', idempotentReplay: replay, count: rows.length, atomic: true }');

    const voidRoute = section(server, 'app.post("/api/financial/invoices/:invoiceId/void"', 'app.post("/api/financial/fee-assignments/bulk"');
    expect(voidRoute).toContain('CanonicalErpPostingService.reverseJournal');
    expect(voidRoute).toContain("SET status = 'cancelled', remaining_amount = 0");
    expect(voidRoute).toContain('student_fee_installment_plans');
  });

  it('reverses receipt, active allocations, invoices, installment balances, and journal atomically', () => {
    const reverse = section(server, 'app.post("/api/financial/receipts/:receiptId/reverse"', 'app.get("/api/financial/students/:studentId/account"');
    expect(reverse).toContain("status || '').toLowerCase() !== 'posted'");
    expect(reverse).toContain('CanonicalErpPostingService.reverseJournal');
    expect(reverse).toContain('SET paid_amount = $4, remaining_amount = $5');
    expect(reverse).toContain('SET paid_amount = $4, status = $5');
    expect(reverse).toContain('SET reversed_at = now(), reversed_by = $4');
    expect(reverse).toContain("SET status = 'cancelled'");
    expect(reversalMigration).toContain('reversal_journal_id text');
  });

  it('does not report scholarship approval until it has a financial posting effect', () => {
    const approve = section(server, 'app.post("/api/financial/concessions/:concessionId/approve"', 'app.post("/api/financial/payment-intents"');
    expect(approve).toContain('res.status(409)');
    expect(approve).toContain('CONCESSION_FINANCIAL_EFFECT_NOT_IMPLEMENTED');
    expect(approve).not.toContain("SET status = 'approved'");
  });

  it('routes the portal through atomic batch issue, canonical cancellation, and canonical receipt reversal', () => {
    expect(portal).toContain("authenticatedRequest('/api/financial/invoices/issue-batch'");
    expect(portal).toContain('/api/financial/receipts/${encodeURIComponent(selectedStudRv.id)}/reverse');
    expect(portal).toContain('/api/financial/invoices/${encodeURIComponent(invoiceId)}/void');
  });

  it('gates the staging UAT to the isolated target and covers the requested financial lifecycle', () => {
    expect(stagingUat).toContain('RUN_STUDENT_FEES_STAGING_UAT');
    expect(stagingUat).toContain('assertIsolatedStagingDatabase');
    expect(stagingUat).toContain('STUDENT_FEES_UAT_DATABASE_PREFLIGHT_REQUIRES_RESTRICTED_STAGING_APP_ROLE');
    expect(stagingUat).toContain('issue-batch');
    expect(stagingUat).toContain('fee-assignments/bulk');
    expect(stagingUat).toContain('installment-plan');
    expect(stagingUat).toContain('manual-settle');
    expect(stagingUat).toContain('cross-student allocation was unexpectedly accepted');
    expect(stagingUat).toContain('reversal migration is not installed');
  });
});
