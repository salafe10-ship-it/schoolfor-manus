import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('procurement order approval integrity', () => {
  it('does not fabricate a vendor or approve purchase orders automatically', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain("status: 'draft'");
    expect(source).toContain("vendorId: ''");
    expect(source).toContain("vendorName: ''");
    expect(source).toContain('const supplier = database.suppliers.find');
    expect(source).toContain('vendorName: supplier.name');
    expect(source).not.toContain("vendorName: 'شركة سوني العالمية'");
    expect(source).not.toContain('Math.random()');
    expect(source).toContain('مسودة أمر شراء مركزية');
    expect(source).not.toContain('أمر شراء معتمد رقم');
  });
});
