import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'scripts/load-test-central.ts'), 'utf8');

describe('500-school load test safety contract', () => {
  it('defaults to a non-mutating plan and caps the certification baseline at 500 schools', () => {
    expect(source).toContain("process.env.EDUPRO_LOADTEST_MODE || 'plan'");
    expect(source).toContain('MAX_CERTIFICATION_SCHOOLS = 500');
    expect(source).toContain("writesEnabled: false");
  });

  it('requires an explicit apply confirmation before remote writes', () => {
    expect(source).toContain("EDUPRO_LOADTEST_CONFIRM !== LOADTEST_APPLY_CONFIRMATION");
    expect(source).toContain('SCHOOLFORMANUS_500_LOADTEST_APPLY');
    expect(source).toContain("method: 'POST'");
  });
});
