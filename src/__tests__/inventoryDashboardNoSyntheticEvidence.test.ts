import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('InventoryDashboard authoritative evidence contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/inventory/InventoryDashboard.tsx'), 'utf8');

  it('uses current school warehouses, movements, and receipt evidence without demo data', () => {
    expect(source).toContain("const activeItems = items.filter(item => item.status !== 'archived');");
    expect(source).toContain('const totalItemsCount = activeItems.length;');
    expect(source).toContain('const warehouseCount = warehouses.length;');
    expect(source).toContain('const recentTransactions = [...stockActivity]');
    expect(source).toContain('const dailyMovementsCount = stockActivity.filter');
    expect(source).toContain("movements.filter(movement => ['approved', 'posted'].includes(String(movement.status)))");
    expect(source).toContain("receipt.status === 'posted_to_gl'");
    expect(source).not.toContain(': 1250');
    expect(source).not.toContain("TR-1089");
    expect(source).not.toContain("المستودع الرئيسي - الرياض");
    expect(source).not.toContain('const warehouseCount = 0;');
    expect(source).not.toContain('100% موثقة بالكامل');
  });
});
