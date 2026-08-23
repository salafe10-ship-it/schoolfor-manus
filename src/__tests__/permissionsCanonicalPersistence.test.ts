import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/PermissionsManagementModule.tsx', 'utf8');

describe('permissions canonical persistence contract', () => {
  it('does not expose seeded RBAC data or save permissions locally in canonical mode', () => {
    expect(source).toContain('const canonicalPersistenceRequired = FallbackStorage.isCanonicalPersistenceRequired()');
    expect(source).toContain('if (canonicalPersistenceRequired) return []');
    expect(source).toContain('إدارة الصلاحيات متوقفة حتى يتم ربط مصفوفة RBAC');
  });
});
