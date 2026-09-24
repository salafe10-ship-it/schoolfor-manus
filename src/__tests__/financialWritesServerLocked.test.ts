import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const server = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');

describe('financial API server-side write lock', () => {
  it('fails closed before any financial mutation handler', () => {
    const start = server.indexOf('const financialWritesLocked = process.env.FINANCIAL_WRITES_LOCKED');
    const end = server.indexOf('// Security headers are strict by default.', start);
    const gate = server.slice(start, end);
    expect(gate).toContain("req.path.startsWith('/api/financial')");
    expect(gate).toContain("['GET', 'HEAD', 'OPTIONS']");
    expect(gate).toContain("req.path === '/api/financial/account-mappings'");
    expect(gate).toContain("req.method.toUpperCase() === 'POST'");
    expect(gate).toContain('res.status(423)');
    expect(gate).toContain('FINANCIAL_WRITES_LOCKED');
  });

  it('keeps mapping configuration bounded and separate from chart provisioning', () => {
    const start = server.indexOf("app.post('/api/financial/account-mappings'");
    const end = server.indexOf("app.get(\"/api/financial/database\"", start);
    const route = server.slice(start, end);
    expect(route).toContain('const canonicalWriteClient = canonicalTenantReadClient(req)');
    expect(route).toContain("from('erp_chart_of_accounts')");
    expect(route).toContain(".upsert(");
    expect(route).toContain("from('audit_events')");
    expect(route).not.toContain('UnitOfWork.runInTransaction');
    expect(route).not.toContain('ensureDefaultChartOfAccounts');
    expect(route).not.toContain('INSERT INTO public.erp_account_mappings');
  });

  it('keeps mapping readiness reads off the transactional pool', () => {
    const start = server.indexOf("app.get('/api/financial/account-mappings'");
    const end = server.indexOf("app.post('/api/financial/account-mappings'", start);
    const route = server.slice(start, end);
    expect(route).toContain('canonicalTenantReadClient(req)');
    expect(route).toContain("from('erp_account_mappings')");
    expect(route).not.toContain('UnitOfWork.runInTransaction');
  });
});
