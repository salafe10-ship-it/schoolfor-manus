import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('InventoryDashboard authoritative evidence contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/inventory/InventoryDashboard.tsx'), 'utf8');

  it('does not replace empty inventory data with demo totals or transactions', () => {
    expect(source).toContain('const totalItemsCount = items.length;');
    expect(source).toContain('const warehouseCount = 0;');
    expect(source).toContain('const recentTransactions: Array<Record<string, string>> = [];');
    expect(source).not.toContain(': 1250');
    expect(source).not.toContain("TR-1089");
    expect(source).not.toContain("المستودع الرئيسي - الرياض");
    expect(source).toContain('توثيق الحركات غير متحقق');
    expect(source).not.toContain('100% موثقة بالكامل');
  });
});
