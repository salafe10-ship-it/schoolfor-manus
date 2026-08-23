import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('backup integrity', () => {
  it('does not seed or claim backups without a central storage connection', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminBackups.tsx'), 'utf8');
    expect(source).toContain('useState<any[]>([])');
    expect(source).toContain('خدمة التخزين المركزية غير متصلة أو غير موثقة');
    expect(source).not.toContain('snap_01');
    expect(source).not.toContain('SHA256:7f4a');
    expect(source.indexOf('خدمة التخزين المركزية غير متصلة أو غير موثقة')).toBeLessThan(source.indexOf('setIsCreatingBackup(true);'));
  });
});
