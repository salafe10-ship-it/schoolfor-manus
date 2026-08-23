import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('procurement order approval integrity', () => {
  it('does not fabricate a vendor or approve purchase orders automatically', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain("status: 'pending_approval'");
    expect(source).toContain("vendorId: ''");
    expect(source).toContain("vendorName: ''");
    expect(source).not.toContain("vendorName: 'شركة سوني العالمية - التوريدات التعليمية'");
    expect(source).not.toContain('Math.random()');
    expect(source).toContain('أمر شراء معلّق للمراجعة');
    expect(source).not.toContain('أمر شراء معتمد رقم');
  });
});
