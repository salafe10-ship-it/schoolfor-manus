import type { TransactionSession } from '../../../database/transactions/TransactionContracts.js';

export const CANONICAL_ERP_TABLES = [
  'erp_chart_of_accounts',
  'erp_account_mappings',
  'erp_journal_entries',
  'erp_journal_lines',
  'erp_general_ledger',
  'erp_expense_accruals',
  'erp_financial_audit_events'
] as const;

type FinancialRow = Record<string, unknown>;
type PostingSource = 'student_fee_invoice' | 'student_receipt' | 'payment_voucher' | 'expense_accrual' | 'journal_entry';
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
  'liabilities.accrued_expense': '2101'
};

const DEFAULT_ACCOUNTS: Array<{ code: string; name: string; nature: string }> = [
  { code: '1101', name: 'صندوق النقدية والخزينة', nature: 'asset' },
  { code: '1201', name: 'ذمم الطلاب المدينة', nature: 'asset' },
  { code: '2101', name: 'مصروفات مستحقة والتزامات موردين', nature: 'liability' },
  { code: '4101', name: 'إيرادات الرسوم الدراسية', nature: 'revenue' },
  { code: '5270', name: 'مصروفات تشغيلية وإدارية أخرى', nature: 'expense' }
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
      lines
    };
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
      return { created: false, ledgerLines: 0, journalEntryId: existing.rows[0].id };
    }

    await db(transaction).query(
      `INSERT INTO public.erp_journal_entries
        (tenant_id, school_id, id, entry_date, description, source_type, source_id,
         idempotency_key, total_debit, total_credit, created_by)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11::uuid)`,
      [tenantId, schoolId, journalEntryId, document.date, document.description, document.sourceType,
        document.sourceId, idempotencyKey, debitTotal, creditTotal, actorId]
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

  public static async readModel(transaction: TransactionLike, schoolId: string): Promise<CanonicalErpReadModel> {
    if (!(await this.isProvisioned(transaction))) {
      return { journalEntries: [], ledgerEntries: [], chartOfAccounts: [], expenseAccruals: [], sourceLinks: [] };
    }
    const [journals, lines, ledger, accounts, accruals] = await Promise.all([
      db(transaction).query<any>(
        `SELECT id, entry_date, description, status, source_type, source_id, total_debit, total_credit, created_at
           FROM public.erp_journal_entries WHERE school_id = $1 ORDER BY entry_date DESC, created_at DESC`, [schoolId]
      ),
      db(transaction).query<any>(
        `SELECT journal_entry_id, id, account_code, account_name, debit, credit, cost_center
           FROM public.erp_journal_lines WHERE school_id = $1 ORDER BY journal_entry_id, id`, [schoolId]
      ),
      db(transaction).query<any>(
        `SELECT id, journal_entry_id, journal_line_id, account_code, entry_date, debit, credit,
                balance_after, source_type, source_id, description, created_at
           FROM public.erp_general_ledger WHERE school_id = $1 ORDER BY entry_date DESC, created_at DESC`, [schoolId]
      ),
      db(transaction).query<any>(
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
      ),
      db(transaction).query<any>(
        `SELECT id, accrual_date, description, supplier_name, amount, expense_account,
                payable_account, status, journal_entry_id, created_at
           FROM public.erp_expense_accruals WHERE school_id = $1 ORDER BY accrual_date DESC, created_at DESC`, [schoolId]
      )
    ]);

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
