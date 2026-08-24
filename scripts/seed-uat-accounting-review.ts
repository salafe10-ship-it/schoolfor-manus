import 'dotenv/config';
import pg from 'pg';
import { CanonicalErpPostingService } from '../src/modules/financial/application/CanonicalErpPostingService.js';

const CONFIRMATION = 'SEED_100_EXPENSES_20_ASSETS';
const schoolId = String(process.env.UAT_FINANCIAL_SEED_SCHOOL_ID || '').trim();
const actorId = String(process.env.UAT_FINANCIAL_SEED_ACTOR_ID || '').trim();
const tenantIdFromEnv = String(process.env.UAT_FINANCIAL_SEED_TENANT_ID || '').trim();
if (String(process.env.UAT_FINANCIAL_SEED_CONFIRM || '').trim() !== CONFIRMATION) {
  throw new Error(`Explicit confirmation is required: UAT_FINANCIAL_SEED_CONFIRM=${CONFIRMATION}`);
}
if (!schoolId || !actorId) throw new Error('UAT_FINANCIAL_SEED_SCHOOL_ID and UAT_FINANCIAL_SEED_ACTOR_ID are required.');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL or DIRECT_URL is required.');

type FinancialRecord = Record<string, any>;

const asDate = (base: string, offsetDays: number): string => {
  const date = new Date(`${base}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const account = (code: string, name: string, nature: string, type: 'رئيسي' | 'فرعي', parentAccountId?: string): FinancialRecord => ({
  id: code,
  code,
  name,
  nameAr: name,
  nameEn: code,
  nature,
  classification: nature,
  type,
  parentAccountId,
  level: type === 'رئيسي' ? 2 : 3,
  natureType: ['liability', 'equity', 'revenue'].includes(nature) ? 'دائن' : 'مدين',
  isActive: true,
  isLeaf: type === 'فرعي',
  balance: 0,
  currency: 'د.ل',
  notes: 'بيانات مراجعة UAT قابلة للتعديل والتعطيل مع حفظ السجل المحاسبي'
});

const REVIEW_ACCOUNTS: FinancialRecord[] = [
  account('1300', 'الأصول الثابتة والممتلكات', 'asset', 'رئيسي'),
  account('1310', 'الأثاث والتجهيزات المدرسية', 'asset', 'فرعي', '1300'),
  account('1320', 'أجهزة وتقنيات التعليم', 'asset', 'فرعي', '1300'),
  account('1330', 'مركبات وحافلات المدرسة', 'asset', 'فرعي', '1300'),
  account('1390', 'مجمع إهلاك الأصول الثابتة', 'asset', 'فرعي', '1300'),
  account('2100', 'الالتزامات والمصروفات المستحقة', 'liability', 'رئيسي'),
  account('2201', 'رواتب وأجور مستحقة', 'liability', 'فرعي', '2100'),
  account('2301', 'مصروفات تشغيلية مستحقة', 'liability', 'فرعي', '2100'),
  account('2401', 'دفعات مقدمة وأمانات الطلاب', 'liability', 'فرعي', '2100'),
  account('4100', 'إيرادات التعليم والخدمات المدرسية', 'revenue', 'رئيسي'),
  account('4201', 'إيرادات التسجيل والقبول', 'revenue', 'فرعي', '4100'),
  account('4301', 'إيرادات النقل المدرسي', 'revenue', 'فرعي', '4100'),
  account('5200', 'المصروفات العمومية والتشغيلية', 'expense', 'رئيسي'),
  account('5211', 'مصروف الكهرباء والطاقة', 'expense', 'فرعي', '5200'),
  account('5221', 'مصروف المياه والمرافق', 'expense', 'فرعي', '5200'),
  account('5231', 'مصروف الصيانة والترميم', 'expense', 'فرعي', '5200'),
  account('5241', 'مصروف الأنشطة والرياضة', 'expense', 'فرعي', '5200'),
  account('5251', 'مصروف التسويق والطباعة', 'expense', 'فرعي', '5200'),
  account('5261', 'مصروف الإيجار والخدمات', 'expense', 'فرعي', '5200'),
  account('5301', 'مصروف إهلاك الأصول الثابتة', 'expense', 'فرعي', '5200')
];

const expenseAccountCodes = ['5211', '5221', '5231', '5241', '5251', '5261', '5270'];
const assetAccountCodes = ['1310', '1320', '1330'];
const reviewSchoolStages = ['kindergarten', 'primary', 'middle', 'secondary'];

function mergeById(existing: FinancialRecord[], additions: FinancialRecord[]): FinancialRecord[] {
  const map = new Map(existing.map(row => [String(row.id || ''), row]));
  for (const row of additions) {
    const id = String(row.id || '');
    if (!id || !map.has(id)) map.set(id, row);
  }
  return [...map.values()];
}

function mergeAccounts(existing: FinancialRecord[], additions: FinancialRecord[]): FinancialRecord[] {
  const map = new Map(existing.map(row => [String(row.code || row.id || ''), row]));
  for (const row of additions) {
    const code = String(row.code || row.id || '');
    if (code && !map.has(code)) map.set(code, row);
  }
  return [...map.values()];
}

function buildExpenseVouchers(existing: FinancialRecord[]): FinancialRecord[] {
  const rows: FinancialRecord[] = [];
  const existingIds = new Set(existing.map(row => String(row.id || '')));
  for (let index = 1; index <= 100; index += 1) {
    const id = `UAT-EXP-PV-${String(index).padStart(3, '0')}`;
    if (existingIds.has(id)) continue;
    const amount = 25 + (index % 5) * 5;
    const date = asDate('2026-06-01', (index - 1) % 85);
    const expenseAccount = expenseAccountCodes[(index - 1) % expenseAccountCodes.length];
    const schoolStage = reviewSchoolStages[(index - 1) % reviewSchoolStages.length];
    rows.push({
      id,
      date,
      amount,
      beneficiary: 'مورد مراجعة مصروفات UAT',
      against: `مصروف مراجعة UAT رقم ${String(index).padStart(3, '0')} ممول من متحصلات رسوم الطلاب`,
      paidFromAccount: '1101',
      paidToAccount: expenseAccount,
      expenseAccount,
      status: 'posted',
      paymentMethod: 'نقدي',
      user: 'School Owner UAT',
      financialPeriod: 'السنة المالية 2026',
      notes: 'سند صرف اختباري قابل للمراجعة والتعديل ضمن بيئة UAT',
      source: 'student_fee_collections',
      fundingSource: 'تحصيل رسوم الطلاب',
      schoolStage,
      costCenter: 'Main UAT-B Branch',
      reference: `FEE-FUNDED-EXP-${String(index).padStart(3, '0')}`,
      createdAt: `${date}T09:00:00.000Z`
    });
  }
  return rows;
}

function normalizeReviewVouchers(existing: FinancialRecord[]): FinancialRecord[] {
  return existing.map(row => {
    const id = String(row.id || '');
    if (!id.startsWith('UAT-EXP-PV-')) return row;
    const serial = Number(id.match(/(\d+)$/)?.[1] || 1);
    return {
      ...row,
      beneficiary: String(row.beneficiary || 'مورد مراجعة مصروفات UAT'),
      paidToAccount: String(row.paidToAccount || row.expenseAccount || '5270'),
      paymentMethod: String(row.paymentMethod || 'نقدي'),
      user: String(row.user || 'School Owner UAT'),
      financialPeriod: String(row.financialPeriod || 'السنة المالية 2026'),
      notes: String(row.notes || 'سند صرف اختباري قابل للمراجعة والتعديل ضمن بيئة UAT'),
      schoolStage: String(row.schoolStage || reviewSchoolStages[(serial - 1) % reviewSchoolStages.length]),
      costCenter: String(row.costCenter || 'Main UAT-B Branch')
    };
  });
}

function buildAssets(existing: FinancialRecord[]): { assets: FinancialRecord[]; journals: FinancialRecord[] } {
  const existingIds = new Set(existing.map(row => String(row.id || '')));
  const assets: FinancialRecord[] = [];
  const journals: FinancialRecord[] = [];
  for (let index = 1; index <= 20; index += 1) {
    const serial = String(index).padStart(3, '0');
    const id = `UAT-FA-${serial}`;
    if (existingIds.has(id)) continue;
    const cost = 150 + (index % 4) * 25;
    const usefulLife = 5;
    const annualDepreciation = Number((cost / usefulLife).toFixed(2));
    const purchaseDate = asDate('2026-06-01', (index - 1) % 65);
    const assetAccount = assetAccountCodes[(index - 1) % assetAccountCodes.length];
    const category = assetAccount === '1310' ? 'أثاث وتجهيزات' : assetAccount === '1320' ? 'تقنيات تعليمية' : 'مركبات ونقل';
    assets.push({
      id,
      code: `FA-UAT-${serial}`,
      barcode: `UAT-BAR-${serial}`,
      name: `${category} مراجعة UAT رقم ${serial}`,
      category,
      group: 'أصول اختبار الإنتاج المالي',
      manufacturer: 'EduPro UAT Supplier',
      model: `UAT-${serial}`,
      serialNo: `SN-UAT-${serial}`,
      purchaseDate,
      supplier: 'مورد مراجعة مالي UAT',
      invoiceNo: `UAT-INV-${serial}`,
      cost,
      capitalExp: 0,
      scrapValue: 0,
      usefulLife,
      depRate: '20%',
      depMethod: 'قسط ثابت',
      depStartDate: purchaseDate,
      assetAccount,
      accDepAccount: '1390',
      depExpenseAccount: '5301',
      accDep: annualDepreciation,
      netValue: Number((cost - annualDepreciation).toFixed(2)),
      isDepPaused: false,
      status: 'نشط / قيد التشغيل',
      department: 'الإدارة المدرسية',
      branch: 'Main UAT-B Branch',
      location: 'المبنى الرئيسي',
      responsible: 'School Owner UAT',
      depreciationPostings: [{ year: 2026, amount: annualDepreciation, journalId: `UAT-FA-DEP-${serial}`, status: 'posted' }],
      depreciationHistory: [{
        id: `UAT-FA-DEP-H-${serial}`,
        periodDate: '2026-08-24',
        fiscalYear: '2026',
        depreciationAmount: annualDepreciation,
        accumulatedDepreciationAfter: annualDepreciation,
        bookValueAfter: Number((cost - annualDepreciation).toFixed(2)),
        jvNumber: `UAT-FA-DEP-${serial}`,
        postedAt: '2026-08-24T09:30:00.000Z',
        postedBy: 'School Owner UAT'
      }],
      timeline: [{
        id: `UAT-FA-TL-${serial}`,
        timestamp: '2026-08-24T09:00:00.000Z',
        type: 'creation',
        title: 'إضافة أصل ثابت',
        description: 'أصل اختبار مالي موثق ضمن مراجعة UAT',
        user: 'School Owner UAT'
      }],
      createdAt: `${purchaseDate}T09:00:00.000Z`,
      updatedAt: '2026-08-24T09:30:00.000Z'
    });

    const additionId = `UAT-FA-ADD-${serial}`;
    const depreciationId = `UAT-FA-DEP-${serial}`;
    journals.push({
      id: additionId,
      date: purchaseDate,
      description: `إضافة أصل ثابت ${id} ممولة من متحصلات رسوم الطلاب`,
      status: 'posted',
      type: 'بسيط',
      sourceType: 'journal_entry',
      fixedAssetId: id,
      debitTotal: cost,
      creditTotal: cost,
      totalDebit: cost,
      totalCredit: cost,
      lines: [
        { id: `${additionId}-D`, accountCode: assetAccount, accountName: category, debit: cost, credit: 0, costCenter: 'Main UAT-B Branch' },
        { id: `${additionId}-C`, accountCode: '1101', accountName: 'صندوق النقدية والخزينة', debit: 0, credit: cost, costCenter: 'Main UAT-B Branch' }
      ],
      createdAt: `${purchaseDate}T09:00:00.000Z`
    });
    journals.push({
      id: depreciationId,
      date: '2026-08-24',
      description: `ترحيل إهلاك أصل ثابت ${id} للسنة المالية 2026`,
      status: 'posted',
      type: 'بسيط',
      sourceType: 'journal_entry',
      fixedAssetId: id,
      isSystemGenerated: true,
      debitTotal: annualDepreciation,
      creditTotal: annualDepreciation,
      totalDebit: annualDepreciation,
      totalCredit: annualDepreciation,
      lines: [
        { id: `${depreciationId}-D`, accountCode: '5301', accountName: 'مصروف إهلاك الأصول الثابتة', debit: annualDepreciation, credit: 0, costCenter: 'Main UAT-B Branch' },
        { id: `${depreciationId}-C`, accountCode: '1390', accountName: 'مجمع إهلاك الأصول الثابتة', debit: 0, credit: annualDepreciation, costCenter: 'Main UAT-B Branch' }
      ],
      createdAt: '2026-08-24T09:30:00.000Z'
    });
  }
  return { assets, journals };
}

const pool = new pg.Pool({
  connectionString,
  max: 1,
  ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false }
});

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const school = await client.query<{ tenant_id: string }>(
      `SELECT tenant_id::text AS tenant_id FROM public.schools WHERE id = $1::uuid`, [schoolId]
    );
    const tenantId = tenantIdFromEnv || school.rows[0]?.tenant_id;
    if (!tenantId) throw new Error(`School was not found: ${schoolId}`);

    const actor = await client.query<{ id: string }>(
      `SELECT id::text AS id FROM public.users
        WHERE id = $1::uuid AND tenant_id = $2::uuid AND school_id = $3::uuid
          AND status = 'active' AND deleted_at IS NULL`, [actorId, tenantId, schoolId]
    );
    const databaseActorId = actor.rows[0]?.id;
    if (!databaseActorId) throw new Error('The trusted UAT actor is not active in the requested school scope.');
    await client.query(`SELECT set_config('app.tenant_id', $1, true), set_config('app.school_id', $2, true), set_config('app.user_id', $3, true)`, [tenantId, schoolId, databaseActorId]);

    const snapshot = await client.query<{ data: FinancialRecord; version: number }>(
      `SELECT data, version FROM public.financial_portal_snapshots WHERE tenant_id = $1::uuid AND school_id = $2::uuid FOR UPDATE`, [tenantId, schoolId]
    );
    const current = snapshot.rows[0];
    if (!current) throw new Error('No financial portal snapshot exists for the requested school.');
    const payload = current.data || {};
    const currentAccounts = Array.isArray(payload.chartOfAccounts) ? payload.chartOfAccounts : [];
    const currentVouchers = normalizeReviewVouchers(Array.isArray(payload.paymentVouchers) ? payload.paymentVouchers : []);
    const currentAssets = Array.isArray(payload.fixedAssets) ? payload.fixedAssets : [];
    const currentJournals = Array.isArray(payload.journalEntries) ? payload.journalEntries : [];
    const expenseVouchers = buildExpenseVouchers(currentVouchers);
    const assetBuild = buildAssets(currentAssets);
    const nextPayload = {
      ...payload,
      chartOfAccounts: mergeAccounts(currentAccounts, REVIEW_ACCOUNTS),
      paymentVouchers: mergeById(currentVouchers, expenseVouchers),
      fixedAssets: mergeById(currentAssets, assetBuild.assets),
      journalEntries: mergeById(currentJournals, assetBuild.journals)
    };
    const nextVersion = Number(current.version || 0) + 1;
    await client.query(
      `UPDATE public.financial_portal_snapshots
          SET data = $1::jsonb, version = $2, updated_at = now(), updated_by = $3::uuid
        WHERE tenant_id = $4::uuid AND school_id = $5::uuid`,
      [JSON.stringify(nextPayload), nextVersion, databaseActorId, tenantId, schoolId]
    );

    const transaction = {
      query: async <Row extends Record<string, unknown> = Record<string, unknown>>(sqlText: string, parameters: readonly unknown[] = []) => {
        const result = await client.query<Row>(sqlText, [...parameters]);
        return { rows: result.rows, rowCount: result.rowCount ?? 0 };
      }
    };
    const sync = await CanonicalErpPostingService.syncSnapshot(transaction, tenantId, schoolId, databaseActorId, nextPayload);
    const verification = await client.query<{ vouchers: string; assets: string; expenses: string; additions: string; depreciation: string; journals: string; debit: string; credit: string }>(
      `SELECT
        (SELECT COUNT(*) FROM public.financial_portal_snapshots s, jsonb_array_elements(COALESCE(s.data->'paymentVouchers','[]'::jsonb)) v WHERE s.school_id = $1::uuid AND v->>'id' LIKE 'UAT-EXP-PV-%')::text AS vouchers,
        (SELECT COUNT(*) FROM public.financial_portal_snapshots s, jsonb_array_elements(COALESCE(s.data->'fixedAssets','[]'::jsonb)) a WHERE s.school_id = $1::uuid AND a->>'id' LIKE 'UAT-FA-%')::text AS assets,
        (SELECT COUNT(*) FROM public.erp_journal_entries WHERE school_id = $1::uuid AND source_type = 'payment_voucher' AND source_id LIKE 'UAT-EXP-PV-%')::text AS expenses,
        (SELECT COUNT(*) FROM public.erp_journal_entries WHERE school_id = $1::uuid AND source_id LIKE 'UAT-FA-ADD-%')::text AS additions,
        (SELECT COUNT(*) FROM public.erp_journal_entries WHERE school_id = $1::uuid AND source_id LIKE 'UAT-FA-DEP-%')::text AS depreciation,
        (SELECT COUNT(*) FROM public.erp_journal_entries WHERE school_id = $1::uuid)::text AS journals,
        (SELECT COALESCE(SUM(total_debit),0)::numeric(14,2)::text FROM public.erp_journal_entries WHERE school_id = $1::uuid)::text AS debit,
        (SELECT COALESCE(SUM(total_credit),0)::numeric(14,2)::text FROM public.erp_journal_entries WHERE school_id = $1::uuid)::text AS credit`, [schoolId]
    );
    await client.query(
      `INSERT INTO public.erp_financial_audit_events
        (tenant_id, school_id, operation, entity_type, entity_id, actor_user_id, after_payload)
       VALUES ($1::uuid, $2::uuid, 'UAT_FINANCIAL_REVIEW_SEED', 'financial_review_batch', $3, $4::uuid, $5::jsonb)`,
      [tenantId, schoolId, `UAT-REVIEW-${nextVersion}`, databaseActorId, JSON.stringify({ requestedExpenses: 100, requestedAssets: 20, addedExpenseVouchers: expenseVouchers.length, addedAssets: assetBuild.assets.length, addedAssetJournals: assetBuild.journals.length, sync })]
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ success: true, version: nextVersion, addedExpenseVouchers: expenseVouchers.length, addedAssets: assetBuild.assets.length, addedAssetJournals: assetBuild.journals.length, sync, verification: verification.rows[0] }));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
