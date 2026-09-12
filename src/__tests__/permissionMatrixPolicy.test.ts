import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { derivePermissionOverrides, hasPermissionMatrixChanges, resolveEffectivePermissions } from '../authorization/PermissionMatrixPolicy';

describe('mother-school permission matrix policy', () => {
  it('applies employee allows and makes explicit denies win over the job baseline', () => {
    expect(resolveEffectivePermissions(
      ['Student.View', 'Student.Write'],
      [
        { permissionKey: 'Student.Write', effect: 'deny' },
        { permissionKey: 'Exam.View', effect: 'allow' },
      ],
    )).toEqual(['Exam.View', 'Student.View']);
  });

  it('stores only differences from the job baseline', () => {
    expect(derivePermissionOverrides(
      ['Student.View', 'Student.Write'],
      ['Student.View', 'Exam.View'],
    )).toEqual([
      { permissionKey: 'Exam.View', effect: 'allow' },
      { permissionKey: 'Student.Write', effect: 'deny' },
    ]);
  });

  it('compares sets without depending on display order', () => {
    expect(hasPermissionMatrixChanges(['Exam.View', 'Student.View'], ['Student.View', 'Exam.View'])).toBe(false);
    expect(hasPermissionMatrixChanges(['Student.View'], [])).toBe(true);
  });

  it('keeps the mother-school matrix simple while persisting explicit allow and deny decisions', () => {
    const screen = readFileSync('src/components/super-admin/SuperAdminRbac.tsx', 'utf8');
    const server = readFileSync('server.ts', 'utf8');
    const migration = readFileSync('supabase/migrations/202609121000_user_permission_allow_deny.sql', 'utf8');
    expect(screen).toContain('الوظيفة وتحتها الموظفون');
    expect(screen).toContain('type="checkbox"');
    expect(screen).toContain('سماح خاص');
    expect(screen).toContain('منع خاص');
    expect(screen).toContain('/permission-overrides');
    expect(server).toContain("app.patch('/api/admin/central/users/:userId/permission-overrides'");
    expect(server).toContain("entry?.effect === 'deny'");
    expect(server).toContain("entry.permissionKey === PERMISSIONS.PLATFORM_ADMIN");
    expect(server).toContain("await client.query('BEGIN')");
    expect(server).toContain("'CentralPermissionMatrix'");
    expect(migration).toContain("CHECK (effect IN ('allow', 'deny'))");
  });
});
