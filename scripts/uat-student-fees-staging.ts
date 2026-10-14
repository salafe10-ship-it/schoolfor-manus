import dotenv from 'dotenv';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { assertCloudflareStagingWorkerUrl, assertIsolatedStagingDatabase, STAGING_TARGET_NAME } from './stagingDatabaseSafety.js';

dotenv.config({ path: '.env.staging', override: false });

const EXPECTED_CONFIRMATION = 'RUN_STUDENT_FEES_STAGING_UAT';
const BASE_URL = String(process.env.UAT_FINANCIAL_BASE_URL || '').trim().replace(/\/$/, '');
const TOKEN = String(process.env.UAT_FINANCIAL_BEARER_TOKEN || '').trim();
const STUDENT_ID = String(process.env.UAT_FINANCIAL_STUDENT_ID || '').trim();
const SECOND_STUDENT_ID = String(process.env.UAT_FINANCIAL_SECOND_STUDENT_ID || '').trim();
const FEE_CONFIG_ID = String(process.env.UAT_FINANCIAL_FEE_CONFIG_ID || '').trim();
const FEE_TEMPLATE_ID = String(process.env.UAT_FINANCIAL_FEE_TEMPLATE_ID || '').trim();
const RECEIPT_ACCOUNT = String(process.env.UAT_FINANCIAL_RECEIPT_ACCOUNT || '').trim();
const REVENUE_ACCOUNT = String(process.env.UAT_FINANCIAL_REVENUE_ACCOUNT || '').trim();
const COST_CENTER = String(process.env.UAT_FINANCIAL_COST_CENTER || 'kindergarten').trim();
const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const targetName = String(process.env.UAT35_TARGET || '').trim();
const { Pool } = pg;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`STUDENT_FEES_UAT_ASSERTION_FAILED:${message}`);
}

function requireEnvironment() {
  if (process.env.UAT_STUDENT_FEES_STAGING_CONFIRM !== EXPECTED_CONFIRMATION) {
    throw new Error('STUDENT_FEES_STAGING_CONFIRMATION_REQUIRED');
  }
  if (!BASE_URL || !TOKEN || !STUDENT_ID || !SECOND_STUDENT_ID || !FEE_CONFIG_ID || !FEE_TEMPLATE_ID || !RECEIPT_ACCOUNT || !REVENUE_ACCOUNT) {
    throw new Error('STUDENT_FEES_STAGING_FIXTURE_ENVIRONMENT_INCOMPLETE');
  }
  if (STUDENT_ID === SECOND_STUDENT_ID) throw new Error('STUDENT_FEES_UAT_REQUIRES_TWO_DISTINCT_STUDENTS');
  const url = new URL(BASE_URL);
  if (url.origin === 'https://schoolfor-manus-staging.salafe10.workers.dev' && url.pathname === '/') {
    assertCloudflareStagingWorkerUrl(`${url.origin}/`);
  } else if (!['127.0.0.1', 'localhost'].includes(url.hostname)
    || url.port !== '4179'
    || process.env.UAT_ALLOW_LOCAL_STAGING !== 'true'
    || process.env.EDUPRO_ENVIRONMENT !== 'staging') {
    throw new Error('STUDENT_FEES_UAT_TARGET_MUST_BE_ISOLATED_STAGING');
  }
  if (!databaseUrl || !supabaseUrl || targetName !== STAGING_TARGET_NAME) {
    throw new Error('STUDENT_FEES_UAT_READ_ONLY_STAGING_DATABASE_PREFLIGHT_REQUIRED');
  }
  assertIsolatedStagingDatabase({ targetName, supabaseUrl, databaseUrl });
  const dbRole = decodeURIComponent(new URL(databaseUrl).username).split('.')[0];
  if (dbRole !== String(process.env.DATABASE_ROLE_EXPECTED || '') || dbRole !== 'edupro_staging_app') {
    throw new Error('STUDENT_FEES_UAT_DATABASE_PREFLIGHT_REQUIRES_RESTRICTED_STAGING_APP_ROLE');
  }
  if (!/^(1101|1102|1110|1120)/.test(RECEIPT_ACCOUNT)) {
    throw new Error('STUDENT_FEES_UAT_RECEIPT_ACCOUNT_MUST_BE_STAGING_CASH_OR_BANK');
  }
}

async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({})) as any;
  return { response, body };
}

