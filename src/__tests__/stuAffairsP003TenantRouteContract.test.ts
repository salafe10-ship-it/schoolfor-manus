import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');

describe('STU-AFFAIRS-P0-003-01 trusted tenant route contract', () => {
  const protectedRoutes = [
    '/api/students/:id/transfer',
    '/api/students/:id/promote',
    '/api/students/:id/re-enroll',
    '/api/students/:id/graduate',
    '/api/students/:id/dismiss',
    '/api/students/:id/archive',
    '/api/students/:id/timeline'
  ];

  it.each(protectedRoutes)('requires trusted tenant middleware before the %s handler', (route) => {
    const routeDeclaration = `"${route}", authenticateRequest, requirePermission(`;
    const routeStart = serverSource.indexOf(routeDeclaration);
    expect(routeStart).toBeGreaterThanOrEqual(0);

    const routeSlice = serverSource.slice(routeStart, routeStart + 240);
    expect(routeSlice).toContain('resolveStudentTenantMiddleware');
    expect(routeSlice).toContain('async (req, res, next)');
  });

  it('keeps the canonical tenant resolver as the source of request context', () => {
    expect(serverSource).toContain('async function resolveStudentTenantMiddleware');
    expect(serverSource).toContain('await resolveStudentTenantContext(req);');
    expect(serverSource).toContain('tenantEngine.assertRequestTarget(context, requestTarget(req));');
  });
});
