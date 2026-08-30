import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('inventory and procurement financial integration', () => {
  it('does not fabricate journal identifiers and routes approved documents to the canonical ledger', () => {
    const receipt = readFileSync('src/components/procurement/GoodsReceiptManager.tsx', 'utf8');
    const payment = readFileSync('src/components/procurement/VendorBillPaymentManager.tsx', 'utf8');
    const movement = readFileSync('src/components/inventory/StockMovementManager.tsx', 'utf8');
    const count = readFileSync('src/components/inventory/StockCountManager.tsx', 'utf8');
    expect(receipt).toContain('isPostedToGL: false');
    expect(receipt).not.toContain('glJournalEntryId: `JV-');
    expect(payment).not.toContain('glJournalEntryId: `JV-');
    expect(movement).toContain('onApproveMovement');
    expect(movement).toContain('اعتماد وترحيل');
    expect(count).toContain('onApproveStocktake');
    expect(count).toContain('اعتماد وترحيل التسوية');
    expect(readFileSync('src/modules/financial/application/CanonicalErpPostingService.ts', 'utf8')).toContain('syncInventoryProcurementSnapshot');
    expect(readFileSync('server.ts', 'utf8')).toContain('applyInventoryPostingLinks');
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
