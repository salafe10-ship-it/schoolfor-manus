import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';

export const CANONICAL_ERP_TABLES = [
  'erp_chart_of_accounts',
  'erp_account_mappings',
  'erp_journal_entries',
  'erp_journal_lines',
  'erp_general_ledger',
  'erp_expense_accruals',
  'erp_financial_audit_events',
  'erp_financial_periods'
] as const;

type FinancialRow = Record<string, unknown>;
type PostingSource = 'student_fee_invoice' | 'student_receipt' | 'payment_voucher' | 'expense_accrual' | 'journal_entry'
  | 'inventory_receipt' | 'inventory_movement' | 'inventory_stocktake' | 'vendor_bill';
type TransactionLike = Pick<TransactionSession, 'query'>;

export type CanonicalPostingLine = {
  id: string;
  accountCode: string;
  accountName?: string;
  debit: number;
  credit: number;
  costCenter?: string;
};

export type CanonicalPostingDocument = {
  sourceType: PostingSource;
  sourceId: string;
  date: string;
  description: string;
  lines: CanonicalPostingLine[];
  fiscalPeriod?: string;
  expenseAccrual?: {
    supplierName: string;
    amount: number;
    expenseAccount: string;
    payableAccount: string;
    status: 'accrued' | 'settled' | 'cancelled';
  };
};

export type CanonicalErpSyncResult = {
  createdJournalCount: number;
  existingJournalCount: number;
  ledgerLineCount: number;
  expenseAccrualCount: number;
  sourceLinks: Array<{ sourceType: PostingSource; sourceId: string; journalEntryId: string }>;
};

export type CanonicalErpReadModel = {
  journalEntries: Array<Record<string, unknown>>;
  ledgerEntries: Array<Record<string, unknown>>;
  chartOfAccounts: Array<Record<string, unknown>>;
  expenseAccruals: Array<Record<string, unknown>>;
  sourceLinks: Array<{ sourceType: string; sourceId: string; journalEntryId: string }>;
};

const DEFAULT_MAPPING: Record<string, string> = {
  'student_fees.receivable': '1201',
  'student_fees.revenue': '4101',
  'treasury.cash': '1101',
  'expenses.default': '5270',
  'liabilities.accrued_expense': '2101',
  'inventory.asset': '1301',
  'inventory.grni': '2101',
  'inventory.ap': '2101',
  'inventory.cogs': '5270',
  'inventory.adjustment': '5280',
  'inventory.input_vat': '1401'
};

const DEFAULT_ACCOUNTS: Array<{ code: string; name: string; nature: string }> = [
  { code: '1101', name: 'صندوق النقدية والخزينة', nature: 'asset' },
  { code: '1201', name: 'ذمم الطلاب المدينة', nature: 'asset' },
  { code: '1301', name: 'مخزون وأصناف تشغيلية', nature: 'asset' },
  { code: '1401', name: 'ضريبة مدخلات قابلة للاسترداد', nature: 'asset' },
  { code: '2101', name: 'مصروفات مستحقة والتزامات موردين', nature: 'liability' },
  { code: '4101', name: 'إيرادات الرسوم الدراسية', nature: 'revenue' },
  { code: '5270', name: 'تكلفة الأصناف المصروفة', nature: 'expense' },
  { code: '5280', name: 'فروقات وتسويات المخزون', nature: 'expense' }
];

function rowValue(row: FinancialRow, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function textValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (value === undefined || value === null) return fallback;
  return String(value).trim() || fallback;
}

function positiveAmount(value: unknown, field: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`القيمة المالية للحقل ${field} يجب أن تكون أكبر من صفر.`);
  }
  return Number(amount.toFixed(2));
}

function dateValue(value: unknown): string {
  const date = textValue(value, new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`التاريخ المالي غير صالح: ${date}`);
  return date;
}

function fiscalPeriodFor(date: string): string {
  return date.slice(0, 7);
}

function normalizedStatus(value: unknown, fallback = 'draft'): string {
  const status = textValue(value, fallback).toLowerCase();
  if (['مرحّل', 'مُرحّل', 'مرحل', 'posted'].includes(status)) return 'posted';
  if (['معتمد', 'approved'].includes(status)) return 'approved';
  if (['مستحق', 'accrued', 'accrual'].includes(status)) return 'accrued';
  if (['مسدد', 'settled', 'paid'].includes(status)) return 'settled';
  if (['ملغى', 'ملغي', 'cancelled', 'void'].includes(status)) return 'cancelled';
  return status;
}

function normalizedNature(row: FinancialRow): string {
  const raw = textValue(rowValue(row, 'nature', 'accountNature', 'accountType', 'classification')).toLowerCase();
  if (['asset', 'assets', 'أصول'].includes(raw)) return 'asset';
  if (['liability', 'liabilities', 'خصوم'].includes(raw)) return 'liability';
  if (['equity', 'حقوق ملكية'].includes(raw)) return 'equity';
  if (['revenue', 'revenues', 'income', 'إيرادات'].includes(raw)) return 'revenue';
  if (['expense', 'expenses', 'مصروفات', 'مصروف'].includes(raw)) return 'expense';
  return 'asset';
}

function mappingValue(mappings: Map<string, string>, key: string, row: FinancialRow, rowKeys: string[], fallback: string): string {
  const explicit = textValue(rowValue(row, ...rowKeys));
  return explicit || mappings.get(key) || DEFAULT_MAPPING[key] || fallback;
}

function balanced(lines: CanonicalPostingLine[]): void {
  const debit = Number(lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2));
  const credit = Number(lines.reduce((sum, line) => sum + line.credit, 0).toFixed(2));
  if (debit <= 0 || debit !== credit) {
    throw new Error(`المستند المالي غير متوازن: المدين ${debit} والدائن ${credit}.`);
  }
}

/**
 * Pure source-to-journal mapping. Every ERP module can provide explicit
 * account codes; mappings are only fallbacks and are school-configurable.
 */
