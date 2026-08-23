import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('purchase request integrity', () => {
  it('starts without fabricated requester or line items', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/procurement/PurchaseRequestManager.tsx'),
      'utf8'
    );
    expect(source).toContain("requesterName: ''");
    expect(source).toContain('lines: [],');
    expect(source).toContain('editingPR.lines.some');
    expect(source).not.toContain("itemCode: 'SKU-E-001'");
  });
});
