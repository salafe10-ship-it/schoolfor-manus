import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('quotation comparison integrity', () => {
  it('does not seed RFQs or vendor quotations', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/procurement/QuotationComparisonManager.tsx'), 'utf8');
    expect(source).toContain("useState<string>('')");
    expect(source).toContain('rfqs: RequestForQuotation[]');
    expect(source).toContain('quotations: VendorQuotation[]');
    expect(source).toContain('onSaveQuotation');
    expect(source).not.toContain('RFQ-2026-009');
    expect(source).not.toContain('QUO-SONY-771');
  });
});
