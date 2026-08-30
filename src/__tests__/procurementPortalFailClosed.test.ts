import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('procurement portal canonical loading', () => {
  it('uses the inventory and procurement snapshot instead of browser storage', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain('database: InventoryCanonicalDatabase');
    expect(source).toContain('onCommit: (database: InventoryCanonicalDatabase');
    expect(source).toContain('const { purchaseRequests, purchaseOrders, goodsReceipts, vendorBills } = database');
    expect(source).not.toContain('ProcurementRepository.getPurchaseRequests');
  });

  it('reconciles legacy SKU references when deriving PO receipt progress', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain('const canonicalItemId = (reference?: string)');
    expect(source).toContain('canonicalItemId(orderLine.itemId || orderLine.itemCode)');
    expect(source).toContain('canonicalItemId(line.itemId || line.itemCode) === itemId');
  });
});
