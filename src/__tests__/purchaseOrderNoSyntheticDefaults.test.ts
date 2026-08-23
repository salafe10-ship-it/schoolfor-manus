import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('purchase order creation integrity', () => {
  it('starts empty and does not auto-approve a fabricated order', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/procurement/PurchaseOrderManager.tsx'),
      'utf8'
    );
    expect(source).toContain("status: 'draft'");
    expect(source).toContain('lines: [],');
    expect(source).toContain("if (!editingPO.vendorId || !editingPO.warehouseId || !editingPO.lines?.length)");
    expect(source).not.toContain("vendorId: 'sup_sony'");
    expect(source).not.toContain("status: 'approved',\n      lines:");
  });
});
