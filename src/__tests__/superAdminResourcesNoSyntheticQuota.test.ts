import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('super admin resource integrity', () => {
  it('does not invent storage quotas when tenant data is absent', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminResources.tsx'), 'utf8');
    expect(source).toContain('parseResourceNumber(school.storageLimit)');
    expect(source).toContain("return null;");
    expect(source).toContain("limit !== null ? `${limit} GB` : 'غير متحقق'");
    expect(source).not.toContain("storageLimit || '0'");
    expect(source).not.toContain("storageLimit || '500'");
  });
});
