import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('central administration review contracts', () => {
  const server = read('server.ts');

  it('exposes tenant-scoped central branch CRUD with verified platform permission', () => {
    expect(server).toContain("app.get('/api/admin/central/branches'");
    expect(server).toContain("app.post('/api/admin/central/schools/:schoolId/branches'");
    expect(server).toContain("app.patch('/api/admin/central/branches/:branchId'");
    const branchRoutes = server.slice(server.indexOf("app.get('/api/admin/central/branches'"), server.indexOf('async function resolveStudentTenantContext'));
    expect(branchRoutes).toContain('requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)');
    expect(branchRoutes).toContain('b.tenant_id = $1');
    expect(branchRoutes).toContain('b.tenant_id = $2');
    expect(branchRoutes).toContain("operation === 'set_main'");
    expect(branchRoutes).not.toContain('req.body?.tenantId');
  });

  it('keeps branch mutations canonical instead of accepting local success', () => {
    const branches = read('src/components/super-admin/SuperAdminBranches.tsx');
    expect(branches).toContain("authenticatedRequest('/api/admin/central/branches'");
    expect(branches).toContain("/api/admin/central/schools/${encodeURIComponent(selectedSchoolId)}/branches");
    expect(branches).toContain('centralBranchMutation');
    expect(branches).not.toContain('branch_s${selectedSchoolId.split');
    expect(branches).not.toContain('setTimeout(');
  });

  it('connects central identity, RBAC, and notifications to canonical backends', () => {
    expect(server).toContain("app.get('/api/admin/central/users'");
    expect(server).toContain("app.post('/api/admin/central/schools/:schoolId/users'");
    expect(server).toContain("app.patch('/api/admin/central/users/:userId'");
    expect(server).toContain("app.get('/api/admin/central/rbac'");
    expect(server).toContain("app.patch('/api/admin/central/rbac/roles/:roleId'");
    expect(server).toContain("app.get('/api/admin/central/notifications'");
    expect(server).toContain("app.post('/api/admin/central/notifications'");
    const central = server.slice(server.indexOf("app.get('/api/admin/central/users'"), server.indexOf('async function resolveStudentTenantContext'));
    expect(central).toContain('platformAdminAuth.auth.admin.createUser');
    expect(central).toContain('notification_queue');
    expect(central).toContain('requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)');
    expect(central).not.toContain('localStorage');
  });

  it('uses central API contracts in the users, RBAC, and notifications screens', () => {
    const users = read('src/components/super-admin/SuperAdminUsers.tsx');
    const rbac = read('src/components/super-admin/SuperAdminRbac.tsx');
    const notifications = read('src/components/super-admin/SuperAdminCentralNotifications.tsx');
    expect(users).toContain('/api/admin/central/users');
    expect(rbac).toContain('/api/admin/central/rbac');
    expect(rbac).toContain('تم اعتماد صلاحيات دور');
    expect(notifications).toContain('/api/admin/central/notifications');
    expect(notifications).not.toContain('localStorage');
  });

  it('does not open an unverified local impersonation session', () => {
    const view = read('src/components/SuperAdminView.tsx');
    const start = view.indexOf('const handleImpersonateSchool');
    const end = view.indexOf('const handleOpenSchoolLogin', start);
    const handler = view.slice(start, end);
    expect(handler).toContain('جلسة انتحال مركزية');
    expect(handler).not.toContain('localStorage.setItem');
    expect(handler).not.toContain('setCurrentPortal');
  });

  it('makes unsupported high-impact operations fail closed', () => {
    const schools = read('src/components/super-admin/SuperAdminSchools.tsx');
    const subscriptions = read('src/components/super-admin/SuperAdminSubscriptions.tsx');
    const cloneStart = schools.indexOf('const handleRunCloneSettings');
    const cloneEnd = schools.indexOf('// Reset clone wizard', cloneStart);
    expect(schools.slice(cloneStart, cloneEnd)).toContain('لم يتم تعديل أي مدرسة');
    expect(schools.slice(cloneStart, cloneEnd)).not.toContain('setTimeout(');
    expect(subscriptions).toContain('يحتاج موصل إشعارات مركزي');
    expect(subscriptions).not.toContain('تم بث إشعار التنبيه بنجاح');
  });
});
