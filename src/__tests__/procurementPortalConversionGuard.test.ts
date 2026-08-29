import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('procurement conversion persistence', () => {
  it('commits conversions and awards through the canonical snapshot', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain('await commitPatch({ purchaseOrders: [newPO, ...purchaseOrders]');
    expect(source).toContain("status: 'converted_to_po'");
    expect(source).toContain("status: 'awarded' as const");
    expect(source).not.toContain('FallbackStorage.isCanonicalPersistenceRequired()');
  });
});
