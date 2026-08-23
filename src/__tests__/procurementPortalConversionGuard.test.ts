import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('procurement conversion guards', () => {
  it('blocks conversion and award actions before protected repository writes', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/procurement/ProcurementManagementPortal.tsx'), 'utf8');
    expect(source).toContain('تحويل طلب الشراء متوقف حتى يتوفر مصدر مشتريات مركزي موثوق.');
    expect(source).toContain('ترسية العرض متوقفة حتى يتوفر مصدر مشتريات مركزي موثوق.');
    expect(source).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
  });
});
