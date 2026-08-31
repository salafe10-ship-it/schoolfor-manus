import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminUpdates.tsx'),
  'utf8',
);

describe('super admin updates evidence safety', () => {
  it('does not seed releases or simulate deployment locally', () => {
    expect(source).toContain('const [releases] = useState<any[]>([]);');
    expect(source).toContain('خدمة النشر المركزية غير متاحة');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('setTimeout');
    expect(source).not.toContain('v2.4.2');
    expect(source).not.toContain('v2.4.0');
  });
});
