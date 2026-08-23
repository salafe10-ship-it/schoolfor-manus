import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('warehouse data integrity', () => {
  it('does not seed warehouses or invent location and manager values', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/inventory/WarehouseManagement.tsx'),
      'utf8'
    );
    expect(source).toContain('useState<InventoryWarehouse[]>([])');
    expect(source).toContain("!editingWh.location?.trim() || !editingWh.manager?.trim()");
    expect(source).not.toContain("location: editingWh.location || 'المبنى الرئيسي'");
    expect(source).not.toContain("manager: editingWh.manager || 'أمين المستودع'");
  });
});
