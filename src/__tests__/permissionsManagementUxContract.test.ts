import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const permissionsSource = readFileSync(
  resolve(process.cwd(), 'src/components/PermissionsManagementModule.tsx'),
  'utf8',
);
const dashboardSource = readFileSync(
  resolve(process.cwd(), 'src/components/ModernSchoolDashboard.tsx'),
  'utf8',
);
const appSource = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');

describe('Users and Permissions center UX contract', () => {
  it('uses the canonical Arabic unit name throughout the entry points', () => {
    expect(dashboardSource).toContain("{ section: 'permissions_admin', label: 'المستخدمون والصلاحيات'");
    expect(appSource).toContain("activeSection === 'permissions_admin' ? 'المستخدمون والصلاحيات'");
    expect(permissionsSource).toContain('مركز المستخدمين والصلاحيات');
  });

  it('exposes module, screen, action, data-scope, and report controls', () => {
    for (const catalogToken of ['PERMISSIONS_CATEGORIES_TREE', 'DATA_SCOPE_CATALOG', 'REPORT_PERMISSION_CATALOG', 'ALL_AUTHORIZATION_KEYS']) {
      expect(permissionsSource).toContain(catalogToken);
    }
    for (const moduleId of ['admissions', 'academic', 'inventory', 'fixed_assets', 'permissions_admin', 'settings']) {
      expect(permissionsSource).toContain(`id: '${moduleId}'`);
    }
    expect(permissionsSource).toContain('بحث داخل الوحدات والشاشات');
    expect(permissionsSource).toContain('توسيع الكل');
    expect(permissionsSource).toContain('طي الكل');
    expect(permissionsSource).toContain("useState<'employee_matrix' | 'modules' | 'data' | 'reports'>('employee_matrix')");
    expect(permissionsSource).toContain('employeeGroupLabel');
    expect(permissionsSource).toContain('مصفوفة الموظفين حسب الإدارة والمسمى');
  });

  it('renders every permission control as an accessible checkbox and avoids fake live counts', () => {
    expect(permissionsSource).toContain('role="checkbox"');
    expect(permissionsSource).toContain('aria-checked={checked}');
    expect(permissionsSource).toContain('aria-checked={isCategoryFullyGranted}');
    expect(permissionsSource).toContain('مصدر الهوية المركزي مطلوب للحفظ');
    expect(permissionsSource).not.toContain('>180</span>');
    expect(permissionsSource).not.toContain('>45</span>');
  });

  it('keeps the dense ERP command-bar pattern while exposing a saved permission profile', () => {
    expect(permissionsSource).toContain('أدوات المصفوفة');
    expect(permissionsSource).toContain('تفاصيل الوظائف');
    expect(permissionsSource).toContain('التصفية حسب نوع الصلاحية');
    expect(permissionsSource).toContain('edupro_permission_profile_types_v1');
    expect(permissionsSource).toContain('permissionTypeLabel');
    expect(permissionsSource).toContain('✓ ممنوح');
    expect(permissionsSource).toContain('— غير ممنوح');
  });
});
