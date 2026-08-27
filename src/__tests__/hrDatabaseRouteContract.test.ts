import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

describe('HR canonical database route contract', () => {
  it('uses trusted scope, optimistic versioning, and an audit event', () => {
    expect(source).toContain("app.get('/api/hr/database', authenticateRequest, requirePermission(PERMISSIONS.HR_READ)");
    expect(source).toContain("app.post('/api/hr/database', authenticateRequest, requirePermission(PERMISSIONS.HR_WRITE)");
    expect(source).toContain('SELECT version FROM public.hr_database WHERE tenant_id = $1 AND school_id = $2 FOR UPDATE');
    expect(source).toContain('ON CONFLICT (school_id) DO UPDATE');
    expect(source).toContain("'hr_database', $2, 'write', 'HrDatabaseRoute'");
    expect(source).toContain('رمز الدولة اختياري ومحايد');
  });
});
