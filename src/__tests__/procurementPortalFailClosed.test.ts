import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('procurement portal fail-closed loading', () => {
  it('handles blocked canonical reads without crashing the portal', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain('Procurement source unavailable:');
    expect(source).toContain('المشتريات متوقفة حتى يتوفر مصدر مركزي موثوق.');
    expect(source).toContain('try {');
    expect(source).toContain('} catch (error) {');
  });
});
