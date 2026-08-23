import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('uniform form truthfulness', () => {
  it('does not prefill commercial or supplier data', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/SchoolUniformManagement.tsx'), 'utf8');
    expect(source).toContain("brand: '', fabricType: '', cottonPercent: 0");
    expect(source).toContain("supplierId: '', dueDate: ''");
    expect(source).not.toContain("brand: 'سحاب ستايل'");
    expect(source).not.toContain("buyPrice: 30, sellPrice: 45");
  });
});
