import 'dotenv/config';
import pg from 'pg';
import { CanonicalErpPostingService } from '../src/modules/financial/application/CanonicalErpPostingService.js';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const itemId = 'UAT-CLOSURE-ITEM-20260830';
const sourceIds = [
  'UAT-CLOSURE-GRN-20260830',
  'UAT-CLOSURE-BILL-20260830',
  'UAT-CLOSURE-MV-20260830',
  'UAT-CLOSURE-ST-20260830'
];

try {
  await client.connect();
  const actor = await client.query<{ id: string; tenant_id: string; school_id: string }>(
    `SELECT id, tenant_id, school_id
       FROM public.users
      WHERE status = $1 AND deleted_at IS NULL
      ORDER BY created_at
      LIMIT 1`,
    ['active']
  );
  if (!actor.rows[0]) throw new Error('No active UAT actor found.');

  const { id: actorId, tenant_id: tenantId, school_id: schoolId } = actor.rows[0];
  const payload = {
    chartOfAccounts: [{ code: '2102', nameAr: 'ذمم موردين UAT', nature: 'liability' }],
    items: [{ id: itemId, sku: itemId, name: 'UAT closure item', costPrice: 10 }],
    goodsReceipts: [{
      id: sourceIds[0],
      grnDate: '2026-08-30',
      grnNo: sourceIds[0],
      notes: 'UAT only',
      lines: [{ lineId: 'L1', itemId, acceptedQty: 2, totalCost: 20 }]
    }],
    vendorBills: [{
      id: sourceIds[1],
      status: 'approved',
      subtotal: 20,
      taxAmount: 0,
      billDate: '2026-08-30',
      billNo: sourceIds[1],
      notes: 'UAT only'
    }],
    movements: [{
      id: sourceIds[2],
      type: 'sale',
      status: 'approved',
      itemId,
      quantity: 1,
      totalAmount: 10,
      date: '2026-08-30',
      notes: 'UAT only'
    }],
    stocktakes: [{
      id: sourceIds[3],
      status: 'approved',
      itemId,
      bookQty: 2,
      actualQty: 3,
      date: '2026-08-30',
      notes: 'UAT only'
    }],
    settings: {},
    procurementSettings: { apGlAccount: '2102' }
  };

  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO public.erp_chart_of_accounts
        (tenant_id, school_id, account_code, account_name, account_nature, updated_by)
       VALUES ($1::uuid, $2::uuid, '2102', 'ذمم موردين UAT', 'liability', $3::uuid)
       ON CONFLICT (school_id, account_code) DO NOTHING`,
      [tenantId, schoolId, actorId]
    );
    const first = await CanonicalErpPostingService.syncInventoryProcurementSnapshot(
      client, tenantId, schoolId, actorId, payload
    );
    const second = await CanonicalErpPostingService.syncInventoryProcurementSnapshot(
      client, tenantId, schoolId, actorId, payload
    );
    const journals = await client.query<{
      source_type: string;
      source_id: string;
      total_debit: string;
      total_credit: string;
      status: string;
    }>(
      `SELECT source_type, source_id, total_debit, total_credit, status
         FROM public.erp_journal_entries
        WHERE school_id = $1 AND source_id = ANY($2::text[])
        ORDER BY source_id`,
      [schoolId, sourceIds]
    );
    const ledger = await client.query<{ count: number }>(
      `SELECT count(*)::int AS count
         FROM public.erp_general_ledger
        WHERE school_id = $1 AND source_id = ANY($2::text[])`,
      [schoolId, sourceIds]
    );
    const allBalanced = journals.rows.every(row => Number(row.total_debit) === Number(row.total_credit));
    if (first.createdJournalCount !== sourceIds.length || second.existingJournalCount !== sourceIds.length) {
      throw new Error('Idempotent journal creation check failed.');
    }
    if (journals.rows.length !== sourceIds.length || !allBalanced || Number(ledger.rows[0]?.count) !== 8) {
      throw new Error('Journal/ledger smoke check failed.');
    }
    console.log(JSON.stringify({
      status: 'passed',
      schoolId,
      firstSync: first,
      secondSync: second,
      journalCount: journals.rows.length,
      ledgerLineCount: Number(ledger.rows[0]?.count),
      allBalanced
    }, null, 2));
  } finally {
    await client.query('ROLLBACK');
  }

  const residual = await client.query<{ count: number }>(
    `SELECT count(*)::int AS count
       FROM public.erp_journal_entries
      WHERE school_id = $1 AND source_id = ANY($2::text[])`,
    [schoolId, sourceIds]
  );
  if (Number(residual.rows[0]?.count) !== 0) throw new Error('UAT rollback left residual journals.');
  console.log(JSON.stringify({ rollback: 'completed', residualJournalCount: Number(residual.rows[0]?.count) }));
} catch (error) {
  console.error(`UAT_SMOKE_FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
