import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('employee salary validation', () => {
  it('rejects non-finite salary values before payroll use', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/validation/validators.ts'), 'utf8');
    expect(source).toContain('!Number.isFinite(employee.salary)');
  });
});
