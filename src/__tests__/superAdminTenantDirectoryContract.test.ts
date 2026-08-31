import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('central tenant directory contract', () => {
  it('exposes platform-authorized tenant CRUD with canonical subscription data', () => {
    const server = read('server.ts');
    expect(server).toContain("app.get('/api/admin/central/tenants'");
    expect(server).toContain("app.post('/api/admin/central/tenants'");
    expect(server).toContain("app.patch('/api/admin/central/tenants/:tenantId'");
    const routes = server.slice(server.indexOf("app.get('/api/admin/central/tenants'"), server.indexOf("app.get('/api/admin/central/schools'"));
    expect(routes).toContain('requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)');
    expect(routes).toContain('FROM public.tenants t');
    expect(routes).toContain('FROM public.subscriptions s');
    expect(routes).toContain('operation === \'archive\'');
    expect(routes).toContain("SET status = 'archived'");
    expect(routes).toContain("UPDATE public.schools");
    expect(routes).toContain("UPDATE public.branches");
    expect(routes).toContain("UPDATE public.users");
    expect(routes).toContain("UPDATE public.subscriptions");
    expect(routes).toContain('includeArchived');
    expect(routes).toContain("operation === 'restore'");
    expect(routes).toContain('restored_tenant AS');
  });

  it('keeps school, branch, and user central routes targetable by the verified platform scope', () => {
    const server = read('server.ts');
    expect(server).toContain("targetTenantId || req.body?.tenantId || identity?.tenantId");
    expect(server).toContain("($2::uuid IS NULL OR tenant_id = $2::uuid)");
    expect(server).toContain("($1::uuid IS NULL OR b.tenant_id = $1::uuid)");
    expect(server).toContain("($1::uuid IS NULL OR u.tenant_id = $1::uuid)");
    expect(server).toContain('const targetTenantId = scope.rows[0].tenant_id');
    expect(server).toContain('isCentralPlatformRequest');
  });

  it('enforces tenant lifecycle state at trusted login scope resolution', () => {
    const lifecycle = read('supabase/migrations/202608311000_tenant_lifecycle_guard.sql');
    expect(lifecycle).toContain('JOIN public.tenants AS t ON t.id = u.tenant_id');
    expect(lifecycle).toContain("t.status = 'active'");
    expect(lifecycle).toContain('public.platform_users');
    expect(lifecycle).toContain('dbsec004_resolve_login_username');
  });

  it('renders a real tenant management surface and tenant selector for school provisioning', () => {
    const tenants = read('src/components/super-admin/SuperAdminTenants.tsx');
    const view = read('src/components/SuperAdminView.tsx');
    const schools = read('src/components/super-admin/SuperAdminSchools.tsx');
    expect(tenants).toContain('/api/admin/central/tenants?includeArchived=true');
    expect(tenants).toContain("method: editingTenant ? 'PATCH' : 'POST'");
    expect(tenants).toContain("operation: 'archive'");
    expect(tenants).toContain("operation: 'restore'");
    expect(view).toContain("{ id: 'tenants', label: 'إدارة المستأجرين'");
    expect(view).toContain('<SuperAdminTenants');
    expect(schools).toContain('targetTenantId: newSchool.targetTenantId || tenants[0]?.id');
    expect(schools).toContain('المستأجر المالك للمدرسة');
  });
});
