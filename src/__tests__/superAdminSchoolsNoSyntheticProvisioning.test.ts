import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminSchools.tsx'),
  'utf8',
);

describe('super admin school provisioning evidence safety', () => {
  it('fails closed without the central tenant provisioning service', () => {
    const guard = 'خدمة تهيئة المستأجر المركزية غير متاحة';
    expect(source).toContain(guard);
    expect(source.indexOf(guard)).toBeLessThan(source.indexOf('const generatedPassword'));
    expect(source).not.toContain('تم إنشاء وتهيئة المدرسة بنجاح');
  });
});