export function buildCanonicalPosting(
  sourceType: PostingSource,
  input: FinancialRow,
  mappings: Map<string, string> = new Map()
): CanonicalPostingDocument | null {
  const sourceId = textValue(rowValue(input, 'id', 'sourceId'));
  if (!sourceId) throw new Error(`المستند المالي من نوع ${sourceType} يفتقد معرفًا ثابتًا.`);

  if (sourceType === 'student_fee_invoice') {
    const status = normalizedStatus(rowValue(input, 'status'), 'unpaid');
    if (['draft', 'cancelled', 'void'].includes(status)) return null;
    const amount = positiveAmount(rowValue(input, 'totalAmount', 'amount'), 'invoice.amount');
    const receivable = mappingValue(mappings, 'student_fees.receivable', input, ['receivableAccount', 'debitAccount'], '1201');
    const revenue = mappingValue(mappings, 'student_fees.revenue', input, ['revenueAccount', 'creditAccount', 'account'], '4101');
    const lines = [
      { id: `${sourceId}-D`, accountCode: receivable, debit: amount, credit: 0, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined },
      { id: `${sourceId}-C`, accountCode: revenue, debit: 0, credit: amount, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined }
    ];
    balanced(lines);
    return {
      sourceType,
      sourceId,
      date: dateValue(rowValue(input, 'invoiceDate', 'date')),
      description: textValue(rowValue(input, 'item', 'description'), `إثبات رسوم الطالب ${sourceId}`),
      fiscalPeriod: fiscalPeriodFor(dateValue(rowValue(input, 'invoiceDate', 'date'))),
      lines
    };
  }

  if (sourceType === 'student_receipt') {
    if (normalizedStatus(rowValue(input, 'status')) !== 'posted') return null;
    const amount = positiveAmount(rowValue(input, 'amount'), 'receipt.amount');
    const cash = mappingValue(mappings, 'treasury.cash', input, ['receivingAccount', 'accountId', 'debitAccount'], '1101');
    const receivable = mappingValue(mappings, 'student_fees.receivable', input, ['receivableAccount', 'creditAccount'], '1201');
    const lines = [
      { id: `${sourceId}-D`, accountCode: cash, debit: amount, credit: 0, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined },
      { id: `${sourceId}-C`, accountCode: receivable, debit: 0, credit: amount, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined }
    ];
    balanced(lines);
    return {
      sourceType,
      sourceId,
      date: dateValue(rowValue(input, 'date', 'receiptDate')),
      description: textValue(rowValue(input, 'against', 'description'), `تحصيل رسوم الطالب ${sourceId}`),
      fiscalPeriod: fiscalPeriodFor(dateValue(rowValue(input, 'date', 'receiptDate'))),
      lines
    };
  }

  if (sourceType === 'expense_accrual') {
    const status = normalizedStatus(rowValue(input, 'status'), 'accrued');
    if (['draft', 'cancelled', 'void'].includes(status)) return null;
    const amount = positiveAmount(rowValue(input, 'totalAmount', 'amount'), 'expenseAccrual.amount');
    const expenseAccount = mappingValue(mappings, 'expenses.default', input, ['expenseAccount', 'debitAccount', 'accountCode'], '5270');
    const payableAccount = mappingValue(mappings, 'liabilities.accrued_expense', input, ['payableAccount', 'creditAccount'], '2101');
    const lines = [
      { id: `${sourceId}-D`, accountCode: expenseAccount, debit: amount, credit: 0, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined },
      { id: `${sourceId}-C`, accountCode: payableAccount, debit: 0, credit: amount, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined }
    ];
    balanced(lines);
    return {
      sourceType,
      sourceId,
      date: dateValue(rowValue(input, 'accrualDate', 'date')),
      description: textValue(rowValue(input, 'description', 'against'), `إثبات مصروف مستحق ${sourceId}`),
      fiscalPeriod: fiscalPeriodFor(dateValue(rowValue(input, 'accrualDate', 'date'))),
      lines,
      expenseAccrual: {
        supplierName: textValue(rowValue(input, 'supplierName', 'supplier', 'beneficiary')),
        amount,
        expenseAccount,
        payableAccount,
        status: status === 'settled' ? 'settled' : 'accrued'
      }
    };
  }

  if (sourceType === 'journal_entry') {
    const status = normalizedStatus(rowValue(input, 'status'));
    if (!['posted', 'approved'].includes(status)) return null;
    const rawLines = Array.isArray(input.lines)
      ? input.lines
      : (Array.isArray(input.items) ? input.items : []);
    const lines = rawLines.map((rawLine, index) => {
      if (!rawLine || typeof rawLine !== 'object' || Array.isArray(rawLine)) {
        throw new Error(`سطر القيد ${sourceId} غير صالح.`);
      }
      const line = rawLine as FinancialRow;
      const accountCode = textValue(rowValue(line, 'accountCode', 'accountId', 'code'));
      const debit = Number(rowValue(line, 'debit') || 0);
      const credit = Number(rowValue(line, 'credit') || 0);
      if (!accountCode || !Number.isFinite(debit) || !Number.isFinite(credit)
        || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new Error(`سطر القيد ${sourceId} رقم ${index + 1} غير صالح أو يحمل طرفي القيد معًا.`);
      }
      return {
        id: textValue(rowValue(line, 'id', 'lineId'), `${sourceId}-line-${index + 1}`),
        accountCode,
        accountName: textValue(rowValue(line, 'accountName', 'name')) || undefined,
        debit: Number(debit.toFixed(2)),
        credit: Number(credit.toFixed(2)),
        costCenter: textValue(rowValue(line, 'costCenter', 'costCenterId')) || undefined
      };
    });
    if (lines.length < 2) throw new Error(`القيد ${sourceId} يجب أن يحتوي على سطرين ماليين على الأقل.`);
    balanced(lines);
    return {
      sourceType,
      sourceId,
      date: dateValue(rowValue(input, 'date', 'entryDate')),
      description: textValue(rowValue(input, 'description', 'memo'), `قيد يومية ${sourceId}`),
      fiscalPeriod: fiscalPeriodFor(dateValue(rowValue(input, 'date', 'entryDate'))),
      lines
    };
  }

  if (['inventory_receipt', 'inventory_movement', 'inventory_stocktake', 'vendor_bill'].includes(sourceType)) {
    throw new Error(`مصدر ${sourceType} يتطلب مسار مزامنة المخزون والمشتريات الكانوني.`);
  }

  const status = normalizedStatus(rowValue(input, 'status'));
  if (status !== 'posted') return null;
  const amount = positiveAmount(rowValue(input, 'amount', 'totalAmount'), 'paymentVoucher.amount');
  const expenseAccount = mappingValue(mappings, 'expenses.default', input, ['paidToAccount', 'expenseAccount', 'debitAccount'], '5270');
  const cash = mappingValue(mappings, 'treasury.cash', input, ['paidFromAccount', 'accountId', 'creditAccount'], '1101');
  const lines = [
    { id: `${sourceId}-D`, accountCode: expenseAccount, debit: amount, credit: 0, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined },
    { id: `${sourceId}-C`, accountCode: cash, debit: 0, credit: amount, costCenter: textValue(rowValue(input, 'costCenter', 'costCenterId')) || undefined }
  ];
  balanced(lines);
  return {
    sourceType,
    sourceId,
    date: dateValue(rowValue(input, 'date', 'paymentDate')),
    description: textValue(rowValue(input, 'against', 'description'), `سداد مصروف ${sourceId}`),
    fiscalPeriod: fiscalPeriodFor(dateValue(rowValue(input, 'date', 'paymentDate'))),
    lines
  };
}

