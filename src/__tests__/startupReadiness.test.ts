import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createStartupReadiness } from '../../server/infrastructure/StartupReadiness';

describe('INF-001A startup readiness contract', () => {
  it('does not report readiness while the database initialization is pending', () => {
    const readiness = createStartupReadiness();
    expect(readiness.snapshot()).toMatchObject({
      state: 'INITIALIZING',
      database: 'PENDING',
      ready: false,
    });
  });

  it('reports ready only after the trusted database connection is established', () => {
    const readiness = createStartupReadiness();
    readiness.markDatabaseConnected();
    expect(readiness.snapshot()).toMatchObject({
      state: 'READY',
      database: 'CONNECTED',
      ready: true,
      reason: null,
    });
  });

  it('keeps liveness separate from readiness when the database is unavailable', () => {
    const readiness = createStartupReadiness();
    readiness.markDatabaseUnavailable('Supabase readiness probe timed out.');
    expect(readiness.snapshot()).toMatchObject({
      state: 'DEGRADED',
      database: 'UNAVAILABLE',
      ready: false,
      reason: 'Supabase readiness probe timed out.',
    });
  });

  it('does not expose secrets in failure reasons', () => {
    const readiness = createStartupReadiness();
    readiness.markFailed('Database initialization failed.');
    expect(JSON.stringify(readiness.snapshot())).not.toMatch(/password|token|service_role/i);
  });

  it('keeps listener startup independent from database initialization', () => {
    const serverSource = readFileSync(resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(serverSource).toContain('void DatabaseService.initialize()');
    expect(serverSource).toContain('app.get("/api/ready"');
    expect(serverSource).not.toContain('await DatabaseService.initialize()');
  });

  it('does not permit startup migrations or seeds in production', () => {
    const databaseServiceSource = readFileSync(
      resolve(process.cwd(), 'src/database/services/DatabaseService.ts'),
      'utf8',
    );
    expect(databaseServiceSource).toContain("process.env.NODE_ENV !== 'production'");
    expect(databaseServiceSource).toContain('startupMutationAllowed && process.env.AUTO_MIGRATE');
    expect(databaseServiceSource).toContain('startupMutationAllowed && process.env.AUTO_SEED');
  });
});
