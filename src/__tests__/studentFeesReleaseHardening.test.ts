import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const server = readFileSync('server.ts', 'utf8');
const portal = readFileSync('src/components/StudentFinancialPortal.tsx', 'utf8');
const reversalMigration = readFileSync('supabase/migrations/202610131000_student_fee_receipt_reversal_audit.sql', 'utf8');
const stagingUat = readFileSync('scripts/uat-student-fees-staging.ts', 'utf8');
const stagingEnvExample = readFileSync('docs/student-fees-staging-uat.env.example', 'utf8');
const studentFeesOperations = readFileSync('docs/STUDENT_FEES_CANONICAL_OPERATIONS.md', 'utf8');
const cloudflareWorker = readFileSync('cloudflare-worker.ts', 'utf8');
const gitignore = readFileSync('.gitignore', 'utf8');

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

  it('normalizes PostgreSQL DATE values before checking fee-template validity windows', () => {
    const templateCheck = section(server, 'const canonicalDatabaseDate =', 'app.get("/api/financial/fee-templates"');
    expect(templateCheck).toContain('value instanceof Date');
    expect(templateCheck).toContain('value.toISOString().slice(0, 10)');

    const issue = section(server, 'const issueCanonicalFeeInvoices = async', 'app.post("/api/financial/invoices/:invoiceId/void"');
    const bulk = section(server, 'app.post("/api/financial/fee-assignments/bulk"', 'app.post("/api/financial/invoices/:invoiceId/installment-plan"');
    expect(issue).toContain('canonicalDatabaseDate(feeTemplate.effectiveFrom)');
    expect(issue).toContain('canonicalDatabaseDate(feeTemplate.effectiveTo)');
    expect(issue).toContain('canonicalDatabaseDate(invoice.due_date)');
    expect(issue).toContain('canonicalDatabaseDate(invoice.invoice_date)');
    expect(bulk).toContain('canonicalDatabaseDate(template.effectiveFrom)');
    expect(bulk).toContain('canonicalDatabaseDate(template.effectiveTo)');
    expect(bulk).toContain('canonicalDatabaseDate(assignment.dueDate)');
    expect(bulk).toContain('canonicalDatabaseDate(canonicalInvoice.dueDate)');
    expect(bulk).toContain('invoiceDate: canonicalDatabaseDate(canonicalInvoice.invoiceDate)');
    expect(bulk).toContain('ON CONFLICT (school_id, idempotency_key) WHERE idempotency_key IS NOT NULL');

    const reverse = section(server, 'app.post("/api/financial/receipts/:receiptId/reverse"', 'app.get("/api/financial/students/:studentId/account"');
    expect(reverse).toContain('canonicalDatabaseDate(schedule.dueDate)');
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

  it('fails closed on online-payment settlement until receipt, allocation, and journal posting are atomic', () => {
    const settle = section(server, 'app.post("/api/financial/payment-attempts/:attemptId/settle"', 'app.post("/api/financial/payment-webhooks/:provider"');
    const allocate = section(server, 'app.post("/api/financial/receipts/:receiptId/allocate"', 'app.post("/api/financial/receipts/:receiptId/reverse"');
    expect(settle).toContain('ONLINE_PAYMENT_LEDGER_NOT_READY');
    expect(settle).toContain('res.status(409)');
    expect(allocate).toContain("String(receipt.rows[0].status).toLowerCase() !== 'posted'");
    expect(allocate).toContain('!receipt.rows[0].journalEntryId');
  });

  it('binds payment idempotency to the full request and signs webhooks over raw bytes', () => {
    const intent = section(server, 'app.post("/api/financial/payment-intents"', 'app.post("/api/financial/payment-attempts/:attemptId/settle"');
    const webhook = section(server, 'app.post("/api/financial/payment-webhooks/:provider"', 'app.post("/api/financial/receipts/manual-settle"');
    expect(intent).toContain('ON CONFLICT (school_id, idempotency_key) DO NOTHING');
    expect(intent).toContain('metadata = $8::jsonb');
    expect(intent).toContain('مفتاح محاولة الدفع مستخدم لطلب مختلف');
    expect(webhook).toContain('createHmac(\'sha256\', secret).update(rawBody');
    expect(webhook).toContain('timingSafeEqual');
    expect(webhook).toContain('provider = $3 AND provider_reference = $4');
    expect(webhook).not.toContain('body.signature');
  });

  it('passes the webhook secret into the Cloudflare Node runtime', () => {
    expect(cloudflareWorker).toContain('"PAYMENT_WEBHOOK_SECRET"');
    expect(cloudflareWorker).toContain('const runtimeEnvKeys = [');
  });

  it('does not replay a posted manual receipt for a different settlement command', () => {
    const settle = section(server, 'app.post("/api/financial/receipts/manual-settle"', 'app.post("/api/financial/receipts/:receiptId/allocate"');
    expect(settle).toContain('معرف السند مرحّل بطلب مختلف');
    expect(settle).toContain('JSON.stringify(storedAccounts) !== JSON.stringify(requestAccounts)');
    expect(settle).toContain("storedCommand.command !== 'manual_settle'");
  });

  it('lets an empty canonical fee result replace stale snapshot rows and blocks missing tables in canonical mode', () => {
    const read = section(server, 'app.get("/api/financial/database"', 'app.post("/api/financial/database"');
    expect(read).toContain('canonicalFeeInvoicesAvailable ? { invoices: canonicalFeeInvoices }');
    expect(read).toContain('canonicalFeeReceiptsAvailable ? { studentReceiptVouchers: canonicalFeeReceipts');
    expect(read).toContain('canonicalChartOfAccountsAvailable ? { chartOfAccounts: canonicalChartOfAccounts }');
    expect(read).toContain('جداول الرسوم والحسابات الكانونية غير مكتملة');
  });

  it('requires deliberate selection before bulk posting and clears selection when its target changes', () => {
    expect(portal).toContain('massTargetStudents.filter(s => selectedStudentIds[s.id] === true)');
    expect(portal).toContain('checked={selectedStudentIds[student.id] === true}');
    expect(portal).toContain('setSelectedStudentIds({});');
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
    expect(stagingUat).toContain('duplicate invoice id unexpectedly allowed the batch');
    expect(stagingUat).toContain('idempotency_key = ANY($3::text[])');
    expect(stagingUat).not.toContain('afterAtomicFailure.invoices');
    expect(stagingUat).toContain('ssl: { rejectUnauthorized: true }');
    expect(stagingUat).not.toContain('rejectUnauthorized: false');
    expect(stagingUat).toContain('let writesStarted = false;');
    expect(stagingUat).toContain('unexpected-status');
    expect(stagingUat).toContain('reversal-not-persisted');
    expect(stagingUat).not.toContain('receipt.response.status !== 409');
    expect(stagingUat).toContain('invoice:${invoice.id}:still-paid');
    expect(stagingUat).toContain('cancellation-not-persisted');
    expect(stagingUat).not.toContain('response.response.status !== 409');
    expect(stagingUat).toContain('if (writesStarted) {');
  });

  it('keeps receipt reversal audit IDs UUID-compatible and records the receipt in metadata', () => {
    const reverse = section(server, 'app.post("/api/financial/receipts/:receiptId/reverse"', 'app.get("/api/financial/students/:studentId/account"');
    expect(reverse).toContain("'student_fee_receipt',$6,'reverse'");
    expect(reverse).toMatch(/databaseActorId,\s+auditId,\s+reason,/);
    expect(reverse).toContain('JSON.stringify({ receiptId, journalId, reversalJournalId');
  });

  it('provides disabled staging UAT placeholders without committing secrets', () => {
    const uatVariables = [
      'UAT_STUDENT_FEES_STAGING_CONFIRM', 'SUPABASE_URL', 'DATABASE_URL', 'UAT_FINANCIAL_BEARER_TOKEN',
      'UAT_FINANCIAL_STUDENT_ID', 'UAT_FINANCIAL_SECOND_STUDENT_ID', 'UAT_FINANCIAL_FEE_CONFIG_ID',
      'UAT_FINANCIAL_FEE_TEMPLATE_ID', 'UAT_FINANCIAL_RECEIPT_ACCOUNT', 'UAT_FINANCIAL_REVENUE_ACCOUNT',
    ];
    for (const name of uatVariables) expect(stagingEnvExample).toMatch(new RegExp(`^${name}=$`, 'm'));
    expect(stagingEnvExample).toContain('UAT35_TARGET=schoolfor-manus-staging');
    expect(stagingEnvExample).toContain('UAT_FINANCIAL_BASE_URL=http://127.0.0.1:4179');
    expect(stagingEnvExample).toContain('UAT_ALLOW_LOCAL_STAGING=false');
    expect(stagingEnvExample).toContain('PLATFORM_ADMIN_DATABASE_URL=');
    expect(gitignore).toContain('.env*');
    expect(studentFeesOperations).toContain('نجاح Vitest أو فحص GitHub Actions لا يعني نجاح UAT المالي');
    expect(studentFeesOperations).toContain('pnpm uat:student-fees:staging');
  });
});
