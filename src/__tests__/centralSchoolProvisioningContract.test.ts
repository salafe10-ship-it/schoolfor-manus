import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('central school provisioning contract', () => {
  const server = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
  const screen = readFileSync(resolve(process.cwd(), 'src/components/super-admin/SuperAdminSchools.tsx'), 'utf8');

  it('derives central school scope from verified identity and commits school plus branch together', () => {
    const routeStart = server.indexOf("app.post('/api/admin/central/schools'");
    const route = server.slice(routeStart, routeStart + 7_500);
    expect(routeStart).toBeGreaterThan(-1);
    expect(route).toContain("app.post('/api/admin/central/schools'");
    expect(server).toContain('requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)');
    expect(route).toContain("const tenantId = String(identity?.tenantId || '').trim();");
    expect(route).toContain("await client.query('BEGIN');");
    expect(route).toContain("await client.query('COMMIT');");
    expect(route).toContain("await client.query('ROLLBACK');");
    expect(route).not.toContain('req.body?.tenantId');
    expect(route).not.toContain('req.body?.schoolId');
  });

  it('does not report a local success for the add-school action', () => {
    expect(screen).toContain("authenticatedRequest('/api/admin/central/schools'");
    expect(screen).toContain('قاعدة البيانات المركزية');
    expect(screen).toContain('لم يتم تعديل البيانات');
  });
});
