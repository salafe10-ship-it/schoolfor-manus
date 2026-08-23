import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('HR form canonical guards', () => {
  it('blocks every local-only HR form save in canonical mode', () => {
    const file = fs.readFileSync(path.resolve(process.cwd(), 'src/components/hr/OtherHRTabs.tsx'), 'utf8');
    expect((file.match(/FallbackStorage\.isCanonicalPersistenceRequired\(\)/g) || []).length).toBeGreaterThanOrEqual(10);
    expect(file).toContain('حفظ العقود متوقف');
    expect(file).toContain('حفظ إعدادات الموارد البشرية متوقف');
  });
});
