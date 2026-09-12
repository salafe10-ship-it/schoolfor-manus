import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('school-scoped identity directory contracts', () => {
  it('keeps school identity routes scoped to the trusted tenant and school', () => {
    const server = read('server.ts');
    expect(server).toContain("app.get('/api/school/users'");
    expect(server).toContain("app.post('/api/school/users'");
    expect(server).toContain("app.get('/api/school/job-catalog'");
    expect(server).toContain('await ensureCanonicalRbacDefaults(client, tenantId);');
    expect(server).toContain("await client.query('BEGIN');");
    expect(server).toContain("app.patch('/api/school/users/:userId'");
    expect(server).toContain("requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_READ)");
    expect(server).toContain("app.patch('/api/school/users/:userId', authenticateRequest, requireSchoolIdentityMutationPermission");
    expect(server).toContain('requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_WRITE), requirePermissionOnly(PERMISSIONS.IDENTITY_USERS_ASSIGN)');
    expect(server).toContain('u.tenant_id = $1::uuid AND u.school_id = $2::uuid');
    expect(server).toContain('platformAdminAuth.auth.admin.createUser');
    expect(server).toContain("roleKey === 'platformadmin'");
    expect(server).toContain("'SchoolIdentityRoute'");
    expect(server).toContain('identity.school_user.');
    expect(server).toContain('user_permission_grants');
    expect(server).toContain("operation === 'set_permissions'");
    expect(server).toContain('permissionKeys.length !== requested.length');
    expect(server).toContain('permissionCatalog');
    expect(server).toContain('const loginIdentity = provisionLoginIdentity(req.body?.email);');
    expect(server).toContain('loginIdentifier: loginIdentity.loginIdentifier');
    expect(server).toContain('username, email');
    expect(server).toContain('roleLookup');
    expect(server).toContain('الدور غير منشور من المدرسة الأم');
    expect(server).toContain('job_id');
    expect(server).toContain('const ensureIdentityJobSchema = async');
    expect(server).toContain('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS job_id text');
    expect(server).toContain('await ensureIdentityJobSchema();');
    expect(server).toContain('readSchoolIdentityDirectoryFromControl');
    expect(server).toContain("from('users').select(columnsWithJob)");
    expect(server).toContain("from('hr_database').select('data')");
    expect(server).toContain('jsonb_array_elements(COALESCE(h.data->\'jobs\'' );
  });

  it('registers the identity capability catalog without Platform.Admin', () => {
    const registry = read('src/authorization/PermissionRegistry.ts');
    const migration = read('supabase/migrations/202609091400_school_identity_directory.sql');
    expect(registry).toContain("IDENTITY_USERS_READ: 'Identity.Users.Read'");
    expect(registry).toContain("IDENTITY_USERS_WRITE: 'Identity.Users.Write'");
    expect(registry).toContain("IDENTITY_USERS_ASSIGN: 'Identity.Users.Assign'");
    expect(migration).toContain("'Identity.Users.Audit'");
    expect(migration).toContain("r.role_key = 'schooladmin'");
    expect(migration).not.toContain("'Platform.Admin'");
  });

  it('exposes a canonical, server-backed school UI and header entry point', () => {
    const module = read('src/components/school/SchoolUsersPermissionsModule.tsx');
    const app = read('src/App.tsx');
    const topbar = read('src/components/Topbar.tsx');
    expect(module).toContain("authenticatedRequest('/api/school/users'");
    expect(module).toContain("authenticatedRequest('/api/school/identity-roles'");
    expect(module).toContain("authenticatedRequest('/api/school/job-catalog'");
    expect(module).toContain('Promise.allSettled');
    expect(module).toContain('تم تحميل الأجزاء المتاحة دون إخفاء البيانات السليمة');
    expect(module).toContain('لا توجد وظائف منشورة من شؤون الموظفين');
    expect(module).toContain("operation, expectedVersion: user.version");
    expect(module).toContain('إدارة الصلاحيات');
    expect(module).toContain("'set_permissions'");
    expect(module).toContain('canManage');
    expect(module).toContain('canAssign');
    expect(module).toContain('صلاحيات الإدارة مفصولة');
    expect(module).toContain('البريد الإلكتروني <span className="font-normal text-slate-500">(اختياري)</span>');
    expect(module).toContain('تم الحفظ بنجاح وتأكيد الربط بقاعدة البيانات.');
    expect(module).toContain('لا توجد أدوار معتمدة منشورة');
    expect(module).toContain('const openNewUser = () =>');
    expect(module).toContain('aria-label="إغلاق نافذة المستخدم"');
    expect(module).toContain('حفظ التعديل');
    expect(module).toContain('type="submit" disabled={saving || (!editing && (!canCreate || roles.length === 0))}');
    expect(module).toContain("const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');");
    expect(module).toContain('تصفية حسب الحالة');
    expect(module).toContain('تصفية حسب الدور');
    expect(module).toContain("mutate(user, 'evict_sessions')");
    expect(module).toContain("mutate(user, 'force_password'");
    expect(module).toContain('window.confirm');
    expect(module).toContain('branchId: selectedBranch?.id ||');
    expect(module).toContain('autoComplete="new-password"');
    expect(module).not.toContain('localStorage');
    expect(app).toContain("activeSection === 'school_users_admin'");
    expect(read('src/components/ModernSchoolDashboard.tsx')).toContain("section: 'school_users_admin'");
    expect(topbar).not.toContain('school-users-permissions-header-btn');
    expect(module).toContain('العودة للقائمة الرئيسية');
  });

  it('supports username login for email-less school accounts without fabricating a public email', () => {
    const migration = read('supabase/migrations/202609101000_optional_school_user_email.sql');
    expect(migration).toContain('JOIN auth.users AS au ON au.id = u.auth_user_id');
    expect(migration).toContain('au.email IS NOT NULL');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.dbsec004_resolve_login_username(text)');
  });

  it('accepts centrally-created custom roles without weakening database authorization', () => {
    const resolver = read('src/authorization/RoleResolver.ts');
    const rbac = read('src/components/super-admin/SuperAdminRbac.tsx');
    const schoolModule = read('src/components/school/SchoolUsersPermissionsModule.tsx');
    expect(resolver).toContain('Database-backed roles are the source of truth');
    expect(resolver).not.toContain('roleKeys.some(role => !ROLE_PERMISSIONS[role])');
    expect(rbac).toContain('toggleNewRolePermission');
    expect(rbac).toContain('حفظ الوظيفة واعتمادها');
    expect(rbac).toContain('المسمى الوظيفي');
    expect(schoolModule).toContain('الوظيفة من دليل شؤون الموظفين');
    expect(read('supabase/migrations/202609101200_identity_job_reference.sql')).toContain('ADD COLUMN IF NOT EXISTS job_id');
  });
});
