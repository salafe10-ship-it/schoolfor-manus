import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('identity governance route contract', () => {
  const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

  it('exposes real database-backed governance lifecycle routes', () => {
    for (const route of [
      "app.get('/api/school/access-requests'",
      "app.post('/api/school/access-requests'",
      "app.patch('/api/school/access-requests/:requestId/decision'",
      "app.get('/api/school/effective-permissions'",
      "app.get('/api/school/access-reviews'",
      "app.post('/api/school/access-reviews/generate'",
      "app.patch('/api/school/access-reviews/:reviewId/decision'",
      "app.get('/api/school/sod-conflicts'",
      "app.get('/api/school/sod-rules'",
      "app.post('/api/school/sod-rules'",
    ]) expect(server).toContain(route);
    expect(server).toContain("source: 'canonical_database'");
    expect(server).toContain('recordAccessGovernanceAudit');
    expect(server).toContain("upg.ends_at>now()");
  });

  it('keeps governance mutations scoped to the authenticated school context', () => {
    expect(server).toContain('schoolIdentityScope(req)');
    expect(server).toContain('tenant_id=$1::uuid AND school_id=$2::uuid');
    expect(server).toContain('version=$3');
    expect(server).not.toContain("localStorage.setItem('identity_access");
  });

  it('requires an approved live request for direct financial exceptions', () => {
    const directPermissionBlock = server.slice(server.indexOf("operation === 'set_permissions'"), server.indexOf("operation === 'reset_password'"));
    expect(directPermissionBlock).toContain('sensitiveFinancialKeys');
    expect(directPermissionBlock).toContain("r.status = 'approved'");
    expect(directPermissionBlock).toContain('r.ends_at > now()');
    expect(directPermissionBlock).toContain('assertNoSegregationOfDutiesConflict');
  });
});
