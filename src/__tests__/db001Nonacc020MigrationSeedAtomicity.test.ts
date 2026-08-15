import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('DB-001-NONACC-020 migration and seed transaction contract', () => {
  it('requires a configured PostgreSQL driver and one UnitOfWork boundary', () => {
    const migration = source('src/database/migrations/init.ts');
    const seed = source('src/database/seed/init.ts');

    for (const content of [migration, seed]) {
      expect(content).toContain('UnitOfWork.hasTransactionDriver()');
      expect(content).toContain('UnitOfWork.runInTransaction');
      expect(content).toContain('UnitOfWork.getActiveContext()?.databaseTransaction');
      expect(content).toContain('jsonb_populate_recordset');
      expect(content).toContain('success: false');
    }
  });

  it('does not retain REST writes, retries, or autonomous partial-success reporting', () => {
    const migration = source('src/database/migrations/init.ts');
    const seed = source('src/database/seed/init.ts');
    const combined = `${migration}\n${seed}`;

    expect(combined).not.toContain('.from(');
    expect(combined).not.toContain('withRetry');
    expect(combined).not.toContain('retry');
    expect(combined).not.toContain('migratedStudents: studentsCount');
    expect(combined).not.toContain('seededTables: seeded, success: false');
  });

  it('configures and closes the transaction driver only in the explicit CLI', () => {
    const migrationCli = source('src/database/scripts/migrate.ts');
    const seedCli = source('src/database/scripts/seed.ts');

    for (const content of [migrationCli, seedCli]) {
      expect(content).toContain('createPostgresTransactionDriverFromEnvironment');
      expect(content).toContain('UnitOfWork.configureTransactionDriver(transactionDriver)');
      expect(content).toContain('await transactionDriver.close()');
      expect(content).toContain("process.env.NODE_ENV === 'production'");
    }
  });
});
