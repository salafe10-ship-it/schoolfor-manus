import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('DB-001-NONACC-007 migration and seed atomicity audit', () => {
  it('confirms migration steps share one PostgreSQL transaction boundary', () => {
    const migration = source('src/database/migrations/init.ts');

    expect(migration).toContain('UnitOfWork.runInTransaction');
    expect(migration).toContain('databaseTransaction');
    expect(migration).toContain('StudentAffairsMigration.migrateAll()');
    expect(migration).not.toContain(".from('students')");
    expect(migration).not.toContain(".from('exams_database')");
  });

  it('confirms seed steps share one PostgreSQL transaction boundary', () => {
    const seed = source('src/database/seed/init.ts');

    for (const table of ['schools', 'branches', 'teachers', 'employees', 'inventory', 'buses']) {
      expect(seed).toContain(`'${table}'`);
    }
    expect(seed).toContain('UnitOfWork.runInTransaction');
    expect(seed).toContain('databaseTransaction');
    expect(seed).not.toContain('getSupabaseClient');
  });

  it('confirms no automatic retry or recovery workflow is defined in either engine', () => {
    const migration = source('src/database/migrations/init.ts');
    const seed = source('src/database/seed/init.ts');

    expect(`${migration}\n${seed}`).not.toContain('withRetry');
    expect(`${migration}\n${seed}`).not.toContain('retry');
    expect(`${migration}\n${seed}`).not.toContain('reconcile');
  });
});
