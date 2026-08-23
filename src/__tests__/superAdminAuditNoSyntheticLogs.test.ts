import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminAudit.tsx'),
  'utf8',
);

describe('super admin audit evidence safety', () => {
  it('starts with no audit history without persisted evidence', () => {
    expect(source).toContain('return [];');
    expect(source).not.toContain("id: 'log_01'");
    expect(source).not.toContain('185.220.101.44');
  });
});
