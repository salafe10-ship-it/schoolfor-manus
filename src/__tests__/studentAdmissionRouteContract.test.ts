import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const serverSource = readFileSync(resolve(projectRoot, 'server.ts'), 'utf8');
const permissionSource = readFileSync(resolve(projectRoot, 'src/authorization/PermissionRegistry.ts'), 'utf8');
const roleSource = readFileSync(resolve(projectRoot, 'src/authorization/RoleResolver.ts'), 'utf8');
const repositorySource = readFileSync(
  resolve(projectRoot, 'src/modules/student-admission/repository/SupabaseAdmissionInquiryRepository.ts'),
  'utf8'
);

describe('Student admission route contract', () => {
  it('registers a read inbox route with trusted authentication, tenant resolution and read permission', () => {
    const route = serverSource.slice(
      serverSource.indexOf("app.get('/api/admissions/inquiries'"),
      serverSource.indexOf("app.post('/api/admissions/inquiries'")
    );
    expect(route).toContain("authenticateRequest");
    expect(route).toContain('requirePermission(PERMISSIONS.ADMISSION_READ)');
    expect(route).toContain('resolveStudentTenantContext(req)');
    expect(route).toContain('findByScope');
  });

  it('registers write and status transition routes with the write permission', () => {
    const createRoute = serverSource.slice(
      serverSource.indexOf("app.post('/api/admissions/inquiries'"),
      serverSource.indexOf("app.patch('/api/admissions/inquiries/:id/status'")
    );
    const transitionRoute = serverSource.slice(
      serverSource.indexOf("app.patch('/api/admissions/inquiries/:id/status'")
    );
    expect(createRoute).toContain('requirePermission(PERMISSIONS.ADMISSION_WRITE)');
    expect(createRoute).toContain('resolveStudentTenantContext(req)');
    expect(transitionRoute).toContain('requirePermission(PERMISSIONS.ADMISSION_WRITE)');
    expect(transitionRoute).toContain('resolveStudentTenantContext(req)');
    expect(transitionRoute).toContain('findByIdInScope');
    expect(transitionRoute).toContain('transitionTo');
  });

  it('uses a request-scoped client and never accepts command scope from the request body', () => {
    expect(serverSource).toContain('getSupabaseClientForAccessToken((req as any).trustedAccessToken)');
    const createRoute = serverSource.slice(
      serverSource.indexOf("app.post('/api/admissions/inquiries'"),
      serverSource.indexOf("app.patch('/api/admissions/inquiries/:id/status'")
    );
    expect(createRoute).toContain('tenantId: context.tenantId');
    expect(createRoute).toContain('schoolId: context.schoolId');
    expect(createRoute).toContain('branchId: context.branchId');
    expect(createRoute).not.toContain('req.body?.schoolId');
    expect(createRoute).not.toContain('req.body?.branchId');
  });

  it('proves the canonical repository applies all three scope predicates for reads and single-record lookup', () => {
    expect(repositorySource).toContain(".eq('tenant_id', scope.tenantId)");
    expect(repositorySource).toContain(".eq('school_id', scope.schoolId)");
    expect(repositorySource).toContain(".eq('branch_id', scope.branchId)");
    expect(repositorySource).toContain(".eq('id', id)");
  });

  it('registers the admission permission codes and grants them to student affairs', () => {
    expect(permissionSource).toContain("ADMISSION_READ: 'Admission.Read'");
    expect(permissionSource).toContain("ADMISSION_WRITE: 'Admission.Write'");
    expect(roleSource).toContain("'Admission.Read'");
    expect(roleSource).toContain("'Admission.Write'");
  });
});
