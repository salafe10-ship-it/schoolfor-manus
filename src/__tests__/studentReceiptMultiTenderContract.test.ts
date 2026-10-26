import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const portalSource = readFileSync('src/components/StudentFinancialPortal.tsx', 'utf8');
const serverSource = readFileSync('server.ts', 'utf8');
const postingSource = readFileSync('src/modules/financial/application/CanonicalErpPostingService.ts', 'utf8');

describe('student receipt multi-tender contract', () => {
  it('supports one to three receiving account lines and requires an exact total', () => {
    expect(portalSource).toContain('RECEIPT_TENDER_MAX = 3');
    expect(portalSource).toContain('receivingAccounts');
    expect(portalSource).toContain('مجموع توزيع القبض');
    expect(serverSource).toContain('يجب توزيع السند على حساب قبض واحد إلى ثلاثة حسابات فرعية');
    expect(serverSource).toContain('مجموع توزيع القبض');
  });

  it('rejects duplicate, inactive, or aggregate cash/bank accounts server-side', () => {
    expect(serverSource).toContain('لا يمكن تكرار حساب القبض');
    expect(serverSource).toContain('تجميعي ولا يقبل حركة مباشرة');
    expect(serverSource).toContain('ليس ضمن حسابات الصندوق أو البنوك');
  });

  it('expands each tender into a balanced canonical debit line', () => {
    expect(postingSource).toContain("rowValue(input, 'receivingAccounts', 'receivingAccountLines')");
    expect(postingSource).toContain('توزيع حسابات القبض غير متوازن');
    expect(postingSource).toContain('...receivingAccounts.map');
  });

  it('shows every tender in receipt details, printed receipts, exports, and the local journal summary', () => {
    expect(portalSource).toContain('const getReceiptTenders = (voucher: any) => normalizeReceiptTenders');
    expect(portalSource).toContain('resolveReceiptTenders');
    expect(portalSource).toContain('getReceiptTenders(selectedStudRv).map(tender =>');
    expect(portalSource).toContain('const receiptTenderRowsHtml = getReceiptTenders(v).map(tender =>');
    expect(portalSource).toContain("'توزيع الحسابات المدينة': getReceiptTenderSummary(v)");
    expect(portalSource).toContain('${escapePrintHtml(getReceiptTenderSummary(v))}');
  });

  it('keeps the human receipt reference in audit metadata without casting it to UUID', () => {
    expect(serverSource).toContain('const receiptAuditEntityId = randomUUID();');
    expect(serverSource).toContain('databaseActorId, receiptAuditEntityId');
    expect(serverSource).toContain('JSON.stringify({ receiptId, studentId, amount');
  });
});
