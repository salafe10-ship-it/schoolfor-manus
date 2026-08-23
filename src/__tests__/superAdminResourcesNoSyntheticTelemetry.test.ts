import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminResources.tsx'),
  'utf8',
);

describe('super admin resources evidence safety', () => {
  it('does not provide synthetic history or local optimization success', () => {
    expect(source).toContain('const historyData: any[] = [];');
    expect(source).toContain('خدمة صيانة قاعدة البيانات المركزية غير متاحة');
    expect(source).toContain('خدمة التخزين المركزي غير متاحة');
    expect(source).not.toContain('activeQueries: 14800');
    expect(source).not.toContain('optimizedUsed');
  });
});