function db(transaction: TransactionLike): TransactionLike {
  return transaction;
}

export class CanonicalErpPostingService {
  public static async isProvisioned(transaction: TransactionLike): Promise<boolean> {
    const result = await db(transaction).query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [CANONICAL_ERP_TABLES]
    );
    const available = new Set(result.rows.map(row => row.table_name));
    return CANONICAL_ERP_TABLES.every(table => available.has(table));
  }

  private static async loadMappings(transaction: TransactionLike, schoolId: string): Promise<Map<string, string>> {
    const result = await db(transaction).query<{ mapping_key: string; account_code: string }>(
      `SELECT mapping_key, account_code
         FROM public.erp_account_mappings
        WHERE school_id = $1 AND is_active = true`,
      [schoolId]
    );
    return new Map(result.rows.map(row => [row.mapping_key, row.account_code]));
  }

  private static async ensureChartAccounts(
    transaction: TransactionLike,
    tenantId: string,
    schoolId: string,
    actorId: string,
    payload: FinancialRow
  ): Promise<void> {
    for (const account of DEFAULT_ACCOUNTS) {
      await db(transaction).query(
        `INSERT INTO public.erp_chart_of_accounts
          (tenant_id, school_id, account_code, account_name, account_nature, updated_by)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::uuid)
         ON CONFLICT (school_id, account_code) DO NOTHING`,
        [tenantId, schoolId, account.code, account.name, account.nature, actorId]
      );
    }

    const chart = Array.isArray(payload.chartOfAccounts) ? payload.chartOfAccounts : [];
    for (const raw of chart) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      const account = raw as FinancialRow;
      const code = textValue(rowValue(account, 'code', 'accountCode', 'id'));
      const name = textValue(rowValue(account, 'nameAr', 'name', 'nameEn'), code);
      if (!code || !name) continue;
      await db(transaction).query(
        `INSERT INTO public.erp_chart_of_accounts
          (tenant_id, school_id, account_code, account_name, account_nature, is_active, is_leaf, updated_by)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::uuid)
         ON CONFLICT (school_id, account_code) DO UPDATE SET
           account_name = EXCLUDED.account_name,
           account_nature = EXCLUDED.account_nature,
           is_active = EXCLUDED.is_active,
           is_leaf = EXCLUDED.is_leaf,
           updated_at = now(),
           updated_by = EXCLUDED.updated_by`,
        [tenantId, schoolId, code, name, normalizedNature(account), account.isActive !== false, account.type ? textValue(account.type) !== 'رئيسي' : true, actorId]
      );
    }
  }

  private static async ensureExpenseAccrual(
    transaction: TransactionLike,
    tenantId: string,
    schoolId: string,
    actorId: string,
    document: CanonicalPostingDocument
  ): Promise<void> {
    if (!document.expenseAccrual) return;
    const accrual = document.expenseAccrual;
    await db(transaction).query(
      `INSERT INTO public.erp_expense_accruals
        (tenant_id, school_id, id, accrual_date, description, supplier_name, amount,
         expense_account, payable_account, status, idempotency_key, created_by)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::uuid)
       ON CONFLICT (school_id, id) DO UPDATE SET
         status = EXCLUDED.status,
         expense_account = EXCLUDED.expense_account,
         payable_account = EXCLUDED.payable_account`,
      [tenantId, schoolId, document.sourceId, document.date, document.description, accrual.supplierName,
        accrual.amount, accrual.expenseAccount, accrual.payableAccount, accrual.status,
        `expense_accrual:${document.sourceId}`, actorId]
    );
  }

  private static async postDocument(
    transaction: TransactionLike,
    tenantId: string,
    schoolId: string,
    actorId: string,
    document: CanonicalPostingDocument
  ): Promise<{ created: boolean; ledgerLines: number; journalEntryId: string }> {
    const journalEntryId = `ERP-JV-${document.sourceType}-${document.sourceId}`;
    const idempotencyKey = `${document.sourceType}:${document.sourceId}`;
    const debitTotal = Number(document.lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2));
    const creditTotal = Number(document.lines.reduce((sum, line) => sum + line.credit, 0).toFixed(2));
    const fiscalPeriod = document.fiscalPeriod || fiscalPeriodFor(document.date);
    const period = await db(transaction).query<{ status: string }>(
      `SELECT status FROM public.erp_financial_periods
        WHERE tenant_id = $1::uuid AND school_id = $2::uuid
          AND period_code = $3 AND starts_on <= $4::date AND ends_on >= $4::date
        FOR UPDATE`,
      [tenantId, schoolId, fiscalPeriod, document.date]
    );
    if (!period.rows[0]) throw new Error(`الفترة المالية ${fiscalPeriod} غير معرفة للمدرسة.`);
    if (period.rows[0].status !== 'open') throw new Error(`الفترة المالية ${fiscalPeriod} مغلقة ولا تقبل الترحيل.`);
    const existing = await db(transaction).query<{ id: string; total_debit: string | number; total_credit: string | number }>(
      `SELECT id, total_debit, total_credit
         FROM public.erp_journal_entries
        WHERE school_id = $1 AND idempotency_key = $2
        FOR UPDATE`,
      [schoolId, idempotencyKey]
    );
    if (existing.rows[0]) {
      if (Number(existing.rows[0].total_debit) !== debitTotal || Number(existing.rows[0].total_credit) !== creditTotal) {
        throw new Error(`تعارض تكرار: المستند ${document.sourceId} سبق ترحيله بقيمة مختلفة.`);
      }
      const existingLines = await db(transaction).query<{ account_code: string; debit: string | number; credit: string | number }>(
        `SELECT account_code, debit, credit FROM public.erp_journal_lines
          WHERE school_id = $1 AND journal_entry_id = $2 ORDER BY account_code`,
        [schoolId, existing.rows[0].id]
      );
      const expectedLines = [...document.lines].sort((a, b) => a.accountCode.localeCompare(b.accountCode));
      const linesMatch = existingLines.rows.length === expectedLines.length
        && existingLines.rows.every((line, index) => line.account_code === expectedLines[index].accountCode
          && Number(line.debit) === expectedLines[index].debit
          && Number(line.credit) === expectedLines[index].credit);
      if (!linesMatch) {
        throw new Error(`تعارض ترحيل: المستند ${document.sourceId} مرتبط بقيد قديم غير مطابق لقاعدة الذمم الكانونية.`);
      }
      return { created: false, ledgerLines: 0, journalEntryId: existing.rows[0].id };
    }

    await db(transaction).query(
      `INSERT INTO public.erp_journal_entries
        (tenant_id, school_id, id, entry_date, description, source_type, source_id,
         fiscal_period, idempotency_key, total_debit, total_credit, created_by)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::uuid)`,
      [tenantId, schoolId, journalEntryId, document.date, document.description, document.sourceType,
        document.sourceId, fiscalPeriod, idempotencyKey, debitTotal, creditTotal, actorId]
    );

    const orderedLines = [...document.lines].sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    for (const line of orderedLines) {
      const account = await db(transaction).query<{ account_name: string; account_nature: string; is_active: boolean; is_leaf: boolean }>(
        `SELECT account_name, account_nature, is_active, is_leaf
           FROM public.erp_chart_of_accounts
          WHERE school_id = $1 AND account_code = $2
          FOR UPDATE`,
        [schoolId, line.accountCode]
      );
      const accountRow = account.rows[0];
      if (!accountRow) throw new Error(`الحساب ${line.accountCode} غير موجود في دليل الحسابات.`);
      if (!accountRow.is_active) throw new Error(`الحساب ${line.accountCode} غير نشط.`);
      if (!accountRow.is_leaf) throw new Error(`الحساب ${line.accountCode} تجميعي ولا يقبل الترحيل المباشر.`);

      await db(transaction).query(
        `INSERT INTO public.erp_journal_lines
          (tenant_id, school_id, journal_entry_id, id, account_code, account_name, debit, credit, cost_center)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9)`,
        [tenantId, schoolId, journalEntryId, line.id, line.accountCode, line.accountName || accountRow.account_name,
          line.debit, line.credit, line.costCenter || null]
      );

      const balanceResult = await db(transaction).query<{ signed_balance: string | number }>(
        `SELECT COALESCE(SUM(
            CASE WHEN c.account_nature IN ('asset', 'expense') THEN gl.debit - gl.credit
                 ELSE gl.credit - gl.debit END
          ), 0) AS signed_balance
           FROM public.erp_general_ledger gl
           JOIN public.erp_chart_of_accounts c
             ON c.school_id = gl.school_id AND c.account_code = gl.account_code
          WHERE gl.school_id = $1 AND gl.account_code = $2`,
        [schoolId, line.accountCode]
      );
      const priorBalance = Number(balanceResult.rows[0]?.signed_balance || 0);
      const delta = ['asset', 'expense'].includes(accountRow.account_nature)
        ? line.debit - line.credit
        : line.credit - line.debit;
      const balanceAfter = Number((priorBalance + delta).toFixed(2));
      await db(transaction).query(
        `INSERT INTO public.erp_general_ledger
          (tenant_id, school_id, id, journal_entry_id, journal_line_id, account_code,
           entry_date, debit, credit, balance_after, source_type, source_id, description)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [tenantId, schoolId, `${journalEntryId}-${line.id}`, journalEntryId, line.id, line.accountCode,
          document.date, line.debit, line.credit, balanceAfter, document.sourceType, document.sourceId, document.description]
      );
    }

    if (document.expenseAccrual) {
      await db(transaction).query(
        `UPDATE public.erp_expense_accruals
            SET journal_entry_id = $1
          WHERE school_id = $2 AND id = $3`,
        [journalEntryId, schoolId, document.sourceId]
      );
    }
    return { created: true, ledgerLines: orderedLines.length, journalEntryId };
  }

  private static async ensureOpenPeriod(
    transaction: TransactionLike,
    tenantId: string,
    schoolId: string,
    actorId: string,
    date: string
  ): Promise<void> {
    const period = fiscalPeriodFor(date);
    await db(transaction).query(
      `INSERT INTO public.erp_financial_periods
        (tenant_id, school_id, period_code, starts_on, ends_on, status)
       VALUES ($1::uuid, $2::uuid, $3, date_trunc('month', $4::date)::date,
               (date_trunc('month', $4::date) + interval '1 month - 1 day')::date, 'open')
       ON CONFLICT (school_id, period_code) DO NOTHING`,
      [tenantId, schoolId, period, date]
    );
    // Keep the actor argument in the method contract so future period
    // governance can record who opened an automatically provisioned UAT
    // period without changing the posting transaction shape.
    void actorId;
  }

  /**
   * Posts inventory and procurement source documents to the same canonical
   * double-entry ledger used by the finance module. The source snapshot is
   * still a UI read model; journal rows and their source links are authoritative.
   */
  public static async syncInventoryProcurementSnapshot(
    transaction: TransactionLike,
    tenantId: string,
    schoolId: string,
    actorId: string,
    payload: FinancialRow
  ): Promise<CanonicalErpSyncResult> {
    if (!(await this.isProvisioned(transaction))) {
      throw new Error('المخطط المحاسبي الكانوني غير مثبت؛ طبّق ترحيل ERP المالي قبل ربط المخزون بالحسابات.');
    }

    const mappings = await this.loadMappings(transaction, schoolId);
    const settings = payload.settings && typeof payload.settings === 'object' && !Array.isArray(payload.settings) ? payload.settings as FinancialRow : {};
    const procurementSettings = payload.procurementSettings && typeof payload.procurementSettings === 'object' && !Array.isArray(payload.procurementSettings)
      ? payload.procurementSettings as FinancialRow : {};
    const configured = (key: string, value: unknown) => {
      const text = textValue(value);
      return text || mappings.get(key) || DEFAULT_MAPPING[key];
    };
    const inventoryAccount = (item: FinancialRow) => textValue(item.inventoryAccountId) || configured('inventory.asset', settings.inventoryAccountPrefix);
    const cogsAccount = (item: FinancialRow) => textValue(item.costOfGoodsAccountId) || configured('inventory.cogs', settings.cogsAccountPrefix);
    const adjustmentAccount = (item: FinancialRow) => textValue(item.adjustmentAccountId) || configured('inventory.adjustment', settings.adjustmentAccountPrefix);
    const grniAccount = configured('inventory.grni', procurementSettings.grniGlAccount);
    const payableAccount = configured('inventory.ap', procurementSettings.apGlAccount);
    const vatAccount = configured('inventory.input_vat', procurementSettings.inputVatGlAccount);
    const itemById = new Map<string, FinancialRow>();
    for (const item of (Array.isArray(payload.items) ? payload.items : [])
      .filter((candidate): candidate is FinancialRow => Boolean(candidate && typeof candidate === 'object' && !Array.isArray(candidate)))) {
      itemById.set(textValue(item.id), item);
      if (textValue(item.sku)) itemById.set(textValue(item.sku), item);
    }

    await this.ensureChartAccounts(transaction, tenantId, schoolId, actorId, {});
    const documents: CanonicalPostingDocument[] = [];
    const addReceipt = (raw: unknown) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      const receipt = raw as FinancialRow;
      const lines = Array.isArray(receipt.lines) ? receipt.lines : [];
      const postingLines: CanonicalPostingLine[] = [];
      let acceptedTotal = 0;
      for (const [index, rawLine] of lines.entries()) {
        if (!rawLine || typeof rawLine !== 'object' || Array.isArray(rawLine)) continue;
        const line = rawLine as FinancialRow;
        const acceptedQty = Number(line.acceptedQty || 0);
        const amount = Number(line.totalCost || 0);
        const item = itemById.get(textValue(line.itemId || line.itemCode)) || {};
        if (!Number.isFinite(acceptedQty) || acceptedQty <= 0 || !Number.isFinite(amount) || amount <= 0) continue;
        acceptedTotal += amount;
        postingLines.push({ id: `${textValue(receipt.id)}-${textValue(line.lineId, String(index))}-D`, accountCode: inventoryAccount(item), debit: Number(amount.toFixed(2)), credit: 0, costCenter: textValue(item.costCenterId) || undefined });
      }
      if (acceptedTotal <= 0 || postingLines.length === 0) return;
      postingLines.push({ id: `${textValue(receipt.id)}-GRNI-C`, accountCode: grniAccount, debit: 0, credit: Number(acceptedTotal.toFixed(2)) });
      documents.push({ sourceType: 'inventory_receipt', sourceId: textValue(receipt.id), date: dateValue(rowValue(receipt, 'grnDate', 'date')), description: textValue(receipt.notes, `إثبات استلام مخزني ${textValue(receipt.grnNo, textValue(receipt.id))}`), lines: postingLines });
    };
    const addBill = (raw: unknown) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      const bill = raw as FinancialRow;
      if (!['approved', 'posted'].includes(normalizedStatus(bill.status))) return;
      const subtotal = positiveAmount(bill.subtotal, `vendorBill.${textValue(bill.id)}.subtotal`);
      const tax = Number(bill.taxAmount || 0);
      if (!Number.isFinite(tax) || tax < 0) throw new Error(`ضريبة فاتورة المورد ${textValue(bill.id)} غير صالحة.`);
      const total = Number((subtotal + tax).toFixed(2));
      const lines: CanonicalPostingLine[] = [
        { id: `${textValue(bill.id)}-GRNI-D`, accountCode: grniAccount, debit: subtotal, credit: 0 },
      ];
      if (tax > 0) lines.push({ id: `${textValue(bill.id)}-VAT-D`, accountCode: vatAccount, debit: Number(tax.toFixed(2)), credit: 0 });
      lines.push({ id: `${textValue(bill.id)}-AP-C`, accountCode: payableAccount, debit: 0, credit: total });
      documents.push({ sourceType: 'vendor_bill', sourceId: textValue(bill.id), date: dateValue(rowValue(bill, 'billDate', 'date')), description: textValue(bill.notes, `إثبات فاتورة مورد ${textValue(bill.billNo, textValue(bill.id))}`), lines });
    };
    const addMovement = (raw: unknown) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      const movement = raw as FinancialRow;
      if (normalizedStatus(movement.status) !== 'approved') return;
      const type = textValue(movement.type).toLowerCase();
      if (type === 'transfer') return; // A location transfer has no net GL impact.
      const item = itemById.get(textValue(movement.itemId)) || {};
      const quantity = positiveAmount(movement.quantity, `movement.${textValue(movement.id)}.quantity`);
      const amount = positiveAmount(movement.totalAmount || quantity * Number(item.costPrice || 0), `movement.${textValue(movement.id)}.amount`);
      const stockAccount = inventoryAccount(item);
      const lines = type === 'sale'
        ? [{ id: `${textValue(movement.id)}-COGS-D`, accountCode: cogsAccount(item), debit: amount, credit: 0 }, { id: `${textValue(movement.id)}-STOCK-C`, accountCode: stockAccount, debit: 0, credit: amount }]
        : [{ id: `${textValue(movement.id)}-STOCK-D`, accountCode: stockAccount, debit: amount, credit: 0 }, { id: `${textValue(movement.id)}-GRNI-C`, accountCode: grniAccount, debit: 0, credit: amount }];
      documents.push({ sourceType: 'inventory_movement', sourceId: textValue(movement.id), date: dateValue(rowValue(movement, 'date', 'movementDate')), description: textValue(movement.notes, `حركة مخزنية ${textValue(movement.id)}`), lines });
    };
    const addStocktake = (raw: unknown) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      const stocktake = raw as FinancialRow;
      if (normalizedStatus(stocktake.status) !== 'approved') return;
      const item = itemById.get(textValue(stocktake.itemId)) || {};
      const delta = Number(stocktake.actualQty) - Number(stocktake.bookQty);
      if (!Number.isFinite(delta) || delta === 0) return;
      const amount = positiveAmount(Math.abs(delta) * Number(item.costPrice || 0), `stocktake.${textValue(stocktake.id)}.amount`);
      const stockAccount = inventoryAccount(item);
      const lines = delta > 0
        ? [{ id: `${textValue(stocktake.id)}-STOCK-D`, accountCode: stockAccount, debit: amount, credit: 0 }, { id: `${textValue(stocktake.id)}-ADJ-C`, accountCode: adjustmentAccount(item), debit: 0, credit: amount }]
        : [{ id: `${textValue(stocktake.id)}-ADJ-D`, accountCode: adjustmentAccount(item), debit: amount, credit: 0 }, { id: `${textValue(stocktake.id)}-STOCK-C`, accountCode: stockAccount, debit: 0, credit: amount }];
      const stocktakeDate = textValue(rowValue(stocktake, 'date')) || textValue(stocktake.createdAt).slice(0, 10);
      documents.push({ sourceType: 'inventory_stocktake', sourceId: textValue(stocktake.id), date: dateValue(stocktakeDate), description: textValue(stocktake.notes, `تسوية جرد مخزني ${textValue(stocktake.id)}`), lines });
    };

    for (const row of Array.isArray(payload.goodsReceipts) ? payload.goodsReceipts : []) addReceipt(row);
    for (const row of Array.isArray(payload.vendorBills) ? payload.vendorBills : []) addBill(row);
    for (const row of Array.isArray(payload.movements) ? payload.movements : []) addMovement(row);
    for (const row of Array.isArray(payload.stocktakes) ? payload.stocktakes : []) addStocktake(row);

    let createdJournalCount = 0;
    let existingJournalCount = 0;
    let ledgerLineCount = 0;
    const sourceLinks: CanonicalErpSyncResult['sourceLinks'] = [];
    for (const document of documents) {
      await this.ensureOpenPeriod(transaction, tenantId, schoolId, actorId, document.date);
      const result = await this.postDocument(transaction, tenantId, schoolId, actorId, document);
      if (result.created) { createdJournalCount += 1; ledgerLineCount += result.ledgerLines; }
      else existingJournalCount += 1;
      sourceLinks.push({ sourceType: document.sourceType, sourceId: document.sourceId, journalEntryId: result.journalEntryId });
    }
    await db(transaction).query(
      `INSERT INTO public.erp_financial_audit_events
        (tenant_id, school_id, operation, entity_type, entity_id, actor_user_id, after_payload)
       VALUES ($1::uuid, $2::uuid, 'INVENTORY_PROCUREMENT_POSTING', 'inventory_procurement_snapshot', NULL, $3::uuid, $4::jsonb)`,
      [tenantId, schoolId, actorId, JSON.stringify({ createdJournalCount, existingJournalCount, ledgerLineCount, sourceCount: documents.length })]
    );
    return { createdJournalCount, existingJournalCount, ledgerLineCount, expenseAccrualCount: 0, sourceLinks };
  }

  public static async syncSnapshot(
    transaction: TransactionLike,
    tenantId: string,
    schoolId: string,
    actorId: string,
    payload: FinancialRow
  ): Promise<CanonicalErpSyncResult> {
    if (!(await this.isProvisioned(transaction))) {
      throw new Error('المخطط المحاسبي الكانوني غير مثبت؛ طبّق ترحيل ERP المالي قبل التفعيل.');
    }
    const mappings = await this.loadMappings(transaction, schoolId);
    await this.ensureChartAccounts(transaction, tenantId, schoolId, actorId, payload);

    const documents: CanonicalPostingDocument[] = [];
    const add = (sourceType: PostingSource, raw: unknown) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
      const document = buildCanonicalPosting(sourceType, raw as FinancialRow, mappings);
      if (document) documents.push(document);
    };
    for (const row of Array.isArray(payload.invoices) ? payload.invoices : []) add('student_fee_invoice', row);
    for (const row of Array.isArray(payload.expenseAccruals) ? payload.expenseAccruals : []) add('expense_accrual', row);
    for (const row of Array.isArray(payload.studentReceiptVouchers) ? payload.studentReceiptVouchers : []) add('student_receipt', row);
    const studentReceiptIds = new Set((Array.isArray(payload.studentReceiptVouchers) ? payload.studentReceiptVouchers : [])
      .filter((row): row is FinancialRow => Boolean(row && typeof row === 'object' && !Array.isArray(row)))
      .map(row => textValue(row.id)));
    for (const row of Array.isArray(payload.receiptVouchers) ? payload.receiptVouchers : []) {
      if (row && typeof row === 'object' && !Array.isArray(row) && !studentReceiptIds.has(textValue((row as FinancialRow).id))) add('student_receipt', row);
    }
    for (const row of Array.isArray(payload.paymentVouchers) ? payload.paymentVouchers : []) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        const item = row as FinancialRow;
        const status = normalizedStatus(item.status);
        if (item.isAccrual === true || status === 'accrued') add('expense_accrual', item);
        else add('payment_voucher', item);
      }
    }
    const sourceJournalIds = new Set(
      [...(Array.isArray(payload.invoices) ? payload.invoices : []),
        ...(Array.isArray(payload.studentReceiptVouchers) ? payload.studentReceiptVouchers : []),
        ...(Array.isArray(payload.receiptVouchers) ? payload.receiptVouchers : []),
        ...(Array.isArray(payload.paymentVouchers) ? payload.paymentVouchers : [])]
        .filter((row): row is FinancialRow => Boolean(row && typeof row === 'object' && !Array.isArray(row)))
        .map(row => textValue(row.journalEntryId))
        .filter(Boolean)
    );
    for (const row of Array.isArray(payload.journalEntries) ? payload.journalEntries : []) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      const item = row as FinancialRow;
      const sourceType = textValue(item.sourceType).toLowerCase();
      const sourceId = textValue(item.id);
      const isDerivedSource = ['student_fee_invoice', 'student_receipt', 'payment_voucher', 'expense_accrual'].includes(sourceType)
        || Boolean(item.receiptVoucherId || item.paymentVoucherId || item.invoiceId || item.expenseAccrualId)
        || sourceJournalIds.has(sourceId)
        || sourceId.startsWith('ERP-JV-');
      if (!isDerivedSource) add('journal_entry', item);
    }

    let createdJournalCount = 0;
    let existingJournalCount = 0;
    let ledgerLineCount = 0;
    let expenseAccrualCount = 0;
    const sourceLinks: CanonicalErpSyncResult['sourceLinks'] = [];
    for (const document of documents) {
      await this.ensureExpenseAccrual(transaction, tenantId, schoolId, actorId, document);
      if (document.expenseAccrual) expenseAccrualCount += 1;
      const result = await this.postDocument(transaction, tenantId, schoolId, actorId, document);
      if (result.created) {
        createdJournalCount += 1;
        ledgerLineCount += result.ledgerLines;
      } else {
        existingJournalCount += 1;
      }
      sourceLinks.push({ sourceType: document.sourceType, sourceId: document.sourceId, journalEntryId: result.journalEntryId });
    }

    await db(transaction).query(
      `INSERT INTO public.erp_financial_audit_events
        (tenant_id, school_id, operation, entity_type, entity_id, actor_user_id, after_payload)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::uuid, $7::jsonb)`,
      [tenantId, schoolId, 'CANONICAL_ERP_SYNC', 'erp_financial_snapshot', null, actorId,
        JSON.stringify({ createdJournalCount, existingJournalCount, ledgerLineCount, expenseAccrualCount })]
    );

    return { createdJournalCount, existingJournalCount, ledgerLineCount, expenseAccrualCount, sourceLinks };
  }

  /** Creates an immutable compensating journal for a posted canonical entry. */
  public static async reverseJournal(
    transaction: TransactionLike,
    tenantId: string,
    schoolId: string,
    actorId: string,
    journalId: string,
    reason: string
  ): Promise<string> {
    const cleanReason = reason.trim();
    if (!cleanReason) throw new Error('سبب العكس المحاسبي إلزامي.');
    const original = await db(transaction).query<any>(
      `SELECT id, entry_date, description, source_type, source_id, fiscal_period, status
         FROM public.erp_journal_entries
        WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND id = $3
        FOR UPDATE`,
      [tenantId, schoolId, journalId]
    );
    const source = original.rows[0];
    if (!source) throw new Error(`القيد ${journalId} غير موجود في الأستاذ الكانوني.`);
    if (source.status !== 'posted') throw new Error(`لا يمكن عكس القيد ${journalId} في حالته الحالية.`);
    const already = await db(transaction).query<{ id: string }>(
      `SELECT id FROM public.erp_journal_entries
        WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND reversal_of_journal_id = $3
        LIMIT 1`, [tenantId, schoolId, journalId]
    );
    if (already.rows[0]) return already.rows[0].id;
    const lines = await db(transaction).query<any>(
      `SELECT id, account_code, account_name, debit, credit, cost_center
         FROM public.erp_journal_lines
        WHERE school_id = $1 AND journal_entry_id = $2
        ORDER BY id`, [schoolId, journalId]
    );
    if (lines.rows.length < 2) throw new Error(`القيد ${journalId} لا يحتوي على أسطر قابلة للعكس.`);
    const reversalPeriod = await db(transaction).query<{ status: string }>(
      `SELECT status FROM public.erp_financial_periods
        WHERE tenant_id = $1::uuid AND school_id = $2::uuid
          AND period_code = to_char(CURRENT_DATE, 'YYYY-MM')
          AND starts_on <= CURRENT_DATE AND ends_on >= CURRENT_DATE
        FOR UPDATE`, [tenantId, schoolId]
    );
    if (!reversalPeriod.rows[0] || reversalPeriod.rows[0].status !== 'open') {
      throw new Error(`لا يمكن عكس القيد ${journalId}: فترة العكس الحالية مغلقة أو غير معرفة.`);
    }
    const reversalId = `ERP-REV-${journalId}`;
    const key = `reversal:${journalId}`;
    await db(transaction).query(
      `INSERT INTO public.erp_journal_entries
        (tenant_id, school_id, id, entry_date, description, status, source_type, source_id,
         fiscal_period, idempotency_key, reversal_of_journal_id, reversal_reason,
         total_debit, total_credit, created_by)
       VALUES ($1::uuid, $2::uuid, $3, CURRENT_DATE, $4, 'posted', 'reversal', $5,
         $6, $7, $8, $9, $10, $11, $12::uuid)`,
      [tenantId, schoolId, reversalId, `عكس القيد ${journalId}: ${cleanReason}`, journalId,
        fiscalPeriodFor(new Date().toISOString().slice(0, 10)), key, journalId, cleanReason,
        Number(lines.rows.reduce((sum: number, row: any) => sum + Number(row.credit), 0).toFixed(2)),
        Number(lines.rows.reduce((sum: number, row: any) => sum + Number(row.debit), 0).toFixed(2)), actorId]
    );
    for (const line of lines.rows) {
      await db(transaction).query(
        `INSERT INTO public.erp_journal_lines
          (tenant_id, school_id, journal_entry_id, id, account_code, account_name, debit, credit, cost_center)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9)`,
        [tenantId, schoolId, reversalId, `${line.id}-REV`, line.account_code, line.account_name,
          line.credit, line.debit, line.cost_center || null]
      );
      await db(transaction).query(
        `INSERT INTO public.erp_general_ledger
          (tenant_id, school_id, id, journal_entry_id, journal_line_id, account_code, entry_date,
           debit, credit, balance_after, source_type, source_id, description)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, CURRENT_DATE, $7, $8, 0, 'reversal', $9, $10)`,
        [tenantId, schoolId, `${reversalId}-${line.id}-REV`, reversalId, `${line.id}-REV`, line.account_code,
          line.credit, line.debit, journalId, `عكس القيد ${journalId}: ${cleanReason}`]
      );
    }
    await db(transaction).query(
      `UPDATE public.erp_journal_entries SET status = 'reversed'
        WHERE tenant_id = $1::uuid AND school_id = $2::uuid AND id = $3`,
      [tenantId, schoolId, journalId]
    );
    await db(transaction).query(
      `INSERT INTO public.erp_financial_audit_events
        (tenant_id, school_id, operation, entity_type, entity_id, actor_user_id, after_payload)
       VALUES ($1::uuid, $2::uuid, 'REVERSE', 'erp_journal_entry', $3, $4::uuid, $5::jsonb)`,
      [tenantId, schoolId, journalId, actorId, JSON.stringify({ reversalId, reason: cleanReason })]
    );
    return reversalId;
  }

  public static async readModel(
    transaction: TransactionLike,
    schoolId: string,
    provisioned = false
  ): Promise<CanonicalErpReadModel> {
    if (!provisioned && !(await this.isProvisioned(transaction))) {
      return { journalEntries: [], ledgerEntries: [], chartOfAccounts: [], expenseAccruals: [], sourceLinks: [] };
    }
    // A transaction is backed by one checked-out PostgreSQL client. Issuing a
    // Promise.all against that client is unsupported by node-postgres, causes
    // query contention, and is deprecated for pg@9. Keep the reads ordered on
    // the same consistent transaction snapshot.
    const journals = await db(transaction).query<any>(
        `SELECT id, entry_date, description, status, source_type, source_id, total_debit, total_credit, created_at
           FROM public.erp_journal_entries WHERE school_id = $1 ORDER BY entry_date DESC, created_at DESC`, [schoolId]
      );
    const lines = await db(transaction).query<any>(
        `SELECT journal_entry_id, id, account_code, account_name, debit, credit, cost_center
           FROM public.erp_journal_lines WHERE school_id = $1 ORDER BY journal_entry_id, id`, [schoolId]
      );
    const ledger = await db(transaction).query<any>(
        `SELECT id, journal_entry_id, journal_line_id, account_code, entry_date, debit, credit,
                balance_after, source_type, source_id, description, created_at
           FROM public.erp_general_ledger WHERE school_id = $1 ORDER BY entry_date DESC, created_at DESC`, [schoolId]
      );
    const accounts = await db(transaction).query<any>(
        `SELECT c.account_code, c.account_name, c.account_nature, c.is_active, c.is_leaf,
                COALESCE(SUM(gl.debit), 0) AS debit_balance,
                COALESCE(SUM(gl.credit), 0) AS credit_balance,
                COALESCE(SUM(CASE WHEN c.account_nature IN ('asset', 'expense') THEN gl.debit - gl.credit
                                  ELSE gl.credit - gl.debit END), 0) AS balance
           FROM public.erp_chart_of_accounts c
           LEFT JOIN public.erp_general_ledger gl
             ON gl.school_id = c.school_id AND gl.account_code = c.account_code
          WHERE c.school_id = $1
          GROUP BY c.account_code, c.account_name, c.account_nature, c.is_active, c.is_leaf
          ORDER BY c.account_code`, [schoolId]
      );
    const accruals = await db(transaction).query<any>(
        `SELECT id, accrual_date, description, supplier_name, amount, expense_account,
                payable_account, status, journal_entry_id, created_at
           FROM public.erp_expense_accruals WHERE school_id = $1 ORDER BY accrual_date DESC, created_at DESC`, [schoolId]
      );

    const lineMap = new Map<string, any[]>();
    for (const line of lines.rows) {
      const list = lineMap.get(line.journal_entry_id) || [];
      list.push({ id: line.id, accountCode: line.account_code, accountName: line.account_name,
        debit: Number(line.debit), credit: Number(line.credit), costCenter: line.cost_center || undefined });
      lineMap.set(line.journal_entry_id, list);
    }
    const journalEntries = journals.rows.map(row => ({
      id: row.id,
      date: row.entry_date,
      description: row.description,
      status: row.status,
      sourceType: row.source_type,
      sourceId: row.source_id,
      debitTotal: Number(row.total_debit),
      creditTotal: Number(row.total_credit),
      totalDebit: Number(row.total_debit),
      totalCredit: Number(row.total_credit),
      lines: lineMap.get(row.id) || [],
      items: lineMap.get(row.id) || [],
      createdAt: row.created_at
    }));
    const sourceLinks = journals.rows.map(row => ({ sourceType: row.source_type, sourceId: row.source_id, journalEntryId: row.id }));
    const chartOfAccounts = accounts.rows.map(row => ({
      id: row.account_code,
      code: row.account_code,
      name: row.account_name,
      nameAr: row.account_name,
      nature: row.account_nature,
      classification: row.account_nature,
      isActive: row.is_active,
      isLeaf: row.is_leaf,
      type: row.is_leaf ? 'فرعي' : 'رئيسي',
      balance: Number(row.balance),
      debitBalance: Number(row.debit_balance),
      creditBalance: Number(row.credit_balance)
    }));
    return {
      journalEntries,
      ledgerEntries: ledger.rows.map(row => ({ ...row, debit: Number(row.debit), credit: Number(row.credit), balanceAfter: Number(row.balance_after) })),
      chartOfAccounts,
      expenseAccruals: accruals.rows.map(row => ({ ...row, amount: Number(row.amount) })),
      sourceLinks
    };
  }
}
