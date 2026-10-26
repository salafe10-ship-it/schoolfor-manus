import { describe, expect, it } from 'vitest';
import { isolatedTenantFixtures } from '../../tests/fixtures/isolatedTenants';

describe('isolated tenant fixtures', () => {
  it('contains multiple synthetic schools and two branches per school', () => {
    expect(isolatedTenantFixtures.schools).toHaveLength(2);
    for (const school of isolatedTenantFixtures.schools) {
      expect(school.isSynthetic).toBe(true);
      expect(isolatedTenantFixtures.branches.filter((branch) => branch.schoolId === school.id)).toHaveLength(2);
    }
  });

  it('keeps every fixture identifier synthetic and unique', () => {
    const records = [
      ...isolatedTenantFixtures.schools,
      ...isolatedTenantFixtures.branches,
      ...isolatedTenantFixtures.users,
      ...isolatedTenantFixtures.students,
      ...isolatedTenantFixtures.fees,
    ];
    const ids = records.map((record) => record.id);

    expect(ids.every((id) => id.startsWith('test-'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(records.every((record) => record.isSynthetic)).toBe(true);
  });

  it('keeps student fees attached to a student in the same school', () => {
    for (const fee of isolatedTenantFixtures.fees) {
      const student = isolatedTenantFixtures.students.find((candidate) => candidate.id === fee.studentId);
      expect(student).toBeDefined();
      expect(student?.schoolId).toBe(fee.schoolId);
      expect(Number.isInteger(fee.amountMinor)).toBe(true);
      expect(fee.amountMinor).toBeGreaterThan(0);
    }
  });
});
