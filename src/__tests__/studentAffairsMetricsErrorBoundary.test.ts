import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('student affairs metrics error boundary', () => {
  it('keeps canonical metrics failures fail-closed with safe classification', () => {
    const source = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    const route = source.slice(source.indexOf("app.get('/api/student-affairs/metrics'"), source.indexOf('// ==========================================\n  // ENTERPRISE API ROUTES', source.indexOf("app.get('/api/student-affairs/metrics'")));
    expect(route).toContain("'SCHEMA_OBJECT_MISSING_OR_INVALID'");
    expect(route).toContain("'DATABASE_PERMISSION_OR_RLS'");
    expect(route).toContain("'DATABASE_CONNECTION'");
    expect(route).toContain("'DATABASE_QUERY_CANCELLED_OR_TIMEOUT'");
    expect(route).not.toContain('totalCount: 0');
  });
});
