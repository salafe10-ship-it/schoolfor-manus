import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminImpersonation.tsx'),
  'utf8',
);

describe('super admin impersonation evidence safety', () => {
  it('does not seed historical sessions or simulate a successful session locally', () => {
    expect(source).toContain('return saved ? JSON.parse(saved) : []');
    expect(source).toContain('خدمة الولوج الآمن المركزية غير متاحة');
    expect(source).not.toContain('imp_01');
    expect(source).not.toContain('imp_02');
  });
});
