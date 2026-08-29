import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('supplier data integrity', () => {
  it('does not seed suppliers or invent contact details', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/inventory/SupplierManager.tsx'), 'utf8');
    expect(source).toContain('suppliers = []');
    expect(source).toContain('await onSave([...suppliers, created])');
    expect(source).toContain('اسم المورد والهاتف والبريد والعنوان حقول مطلوبة');
    expect(source).not.toContain("'+966 11 000 0000'");
    expect(source).not.toContain("'info@supplier.sa'");
    expect(source).not.toContain("'الرياض'");
  });
});
