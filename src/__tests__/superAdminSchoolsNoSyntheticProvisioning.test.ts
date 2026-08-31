import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminSchools.tsx'),
  'utf8',
);

describe('super admin school provisioning evidence safety', () => {
  it('routes provisioning through the central tenant service before claiming success', () => {
    const request = "authenticatedRequest('/api/admin/central/schools',";
    const success = 'تم إنشاء المدرسة والفرع في قاعدة البيانات المركزية';
    expect(source).toContain(request);
    expect(source.indexOf(request)).toBeLessThan(source.indexOf(success));
    expect(source).toContain('تعذر إنشاء المدرسة مركزياً؛ لم يتم تعديل البيانات.');
    expect(source).not.toContain('const generatedPassword');
  });
});
