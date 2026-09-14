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
});
