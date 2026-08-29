import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('inventory and procurement financial truthfulness', () => {
  it('does not fabricate journal identifiers for receipts, payments, movements or counts', () => {
    const receipt = readFileSync('src/components/procurement/GoodsReceiptManager.tsx', 'utf8');
    const payment = readFileSync('src/components/procurement/VendorBillPaymentManager.tsx', 'utf8');
    const movement = readFileSync('src/components/inventory/StockMovementManager.tsx', 'utf8');
    const count = readFileSync('src/components/inventory/StockCountManager.tsx', 'utf8');
    expect(receipt).toContain('isPostedToGL: false');
    expect(receipt).not.toContain('glJournalEntryId: `JV-');
    expect(payment).not.toContain('glJournalEntryId: `JV-');
    expect(movement).toContain('لم يُنشأ قيد');
    expect(count).toContain('لم يُنشأ قيد');
  });
});

describe('inventory and procurement browser interaction integrity', () => {
  it('does not depend on native prompt dialogs for operational writes', () => {
    const files = [
      'src/components/inventory/CategoryBrandUnitManager.tsx',
      'src/components/inventory/StockCountManager.tsx',
      'src/components/procurement/PurchaseRequestManager.tsx',
      'src/components/procurement/VendorBillPaymentManager.tsx'
    ];
    for (const file of files) expect(readFileSync(file, 'utf8')).not.toContain('prompt(');
  });
});
