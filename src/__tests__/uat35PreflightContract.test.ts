import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('UAT-35 schema preflight contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'scripts/uat35-preflight.ts'), 'utf8');

  it('is explicitly read-only and never exposes connection material', () => {
    expect(source).toContain('Read-only schema preflight');
    expect(source).toContain("mode: 'read-only-schema-preflight'");
    expect(source).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)\s+/i);
    expect(source).not.toMatch(/console\.(?:log|error)\([^)]*connectionString/);
  });

  it('checks the tenant boundaries needed before a 35-school UAT run', () => {
    for (const table of ['tenants', 'schools', 'branches', 'users', 'hr_database', 'roles', 'permissions']) {
      expect(source).toContain(`'${table}'`);
    }
    expect(source).toContain('row_security_enabled');
    expect(source).toContain('pg_policies');
  });
});
