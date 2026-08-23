import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/hr/PayrollTab.tsx', 'utf8');

describe('payroll canonical posting contract', () => {
  it('does not post payroll through browser storage in canonical mode', () => {
    expect(source).toContain("import { FallbackStorage } from '../../database/repositories/FallbackStorage'");
    expect(source).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(source).toContain('ترحيل الرواتب متوقف حتى يتم ربط مسار الرواتب');
  });

  it('does not approve employee advances through browser storage in canonical mode', () => {
    const otherHr = readFileSync('src/components/hr/OtherHRTabs.tsx', 'utf8');
    expect(otherHr).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(otherHr).toContain('صرف السلف متوقف حتى يتم ربط مسار السلف');
  });

  it('does not read local posted-state in canonical mode', () => {
    expect(source).toContain('const postedVal = FallbackStorage.isCanonicalPersistenceRequired()');
  });
});
