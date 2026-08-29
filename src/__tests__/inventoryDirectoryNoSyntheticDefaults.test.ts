import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('inventory directory integrity', () => {
  it('does not seed categories, brands, or units', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/inventory/CategoryBrandUnitManager.tsx'), 'utf8');
    expect(source).toContain('categories: InventoryCategory[]');
    expect(source).toContain('brands: Array<');
    expect(source).toContain('units: InventoryUnit[]');
    expect(source).toContain('await onSave({ categories:');
    expect(source).not.toContain('brand_sony');
    expect(source).not.toContain('cat_electronics');
    expect(source).not.toContain("origin: 'عالمي'");
    expect(source).not.toContain("description: 'تصنيف رئيسي معتمد'");
  });
});
