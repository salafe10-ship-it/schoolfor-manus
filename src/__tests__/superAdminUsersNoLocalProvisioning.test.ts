import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminUsers.tsx'),
  'utf8',
);

describe('super admin user provisioning evidence safety', () => {
  it('uses the canonical central identity service instead of local provisioning', () => {
    expect(source).toContain("authenticatedRequest('/api/admin/central/users'");
    expect(source).toContain('/api/admin/central/schools/${encodeURIComponent(newUser.schoolId)}/users');
    expect(source).not.toContain('localStorage.setItem');
    expect(source).not.toContain('مدرسة سحابية');
    expect(source).not.toContain('تم إنشاء حساب المستخدم بنجاح ومزامنته مع القنوات');
  });
});
