import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('super admin count integrity', () => {
  it('derives student and user counts from tenant data', () => {
    const dashboard = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminDashboard.tsx'), 'utf8');
    const resources = fs.readFileSync(path.resolve(process.cwd(), 'src/components/super-admin/SuperAdminResources.tsx'), 'utf8');
    expect(dashboard).toContain('Number(school.studentCount)');
    expect(dashboard).toContain("studentCounts.length ? totalStudentsCount.toLocaleString('ar-EG') : 'غير متحقق'");
    expect(resources).toContain('parseResourceNumber(s.usersCount)');
    expect(resources).toContain('parseResourceNumber(s.studentCount)');
    expect(resources).not.toContain('s.studentCount || 0');
    expect(dashboard).not.toContain('245000');
    expect(resources).not.toContain('245000');
  });
});
