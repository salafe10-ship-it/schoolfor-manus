import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('central directory hydration contract', () => {
  it('hydrates schools and branches from the protected central endpoints before rendering control data', () => {
    const view = read('src/components/SuperAdminView.tsx');
    expect(view).toContain("authenticatedRequest('/api/admin/central/schools')");
    expect(view).toContain("authenticatedRequest('/api/admin/central/branches')");
    expect(view).toContain('void refreshCentralDirectory(false);');
    expect(view).toContain('usersCount: Number(school.users_count || 0)');
    expect(view).toContain('studentCount: Number(school.students_count || 0)');
    expect(view).toContain('directoryStatus');
  });

  it('keeps central control actions on the canonical school mutation route', () => {
    const operations = read('src/components/super-admin/SuperAdminOperationsCenter.tsx');
    expect(operations).toContain('const updateCentralSchool = async');
    expect(operations).toContain("operation: 'update'");
    expect(operations).toContain('onNavigateToTab?.(\'schools\')');
    expect(operations).toContain('onNavigateToTab?.(\'users\')');
    expect(operations).toContain('onNavigateToTab?.(\'subscriptions\')');
    expect(operations).not.toContain('لم يتم حفظ تعديل محلي');
  });

  it('returns tenant-scoped user and student counts for central reporting', () => {
    const server = read('server.ts');
    const schoolRoute = server.slice(server.indexOf("app.get('/api/admin/central/schools'"), server.indexOf("app.post('/api/admin/central/schools'"));
    const branchRoute = server.slice(server.indexOf("app.get('/api/admin/central/branches'"), server.indexOf("app.post('/api/admin/central/schools/:schoolId/branches'"));
    expect(schoolRoute).toContain('FROM public.users u');
    expect(schoolRoute).toContain('FROM public.students st');
    expect(schoolRoute).toContain('users_count');
    expect(schoolRoute).toContain('students_count');
    expect(branchRoute).toContain('FROM public.users u');
    expect(branchRoute).toContain('FROM public.students st');
  });
});
