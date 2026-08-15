import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('DB-001-NONACC-006 production migration and seed CLI guard', () => {
  it('fails closed before calling DatabaseMigration in production', () => {
    const migration = source('src/database/scripts/migrate.ts');
    const guard = migration.indexOf("process.env.NODE_ENV === 'production'");
    const call = migration.indexOf('DatabaseMigration.migrateAll()');

    expect(guard).toBeGreaterThanOrEqual(0);
    expect(migration.indexOf('process.exit(1)', guard)).toBeGreaterThan(guard);
    expect(call).toBeGreaterThan(guard);
    expect(migration.slice(guard, call)).toContain('Production migration CLI is disabled');
  });

  it('fails closed before calling DatabaseSeeder in production and ignores the override', () => {
    const seed = source('src/database/scripts/seed.ts');
    const guard = seed.indexOf("process.env.NODE_ENV === 'production'");
    const call = seed.indexOf('DatabaseSeeder.seedAll()');

    expect(guard).toBeGreaterThanOrEqual(0);
    expect(seed.indexOf('process.exit(1)', guard)).toBeGreaterThan(guard);
    expect(call).toBeGreaterThan(guard);
    expect(seed.slice(guard, call)).toContain('ALLOW_PRODUCTION_SEED cannot override');
  });

  it('does not move or redesign the migration/seed engines', () => {
    expect(source('src/database/scripts/migrate.ts')).toContain("import { DatabaseMigration } from '../migrations/init.js'");
    expect(source('src/database/scripts/seed.ts')).toContain("import { DatabaseSeeder } from '../seed/init.js'");
  });
});
