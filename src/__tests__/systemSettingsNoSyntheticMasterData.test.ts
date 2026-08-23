import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/SystemSettingsPortal.tsx'),
  'utf8',
);

describe('system settings evidence safety', () => {
  it('does not seed master data or claim an unpersisted save', () => {
    expect(source).toContain('useState<any[]>([])');
    expect(source).toContain('خدمة حفظ الإعدادات المركزية غير متاحة');
    expect(source).not.toContain("nameAr: 'سعودي'");
    expect(source).not.toContain('تم حفظ وتحديث إعدادات قسم');
  });
});
