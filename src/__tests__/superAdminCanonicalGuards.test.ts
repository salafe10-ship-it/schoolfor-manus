import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('super admin canonical guards', () => {
  it('blocks local tenant module and subscription mutations in canonical mode', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminOperationsCenter.tsx'), 'utf8');
    expect(file).toContain('FallbackStorage.isCanonicalPersistenceRequired()');
    expect(file).toContain('إدارة وحدات المستأجرين متوقفة');
    expect(file).toContain('تحديث اشتراك المستأجر متوقف');
  });
});
