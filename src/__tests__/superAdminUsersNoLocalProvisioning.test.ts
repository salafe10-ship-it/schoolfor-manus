import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminUsers.tsx'),
  'utf8',
);

describe('super admin user provisioning evidence safety', () => {
  it('fails closed without the central identity service', () => {
    const guard = 'خدمة الهوية المركزية غير متاحة';
    expect(source).toContain(guard);
    expect(source.indexOf(guard)).toBeLessThan(source.indexOf('const matchedSchoolName'));
    expect(source).not.toContain('مدرسة سحابية');
    expect(source).not.toContain('تم إنشاء حساب المستخدم بنجاح ومزامنته مع القنوات');
  });
});
