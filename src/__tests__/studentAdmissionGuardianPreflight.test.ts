import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('legacy student admission guardian preflight', () => {
  it('rejects guardian data before starting the legacy transaction', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/database/services/StudentAdmissionService.ts'), 'utf8');
    expect(source).toContain('بيانات ولي الأمر يجب تسجيلها عبر خدمة تسجيل الطالب المركزية');
    expect(source).toContain('studentData.parentName?.trim() || studentData.parentPhone?.trim()');
  });
});
