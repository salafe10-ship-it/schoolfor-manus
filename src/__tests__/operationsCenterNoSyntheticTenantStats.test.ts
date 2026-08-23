import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SuperAdminOperationsCenter authoritative tenant stats contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/components/super-admin/SuperAdminOperationsCenter.tsx'), 'utf8');

  it('derives user counts from tenant records and does not ship subscription chart fixtures', () => {
    expect(source).toContain('schools.reduce((acc, s) => acc + (s.usersCount || 0), 0)');
    expect(source).toContain('schools.reduce((acc, s) => acc + (s.employeesCount || 0), 0)');
    expect(source).toContain('const subscriptionChartData: { name: string; value: number; color: string }[] = [];');
    expect(source).not.toContain('245000');
    expect(source).not.toContain('12400');
    expect(source).not.toContain("value: 86.7");
  });
});
