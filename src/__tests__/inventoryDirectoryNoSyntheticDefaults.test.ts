import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('inventory directory integrity', () => {
  it('does not seed categories, brands, or units', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/inventory/CategoryBrandUnitManager.tsx'), 'utf8');
    expect(source).toContain('useState<InventoryCategory[]>([])');
    expect(source).toContain('useState<any[]>([])');
    expect(source).toContain('useState<InventoryUnit[]>([])');
    expect(source).not.toContain('brand_sony');
    expect(source).not.toContain('cat_electronics');
    expect(source).not.toContain("origin: 'عالمي'");
    expect(source).not.toContain("description: 'تصنيف رئيسي معتمد'");
  });
});
