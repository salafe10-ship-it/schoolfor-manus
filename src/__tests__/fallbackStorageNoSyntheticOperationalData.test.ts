import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/database/repositories/FallbackStorage.ts'),
  'utf8',
);

describe('fallback storage evidence safety', () => {
  it('does not seed operational records when persisted files are absent', () => {
    for (const field of ['students', 'invoices', 'teachers', 'employees', 'inventory', 'buses', 'auditLogs', 'attendance', 'uniforms', 'library', 'guardians']) {
      expect(source).toContain(`this.${field} =`);
    }
    expect(source).toContain("this.students = [];");
    expect(source).toContain("'invoices_database.json', []");
    expect(source).toContain("'library_database.json', []");
    expect(source).not.toContain("id: 'stud_1'");
    expect(source).not.toContain("id: 'guard_1'");
  });
});
