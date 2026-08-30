import { describe, expect, it } from 'vitest';
import {
  PERMISSION_TYPE_LABELS,
  PERMISSIONS_TEST_FIXTURE,
  PERMISSIONS_TEST_FIXTURE_SIZE,
} from '../components/PermissionsManagementModule';

describe('permissions test fixture contract', () => {
  it('contains exactly 35 employees with varied jobs and departments', () => {
    expect(PERMISSIONS_TEST_FIXTURE_SIZE).toBe(35);
    expect(PERMISSIONS_TEST_FIXTURE).toHaveLength(35);
    expect(new Set(PERMISSIONS_TEST_FIXTURE.map(employee => employee.jobTitle)).size).toBeGreaterThanOrEqual(30);
    expect(new Set(PERMISSIONS_TEST_FIXTURE.map(employee => employee.department)).size).toBeGreaterThanOrEqual(12);
    expect(PERMISSIONS_TEST_FIXTURE.every(employee => employee.status === 'active')).toBe(true);
  });

  it('stores an explicit permission type and a non-empty permission set per employee', () => {
    expect(PERMISSIONS_TEST_FIXTURE.every(employee => Boolean(employee.permissionType))).toBe(true);
    expect(PERMISSIONS_TEST_FIXTURE.every(employee =>
      employee.permissionType && employee.permissionType in PERMISSION_TYPE_LABELS,
    )).toBe(true);
    expect(PERMISSIONS_TEST_FIXTURE.every(employee => employee.permissions.length > 0)).toBe(true);
    expect(PERMISSIONS_TEST_FIXTURE.some(employee => employee.permissions.includes('*'))).toBe(true);
    expect(new Set(PERMISSIONS_TEST_FIXTURE.map(employee => employee.permissionType)).size).toBeGreaterThanOrEqual(7);
  });
});
