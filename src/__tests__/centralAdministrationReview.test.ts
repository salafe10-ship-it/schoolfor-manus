import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('central administration review contracts', () => {
  const server = read('server.ts');

  it('exposes globally targetable central branch CRUD with verified platform permission', () => {
    expect(server).toContain("app.get('/api/admin/central/branches'");
    expect(server).toContain("app.post('/api/admin/central/schools/:schoolId/branches'");
    expect(server).toContain("app.patch('/api/admin/central/branches/:branchId'");
    const branchRoutes = server.slice(server.indexOf("app.get('/api/admin/central/branches'"), server.indexOf('async function resolveStudentTenantContext'));
    expect(branchRoutes).toContain('requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)');
    expect(branchRoutes).toContain('($1::uuid IS NULL OR b.tenant_id = $1::uuid)');
    expect(branchRoutes).toContain('($2::uuid IS NULL OR tenant_id = $2::uuid)');
    expect(branchRoutes).toContain("operation === 'set_main'");
    expect(branchRoutes).toContain('req.body?.targetTenantId');
    expect(branchRoutes).toContain('req.query?.tenantId');
    expect(branchRoutes).toContain("s.status IN ('provisioning', 'active')");
    expect(branchRoutes).toContain("t.status IN ('provisioning', 'active')");
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

  it('reports only a truthful canonical database round trip from central health', () => {
    const health = read('src/components/super-admin/SuperAdminHealth.tsx');
    expect(server).toContain("app.get('/api/admin/central/health', authenticateRequest, requirePermissionOnly(PERMISSIONS.PLATFORM_ADMIN)");
    expect(server).toContain("SELECT now() AS checked_at");
    expect(server).toContain("database: 'reachable'");
    expect(server).toContain("schemaStatus: missingSchemaObjects.length ? 'migration_pending' : 'ready'");
    expect(server).toContain("uq_schools_live_central_subdomain");
    expect(health).toContain("authenticatedRequest('/api/admin/central/health')");
    expect(health).toContain('زمن استجابة PostgreSQL المركزي');
    expect(health).toContain('ترحيلات الإدارة المركزية غير مكتملة');
    expect(health).not.toContain('Math.random');
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

  it('hydrates school licensing views from the tenant subscription source', () => {
    const view = read('src/components/SuperAdminView.tsx');
    const schools = read('src/components/super-admin/SuperAdminSchools.tsx');
    expect(server).toContain('sub.plan_code AS subscription_plan_code');
    expect(server).toContain('subscription_ends_at');
    expect(server).toContain('t.status AS tenant_status');
    expect(view).toContain('subscriptionEnd: school.subscription?.ends_at');
    expect(view).toContain('tenantStatus: school.tenant_status || undefined');
    expect(view).toContain('userLimit: school.subscription?.seat_limit');
    expect(server).toContain('suppliedLegacySubscriptionKey');
    expect(server).toContain('لا يمكن تأسيس مدرسة داخل مستأجر موقوف أو مؤرشف');
    expect(schools).toContain("school?.tenantStatus === 'suspended' ? 'suspended' : school?.status");
    expect(server).toContain('archived_branches AS');
    expect(server).toContain('archived_users AS');
    expect(server).toContain("operation === 'restore'");
    expect(schools).toContain("operation: 'restore'");
    expect(schools).toContain('تمت استعادة ${school.name} كمعلقة');
    expect(schools).not.toContain('plan: newSchool.plan');
  });

  it('protects central routing identifiers from duplicate live assignments', () => {
    const domains = read('src/components/super-admin/SuperAdminDomains.tsx');
    const migration = read('supabase/migrations/202608311100_central_domain_uniqueness.sql');
    expect(server).toContain('requestedSubdomain');
    expect(server).toContain('النطاق المطلوب مستخدم مسبقاً');
    expect(domains).toContain("sslStatus: sslStatus");
    expect(domains).toContain("school.domain || school.customDomain || ''");
    expect(migration).toContain('uq_schools_live_central_subdomain');
    expect(migration).toContain('uq_schools_live_central_domain');
    expect(migration).toContain("NULLIF(btrim(central_metadata->>'customDomain'), '')");
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
    expect(subscriptions).not.toContain('return 999');
    expect(subscriptions).not.toContain("school.plan === 'Basic' || school.isTrial");
    expect(subscriptions).toContain('days !== null');
    expect(subscriptions).toContain('/api/admin/central/tenants/${encodeURIComponent(tenant.id)}');
    expect(subscriptions).toContain("operation: 'update'");
    expect(subscriptions).toContain('updateCanonicalTenantStatus(tenant, updatedStatus)');
    expect(subscriptions).toContain('لا يوجد اشتراك كانونى مرتبط بهذه المدرسة');
    const observabilityRoutes = server.slice(server.indexOf('// Database observability and backup endpoints'), server.indexOf('// Student Data Export'));
    expect(observabilityRoutes).toContain("code: 'OBSERVABILITY_CONNECTOR_UNAVAILABLE'");
    expect(observabilityRoutes).not.toContain('Math.random()');
  });
});
