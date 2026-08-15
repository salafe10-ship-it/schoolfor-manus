import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('DB-001-NONACC-001 persistence false-success containment', () => {
  it('guards every Attendance write before local fallback can return success', () => {
    const attendance = source('src/database/repositories/AttendanceRepository.ts');

    expect(attendance).toContain('FallbackStorage.assertCanonicalPersistence(`attendance create ${id}`)');
    expect(attendance).toContain('FallbackStorage.assertCanonicalPersistence(`attendance update ${id}`)');
    expect(attendance).toContain('FallbackStorage.assertCanonicalPersistence(`attendance delete ${id}`)');
    expect(attendance).toContain('FallbackStorage.assertCanonicalPersistence(`attendance bulk save ${prepared.length}`)');
  });

  it('guards Employee writes before local fallback can return success', () => {
    const employee = source('src/database/repositories/EmployeeRepository.ts');

    expect(employee).toContain('FallbackStorage.assertCanonicalPersistence(`teacher save ${id}`)');
    expect(employee).toContain('FallbackStorage.assertCanonicalPersistence(`teacher delete ${id}`)');
    expect(employee).toContain('FallbackStorage.assertCanonicalPersistence(`employee save ${id}`)');
    expect(employee).toContain('FallbackStorage.assertCanonicalPersistence(`employee delete ${id}`)');
  });

  it('guards Inventory writes before local fallback can return success', () => {
    const inventory = source('src/database/repositories/InventoryRepository.ts');

    expect(inventory).toContain('FallbackStorage.assertCanonicalPersistence(`inventory save ${id}`)');
    expect(inventory).toContain('FallbackStorage.assertCanonicalPersistence(`inventory delete ${id}`)');
  });

  it('does not add automatic mutation retry or central fallback changes', () => {
    const repositories = [
      source('src/database/repositories/AttendanceRepository.ts'),
      source('src/database/repositories/EmployeeRepository.ts'),
      source('src/database/repositories/InventoryRepository.ts')
    ].join('\n');

    expect(repositories).not.toContain('withRetry');
    expect(repositories).not.toContain('syncQueue');
    expect(repositories).not.toContain('FallbackStorage.performWrite');
  });
});
