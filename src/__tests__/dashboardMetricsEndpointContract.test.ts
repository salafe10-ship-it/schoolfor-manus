import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const serverSource = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
const routeStart = serverSource.indexOf("app.get('/api/dashboard/metrics'");
const routeEnd = serverSource.indexOf('  // ==========================================', routeStart + 1);
const routeSource = serverSource.slice(routeStart, routeEnd);

describe('Dashboard live metrics endpoint contract', () => {
  it('is authenticated and permission-gated', () => {
    expect(routeSource).toContain('authenticateRequest');
    expect(routeSource).toContain('requirePermissionOnly(PERMISSIONS.DASHBOARD_VIEW)');
    expect(routeSource).toContain('getSupabaseClientForAccessToken');
  });

  it('reads only RLS-backed counts and returns explicit unavailable states without exposing implementation names', () => {
    expect(routeSource).toContain("from('students').select('id', { count: 'exact', head: true })");
    expect(routeSource).toContain("from('enrollments').select('id', { count: 'exact', head: true })");
    expect(routeSource).toContain("status: 'unavailable'");
    expect(routeSource).not.toContain('public.students (RLS)');
    expect(routeSource).not.toContain('public.enrollments (RLS)');
    expect(routeSource).not.toContain('tenantId: identity.tenantId');
  });

  it('does not accept client-selected scope or service-role access', () => {
    expect(routeSource).toContain('identity?.tenantId');
    expect(routeSource).toContain('identity.schoolId');
    expect(routeSource).toContain('identity.branchId');
    expect(routeSource).not.toContain('req.query.schoolId');
    expect(routeSource).not.toContain('req.query.branchId');
    expect(routeSource).not.toContain('service_role');
  });
});
