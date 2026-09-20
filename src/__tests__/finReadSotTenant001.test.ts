import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const server = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');

describe('FIN-READ-SOT-TENANT-001 financial read closure gate', () => {
  const readStart = server.indexOf('app.get("/api/financial/database"');
  const readEnd = server.indexOf('app.post("/api/financial/database"', readStart);
  const readRoute = server.slice(readStart, readEnd);

  it('reads the financial source through the authenticated tenant scope', () => {
    expect(readRoute).toContain('authenticateRequest');
    expect(readRoute).toContain('requirePermission(PERMISSIONS.FINANCIAL_READ)');
    expect(readRoute).toContain('canonicalTenantReadClient(req)');
    expect(readRoute).toContain('tenantContext.tenantId !== tenantId || tenantContext.schoolId !== schoolId');
  });

  it('reads canonical invoices and receipts with both tenant and school predicates', () => {
    expect(readRoute).toContain("from('student_fee_invoices')");
    expect(readRoute).toContain("from('student_fee_receipts')");
    expect((readRoute.match(/\.eq\('tenant_id', tenantId\)/g) || []).length).toBeGreaterThanOrEqual(2);
    expect((readRoute.match(/\.eq\('school_id', schoolId\)/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it('keeps financial writes behind a separate permissioned POST route', () => {
    expect(readRoute).not.toContain('method: \'POST\'');
    expect(server.slice(readEnd, readEnd + 1200)).toContain('requirePermission(PERMISSIONS.FINANCIAL_WRITE)');
  });

  it('fails closed when the canonical read client or trusted scope is unavailable', () => {
    expect(readRoute).toContain('مصدر القراءة المالية المباشر غير متاح');
    expect(readRoute).toContain('السياق الموثوق للمصدر المالي غير مكتمل');
    expect(readRoute).toContain('FallbackStorage.assertCanonicalPersistence("financial database read")');
  });
});
