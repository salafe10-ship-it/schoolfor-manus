import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string): string => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('login pre-auth identity contract', () => {
  it('starts with a neutral school and never seeds the tenant catalogue in App', () => {
    const source = read('src/App.tsx');
    expect(source).toContain("useState<School>(UNRESOLVED_SCHOOL)");
    expect(source).toContain("useState<any[]>([])");
    expect(source).not.toContain('schoolsSeed[0]');
    expect(source).not.toContain("name: 'مدارس النور الأهلية النموذجية'");
    expect(source).not.toContain("managerName: 'سليمان بن غازي'");
  });

  it('does not allow URL or local catalogue data to define trusted school identity', () => {
    const source = read('src/App.tsx');
    expect(source).not.toContain('setSelectedSchool(matched)');
    expect(source).not.toContain('seededSchool');
    expect(source).toContain('user.school && user.school.id === user.schoolId');
    expect(source).toContain("localStorage.removeItem('active_school_id')");
  });

  it('does not expose unsupported login security or support claims', () => {
    const source = read('src/components/SchoolClientLogin.tsx');
    expect(source).not.toContain('256-bit SSL');
    expect(source).not.toContain('800-123-456');
    expect(source).toContain('المصادقة المركزية تحمي جلسة الوصول إلى النظام');
  });
});

