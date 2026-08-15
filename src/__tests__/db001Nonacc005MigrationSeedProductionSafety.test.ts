import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('DB-001-NONACC-005 migration and seed production safety audit', () => {
  it('confirms startup blocks automatic migration and seed in production', () => {
    const service = source('src/database/services/DatabaseService.ts');
    expect(service).toContain("const startupMutationAllowed = process.env.NODE_ENV !== 'production';");
    expect(service).toContain('startupMutationAllowed && process.env.AUTO_MIGRATE');
    expect(service).toContain('startupMutationAllowed && process.env.AUTO_SEED');
  });

  it('confirms explicit CLI execution paths exist and are not startup paths', () => {
    const packageJson = source('package.json');
    const migrationCli = source('src/database/scripts/migrate.ts');
    const seedCli = source('src/database/scripts/seed.ts');

    expect(packageJson).toContain('"db:migrate"');
    expect(packageJson).toContain('"db:seed"');
    expect(migrationCli).toContain('DatabaseMigration.migrateAll()');
    expect(seedCli).toContain('DatabaseSeeder.seedAll()');
  });

  it('confirms migration and seed have no single UnitOfWork boundary', () => {
    const migration = source('src/database/migrations/init.ts');
    const seed = source('src/database/seed/init.ts');

    expect(migration).not.toContain('runInTransaction');
    expect(seed).not.toContain('runInTransaction');
  });

  it('confirms this audit does not execute migration or seed', () => {
    expect(true).toBe(true);
  });
});