async function requireApi(path: string, init: RequestInit = {}) {
  const result = await api(path, init);
  if (!result.response.ok || !result.body?.success) {
    throw new Error(`STUDENT_FEES_UAT_API_FAILED:${path}:${result.response.status}:${String(result.body?.error || result.body?.message || 'unknown')}`);
  }
  return result;
}

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function addDays(days: number) { const date = new Date(); date.setUTCDate(date.getUTCDate() + days); return isoDate(date); }

async function main() {
  requireEnvironment();
  const pool = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 10_000, ssl: { rejectUnauthorized: true }, application_name: 'edupro-student-fees-staging-uat-readonly' });
  const runId = randomUUID();
  const receiptIds = [
    `UATRCPT-${runId}-P`,
    `UATRCPT-${runId}-F`,
    `UATRCPT-${runId}-X`,
  ];
  const issuePrefix = `uatfees:${runId}:issue`;
  let tenantId = '';
  let schoolId = '';
  let primaryInvoiceId = '';
  let cancelInvoiceId = '';
  let bulkInvoiceId = '';
  const completed: string[] = [];
  let writesStarted = false;

  async function studentAccount(studentId: string) {
    const { body } = await requireApi(`/api/financial/students/${encodeURIComponent(studentId)}/account`);
    return body.data;
  }

  async function issueVoid(invoiceId: string, reason: string) {
    const { body } = await requireApi(`/api/financial/invoices/${encodeURIComponent(invoiceId)}/void`, {
      method: 'POST', body: JSON.stringify({ reason }),
    });
    return body.data;
  }

  async function reverseReceipt(receiptId: string, reason: string) {
    const { body } = await requireApi(`/api/financial/receipts/${encodeURIComponent(receiptId)}/reverse`, {
      method: 'POST', body: JSON.stringify({ reason }),
    });
    return body.data;
  }

  try {
    const client = await pool.connect();
    try {
      assertIsolatedStagingDatabase({ targetName, supabaseUrl, databaseUrl });
      const columns = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name='student_fee_allocations'
            AND column_name = ANY($1::text[])`,
        [['reversed_at', 'reversed_by', 'reversal_reason', 'reversal_journal_id']],
      );
      const reversalColumns = new Set(columns.rows.map(row => row.column_name));
      assert(['reversed_at', 'reversed_by', 'reversal_reason', 'reversal_journal_id'].every(name => reversalColumns.has(name)), 'receipt reversal migration is not installed');
    } finally {
      client.release();
    }

    const { body: readiness } = await requireApi('/api/financial/readiness');
    tenantId = String(readiness.meta?.scope?.tenantId || '');
    schoolId = String(readiness.meta?.scope?.schoolId || '');
    assert(tenantId && schoolId, 'authenticated staging scope was not returned');
    const existingUatReceipts = await pool.query(
      `SELECT id FROM public.student_fee_receipts
        WHERE tenant_id = $1 AND school_id = $2 AND id = ANY($3::text[])`,
      [tenantId, schoolId, receiptIds],
    );
    assert(existingUatReceipts.rows.length === 0, 'generated UAT receipt ids already exist; no test data was created');
    const { body: operational } = await requireApi('/api/financial/operational-context');
    const context = operational.data;
    assert(context?.academicYearId && context?.academicPeriodId && context?.financialPeriod, 'active academic year/term context is missing');
    const { body: finance } = await requireApi('/api/financial/database');
    const feeConfig = (finance.data?.feeConfigs || []).find((row: any) => String(row.id) === FEE_CONFIG_ID);
    assert(feeConfig, 'configured staging fee fixture was not found');
    assert(String(feeConfig.account) === REVENUE_ACCOUNT, 'configured revenue account does not match the staging fixture');
    const { body: templates } = await requireApi('/api/financial/fee-templates');
    const template = (templates.data || []).find((row: any) => String(row.id) === FEE_TEMPLATE_ID);
    assert(template && template.status === 'active', 'active canonical staging fee template was not found');
    assert(String(template.code) === String(feeConfig.type), 'staging template code does not match fee configuration');
    assert(String(template.academicYearId) === String(context.academicYearId), 'staging template is not in the active academic year');
    assert(String(template.financialPeriod) === String(context.financialPeriod), 'staging template has a mismatched financial period');
    assert(String(template.revenueAccount) === REVENUE_ACCOUNT, 'staging template has a mismatched revenue account');

    for (const studentId of [STUDENT_ID, SECOND_STUDENT_ID]) {
      assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId), 'student fixture id must be a UUID');
      const account = await studentAccount(studentId);
      const active = (account.invoices || []).filter((invoice: any) => !['paid', 'cancelled', 'void', 'refunded', 'written_off'].includes(String(invoice.status || '').toLowerCase()) && Number(invoice.remainingAmount || 0) > 0);
      assert(active.length === 0, 'UAT student fixture already has open receivables; no test data was created');
    }
    completed.push('preflight: isolated staging, migration, fixtures, active year/term, empty student ledgers');

    const batch = [
      { studentId: STUDENT_ID, templateId: FEE_TEMPLATE_ID, description: `UAT tuition ${runId}`, amount: 200, grossAmount: 200, discountAmount: 0,
        dueDate: addDays(3), invoiceDate: isoDate(new Date()), academicYearId: context.academicYearId, academicPeriodId: context.academicPeriodId,
        financialPeriod: context.financialPeriod, revenueAccount: REVENUE_ACCOUNT, receivableAccount: '1201', costCenter: COST_CENTER,
        currency: template.currency || 'SAR', idempotencyKey: `${issuePrefix}:primary` },
      { studentId: STUDENT_ID, templateId: FEE_TEMPLATE_ID, description: `UAT cancellation ${runId}`, amount: 50, grossAmount: 50, discountAmount: 0,
        dueDate: addDays(40), invoiceDate: isoDate(new Date()), academicYearId: context.academicYearId, academicPeriodId: context.academicPeriodId,
        financialPeriod: context.financialPeriod, revenueAccount: REVENUE_ACCOUNT, receivableAccount: '1201', costCenter: COST_CENTER,
        currency: template.currency || 'SAR', idempotencyKey: `${issuePrefix}:cancel` },
    ];
    writesStarted = true;
    const firstIssue = await requireApi('/api/financial/invoices/issue-batch', { method: 'POST', body: JSON.stringify({ invoices: batch }) });
    const secondIssue = await requireApi('/api/financial/invoices/issue-batch', { method: 'POST', body: JSON.stringify({ invoices: batch }) });
    const issued = firstIssue.body.data.invoices;
    const issuedAgain = secondIssue.body.data.invoices;
    assert(issued.length === 2 && issuedAgain.length === 2, 'atomic invoice batch did not return both invoices');
    assert(issued[0].id === issuedAgain[0].id && issued[1].id === issuedAgain[1].id, 'invoice batch retry created different invoice identities');
    assert(secondIssue.body.meta?.idempotentReplay === true, 'invoice batch retry was not reported as idempotent');
    primaryInvoiceId = String(issued[0].id);
    cancelInvoiceId = String(issued[1].id);
    completed.push('issue: two invoices in one server transaction and repeated batch with stable identities');

    const atomicInvoiceId = randomUUID();
    const atomicKeys = [`${issuePrefix}:atomic-first`, `${issuePrefix}:atomic-conflict`];
    const badBatch = [
      { ...batch[0], id: atomicInvoiceId, idempotencyKey: atomicKeys[0] },
      { ...batch[0], id: atomicInvoiceId, description: `UAT duplicate invoice id ${runId}`, idempotencyKey: atomicKeys[1] },
    ];
    const badBatchResult = await api('/api/financial/invoices/issue-batch', { method: 'POST', body: JSON.stringify({ invoices: badBatch }) });
    assert(!badBatchResult.response.ok, 'duplicate invoice id unexpectedly allowed the batch');
    const atomicRows = await pool.query(
      `SELECT id, idempotency_key FROM public.student_fee_invoices
        WHERE tenant_id = $1 AND school_id = $2 AND idempotency_key = ANY($3::text[])`,
      [tenantId, schoolId, atomicKeys],
    );
    assert(atomicRows.rows.length === 0, 'failed multi-row batch left an invoice after an earlier row had been inserted');
    completed.push('atomicity: second-row database conflict rolled back the first inserted invoice');

    await requireApi(`/api/financial/invoices/${encodeURIComponent(primaryInvoiceId)}/installment-plan`, {
      method: 'POST', body: JSON.stringify({ frequency: 'monthly', count: 2, startDueDate: addDays(3) }),
    });
    const partial = await requireApi('/api/financial/receipts/manual-settle', {
      method: 'POST', body: JSON.stringify({ receiptId: receiptIds[0], studentId: STUDENT_ID, receiptDate: isoDate(new Date()),
        paymentMethod: 'نقدي', receivingAccount: RECEIPT_ACCOUNT, receivingAccounts: [{ accountCode: RECEIPT_ACCOUNT, amount: 30, paymentMethod: 'نقدي' }],
        operationalType: 'رسوم دراسية', against: `UAT partial ${runId}`, costCenter: COST_CENTER, amount: 30 }),
    });
    assert(partial.body.data.receipt.status === 'posted', 'partial receipt was not posted');
    const partialReplay = await requireApi('/api/financial/receipts/manual-settle', {
      method: 'POST', body: JSON.stringify({ receiptId: receiptIds[0], studentId: STUDENT_ID, receiptDate: isoDate(new Date()),
        paymentMethod: 'نقدي', receivingAccount: RECEIPT_ACCOUNT, receivingAccounts: [{ accountCode: RECEIPT_ACCOUNT, amount: 30, paymentMethod: 'نقدي' }],
        operationalType: 'رسوم دراسية', against: `UAT partial ${runId}`, costCenter: COST_CENTER, amount: 30 }),
    });
    assert(partialReplay.body.meta?.idempotentReplay === true, 'receipt retry was not idempotent');
    let account = await studentAccount(STUDENT_ID);
    let primary = account.invoices.find((invoice: any) => invoice.id === primaryInvoiceId);
    assert(Number(primary?.paidAmount) === 30 && Number(primary?.remainingAmount) === 170, 'partial receipt did not update invoice balances');

    const full = await requireApi('/api/financial/receipts/manual-settle', {
      method: 'POST', body: JSON.stringify({ receiptId: receiptIds[1], studentId: STUDENT_ID, receiptDate: isoDate(new Date()),
        paymentMethod: 'نقدي', receivingAccount: RECEIPT_ACCOUNT, receivingAccounts: [{ accountCode: RECEIPT_ACCOUNT, amount: 170, paymentMethod: 'نقدي' }],
        operationalType: 'رسوم دراسية', against: `UAT full ${runId}`, costCenter: COST_CENTER, amount: 170 }),
    });
    assert(full.body.data.receipt.status === 'posted', 'full settlement receipt was not posted');
    account = await studentAccount(STUDENT_ID);
    primary = account.invoices.find((invoice: any) => invoice.id === primaryInvoiceId);
    assert(Number(primary?.paidAmount) === 200 && Number(primary?.remainingAmount) === 0, 'full settlement did not close invoice balance');
    const installmentPlans = await requireApi(`/api/financial/students/${encodeURIComponent(STUDENT_ID)}/installment-plans`);
    const planRows = installmentPlans.body.data || [];
    assert(planRows.some((row: any) => String(row.invoiceId || row.invoice_id) === primaryInvoiceId), 'installment plan is missing from the canonical read');
    completed.push('installments and collections: plan, partial receipt, idempotent retry, and full settlement');

    const bulkRequest = { templateId: FEE_TEMPLATE_ID, feeConfigId: FEE_CONFIG_ID, studentIds: [SECOND_STUDENT_ID],
      academicYearId: context.academicYearId, academicPeriodId: context.academicPeriodId, dueDate: addDays(20),
      description: `UAT bulk ${runId}`, source: 'student_fees_staging_uat', issueInvoices: true,
      currency: template.currency || 'SAR', idempotencyPrefix: `uatfees:${runId}:bulk` };
    const bulkFirst = await requireApi('/api/financial/fee-assignments/bulk', { method: 'POST', body: JSON.stringify(bulkRequest) });
    const bulkSecond = await requireApi('/api/financial/fee-assignments/bulk', { method: 'POST', body: JSON.stringify(bulkRequest) });
    const bulkRow = bulkFirst.body.data?.[0];
    const bulkRowAgain = bulkSecond.body.data?.[0];
    assert(bulkRow?.id && bulkRowAgain?.id === bulkRow.id, 'bulk assignment retry created a duplicate assignment');
    assert(bulkRow.invoice?.id && bulkRowAgain.invoice?.id === bulkRow.invoice.id, 'bulk assignment retry created a duplicate invoice');
    assert(bulkSecond.body.meta?.idempotentReplayCount === 1, 'bulk retry did not report the existing canonical invoice');
    bulkInvoiceId = String(bulkRow.invoice.id);
    completed.push('distribution: same bulk request twice returned the same assignment and invoice');

    const isolationReceipt = await requireApi('/api/financial/receipts/manual-settle', {
      method: 'POST', body: JSON.stringify({ receiptId: receiptIds[2], studentId: STUDENT_ID, receiptDate: isoDate(new Date()),
        paymentMethod: 'نقدي', receivingAccount: RECEIPT_ACCOUNT, receivingAccounts: [{ accountCode: RECEIPT_ACCOUNT, amount: 10, paymentMethod: 'نقدي' }],
        operationalType: 'رسوم دراسية', against: `UAT isolation ${runId}`, costCenter: COST_CENTER, amount: 10 }),
    });
    assert(isolationReceipt.body.data.receipt.status === 'posted', 'isolation receipt was not posted');
    const crossStudentRetry = await api(`/api/financial/receipts/${encodeURIComponent(receiptIds[2])}/allocate`, {
      method: 'POST', body: JSON.stringify({ invoiceId: bulkInvoiceId, amount: 10 }),
    });
    assert(!crossStudentRetry.response.ok, 'cross-student allocation was unexpectedly accepted');
    completed.push('isolation: receipt for student A cannot be allocated to student B invoice');

    for (const receiptId of [receiptIds[2], receiptIds[1], receiptIds[0]]) {
      const reversed = await reverseReceipt(receiptId, `UAT reversal ${runId}`);
      assert(reversed.reversalJournalId, 'reversal journal was not returned');
      const replay = await reverseReceipt(receiptId, `UAT reversal ${runId}`);
      assert(replay.reversalJournalId === reversed.reversalJournalId, 'receipt reversal retry created a different reversal journal');
      const rows = await pool.query(
        `SELECT status, source_payload->>'reversalJournalId' AS reversal_journal_id
           FROM public.student_fee_receipts
          WHERE tenant_id = $1 AND school_id = $2 AND id = $3`, [tenantId, schoolId, receiptId]
      );
      assert(rows.rows[0]?.status === 'cancelled' && rows.rows[0]?.reversal_journal_id === reversed.reversalJournalId, 'receipt reversal is not persisted canonically');
      const allocationAudit = await pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE reversed_at IS NOT NULL AND reversal_journal_id = $4)::int AS reversed
           FROM public.student_fee_allocations
          WHERE tenant_id = $1 AND school_id = $2 AND receipt_id = $3`, [tenantId, schoolId, receiptId, reversed.reversalJournalId]
      );
      assert(Number(allocationAudit.rows[0]?.total || 0) === Number(allocationAudit.rows[0]?.reversed || 0), 'receipt allocation rows were not marked reversed');
    }
    account = await studentAccount(STUDENT_ID);
    primary = account.invoices.find((invoice: any) => invoice.id === primaryInvoiceId);
    assert(Number(primary?.paidAmount) === 0 && Number(primary?.remainingAmount) === 200, 'receipt reversals did not restore invoice balance');
    completed.push('reversal: partial/full receipts, allocations, invoice and installment balances, journal, and repeated reversal');

    const voidPrimary = await issueVoid(primaryInvoiceId, `UAT invoice cancellation ${runId}`);
    const voidSecond = await issueVoid(cancelInvoiceId, `UAT invoice cancellation ${runId}`);
    const voidBulk = await issueVoid(bulkInvoiceId, `UAT bulk invoice cancellation ${runId}`);
    assert(String(voidPrimary.invoice?.status).toLowerCase() === 'cancelled', 'paid-and-reversed invoice did not cancel');
    assert(String(voidSecond.invoice?.status).toLowerCase() === 'cancelled', 'invoice cancellation status was not canonical');
    assert(String(voidBulk.invoice?.status).toLowerCase() === 'cancelled', 'bulk invoice cancellation status was not canonical');
    completed.push('cancellation: fully reversed invoice, untouched invoice, and distributed invoice voided canonically');

    const studentAfter = await studentAccount(STUDENT_ID);
    const secondAfter = await studentAccount(SECOND_STUDENT_ID);
    assert(!studentAfter.invoices.some((invoice: any) => [primaryInvoiceId, cancelInvoiceId].includes(String(invoice.id)) && String(invoice.status).toLowerCase() !== 'cancelled'), 'cancelled invoice remains open');
    assert(!secondAfter.invoices.some((invoice: any) => String(invoice.id) === bulkInvoiceId && String(invoice.status).toLowerCase() !== 'cancelled'), 'cancelled bulk invoice remains open');
    completed.push('final account reads: cancelled demands are no longer open');
    console.log(JSON.stringify({ success: true, target: 'isolated staging', runId, completed }, null, 2));
  } catch (error) {
    // Best-effort compensating cleanup preserves staging balances even when a
    // later assertion fails. Reversals and voids are intentionally idempotent.
    const cleanupErrors: string[] = [];
    if (writesStarted) {
      try {
        // Discover by the run's collision-checked IDs so a lost HTTP response
        // after commit is still compensated, without treating conflicts as success.
        const receipts = await pool.query<{ id: string; status: string; reversalJournalId: string | null }>(
          `SELECT id, status, source_payload->>'reversalJournalId' AS "reversalJournalId"
             FROM public.student_fee_receipts
            WHERE tenant_id = $1 AND school_id = $2 AND id = ANY($3::text[])`,
          [tenantId, schoolId, receiptIds],
        );
        for (const receiptRow of receipts.rows) {
          const receiptId = String(receiptRow.id);
          if (String(receiptRow.status).toLowerCase() === 'cancelled' && receiptRow.reversalJournalId) continue;
          if (String(receiptRow.status).toLowerCase() !== 'posted') {
            cleanupErrors.push(`receipt:${receiptId}:unexpected-status:${receiptRow.status}`);
            continue;
          }
          try {
            const reversal = await api(`/api/financial/receipts/${encodeURIComponent(receiptId)}/reverse`, {
              method: 'POST', body: JSON.stringify({ reason: `UAT cleanup ${runId}` }),
            });
            if (!reversal.response.ok) {
              cleanupErrors.push(`receipt:${receiptId}:reverse:${reversal.response.status}`);
              continue;
            }
            const verified = await pool.query<{ status: string; reversalJournalId: string | null }>(
              `SELECT status, source_payload->>'reversalJournalId' AS "reversalJournalId"
                 FROM public.student_fee_receipts
                WHERE tenant_id = $1 AND school_id = $2 AND id = $3`,
              [tenantId, schoolId, receiptId],
            );
            if (String(verified.rows[0]?.status).toLowerCase() !== 'cancelled' || !verified.rows[0]?.reversalJournalId) {
              cleanupErrors.push(`receipt:${receiptId}:reversal-not-persisted`);
            }
          } catch { cleanupErrors.push(`receipt:${receiptId}:unreachable`); }
        }
      } catch { cleanupErrors.push('receipt-discovery:unreachable'); }
      try {
        const finance = await api('/api/financial/database');
        const candidateInvoices = (finance.body?.data?.invoices || []).filter((invoice: any) =>
          String(invoice.idempotencyKey || '').includes(runId) || String(invoice.id || '') === primaryInvoiceId || String(invoice.id || '') === cancelInvoiceId || String(invoice.id || '') === bulkInvoiceId
        );
        for (const invoice of candidateInvoices) {
          const status = String(invoice.status || '').toLowerCase();
          if (['cancelled', 'void', 'refunded', 'written_off'].includes(status)) continue;
          if (Number(invoice.paidAmount || 0) > 0) {
            cleanupErrors.push(`invoice:${invoice.id}:still-paid`);
            continue;
          }
          try {
            const response = await api(`/api/financial/invoices/${encodeURIComponent(invoice.id)}/void`, {
              method: 'POST', body: JSON.stringify({ reason: `UAT cleanup ${runId}` }),
            });
            if (!response.response.ok || !response.body?.success) {
              cleanupErrors.push(`invoice:${invoice.id}:void:${response.response.status}`);
              continue;
            }
            if (String(response.body.data?.invoice?.status || '').toLowerCase() !== 'cancelled') {
              cleanupErrors.push(`invoice:${invoice.id}:cancellation-not-persisted`);
            }
          } catch { cleanupErrors.push(`invoice:${invoice.id}:unreachable`); }
        }
      } catch { cleanupErrors.push('invoice-discovery:unreachable'); }
    }
    const errorMessage = error instanceof Error ? error.message : 'unknown';
    console.error(JSON.stringify({ success: false, target: 'isolated staging', runId, completed, error: errorMessage, cleanupErrors }, null, 2));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('STUDENT_FEES_STAGING_UAT_FAILED', error instanceof Error ? error.message : 'unknown');
  process.exitCode = 1;
});
