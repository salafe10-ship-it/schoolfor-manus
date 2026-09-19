import { describe, expect, it, vi } from 'vitest';
import { PostgresTransactionDriver } from '../../server/infrastructure/PostgresTransactionDriver';

function createDriverHarness() {
  const client: any = {
    query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
    release: vi.fn()
  };
  const pool = { connect: vi.fn(async () => client) };
  return { client, pool, driver: new PostgresTransactionDriver(pool as any) };
}

describe('PostgresTransactionDriver trusted context', () => {
  it('combines all present transaction-local settings into one parameterized command', async () => {
    const { client, pool, driver } = createDriverHarness();

    const session = await driver.begin({
      transactionId: 'tx-perf-005',
      tenantId: 'tenant-a',
      schoolId: 'school-a',
      operationName: 'PERF-005 test',
      trustedContext: {
        tenantId: 'tenant-a',
        schoolId: 'school-a',
        branchId: 'branch-a',
        academicYear: 'year-a',
        userId: 'user-a',
        role: 'SchoolAdmin'
      }
    });

    expect(pool.connect).toHaveBeenCalledTimes(1);
    const contextCalls = client.query.mock.calls.filter(([sql]) => String(sql).startsWith('SELECT set_config'));
    expect(contextCalls).toHaveLength(1);
    expect(contextCalls[0][0]).toContain('set_config($1, $2, true)');
    expect(contextCalls[0][0]).toContain('set_config($11, $12, true)');
    expect(contextCalls[0][1]).toEqual([
      'app.tenant_id', 'tenant-a',
      'app.school_id', 'school-a',
      'app.branch_id', 'branch-a',
      'app.academic_year', 'year-a',
      'app.user_id', 'user-a',
      'app.role', 'SchoolAdmin'
    ]);
    expect(client.query.mock.calls.filter(([sql]) => String(sql).includes('set_config')).every(([sql]) => !String(sql).includes(', false'))).toBe(true);

    await session.rollback();
    await session.release();
  });

  it('fails closed before any trusted context command for a missing tenant or school scope', async () => {
    const { client, driver } = createDriverHarness();

    await expect(driver.begin({
      transactionId: 'tx-perf-005-invalid',
      tenantId: 'tenant-a',
      schoolId: 'school-a',
      operationName: 'PERF-005 invalid',
      trustedContext: { tenantId: 'tenant-a', schoolId: '' }
    })).rejects.toThrow('Trusted tenant context is missing or invalid.');

    expect(client.query.mock.calls.filter(([sql]) => String(sql).startsWith('SELECT set_config'))).toHaveLength(0);
  });

  it('releases a committed connection without a second transaction command', async () => {
    const { client, driver } = createDriverHarness();
    const session = await driver.begin({
      transactionId: 'tx-hyperdrive-release',
      tenantId: 'tenant-a',
      schoolId: 'school-a',
      operationName: 'read-only lifecycle test',
      trustedContext: { tenantId: 'tenant-a', schoolId: 'school-a' }
    });

    await session.commit();
    await session.release();

    const sql = client.query.mock.calls.map(([statement]) => String(statement));
    expect(sql.filter(statement => statement === 'COMMIT')).toHaveLength(1);
    expect(sql.filter(statement => statement === 'ROLLBACK')).toHaveLength(0);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('discards a client when Hyperdrive rejects pool recycling', async () => {
    const { client, driver } = createDriverHarness();
    client.release
      .mockImplementationOnce(() => { throw new Error('connection still in a transaction'); })
      .mockImplementationOnce(() => undefined);
    const session = await driver.begin({
      transactionId: 'tx-hyperdrive-discard',
      tenantId: 'tenant-a',
      schoolId: 'school-a',
      operationName: 'read-only lifecycle test',
      trustedContext: { tenantId: 'tenant-a', schoolId: 'school-a' }
    });

    await session.commit();
    await expect(session.release()).resolves.toBeUndefined();
    expect(client.release).toHaveBeenNthCalledWith(2, true);
  });

  it('discards every completed session in the Cloudflare Hyperdrive runtime', async () => {
    vi.stubEnv('EDUPRO_CLOUDFLARE_HYPERDRIVE', 'true');
    try {
      const { client, driver } = createDriverHarness();
      const session = await driver.begin({
        transactionId: 'tx-hyperdrive-runtime',
        tenantId: 'tenant-a',
        schoolId: 'school-a',
        operationName: 'read-only lifecycle test',
        trustedContext: { tenantId: 'tenant-a', schoolId: 'school-a' }
      });

      await session.commit();
      await session.release();
      expect(client.release).toHaveBeenCalledWith(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('does not fail a completed read when Hyperdrive rejects discard cleanup', async () => {
    vi.stubEnv('EDUPRO_CLOUDFLARE_HYPERDRIVE', 'true');
    try {
      const { client, driver } = createDriverHarness();
      client.release.mockImplementationOnce(() => { throw new Error('recycle rejected'); });
      const session = await driver.begin({
        transactionId: 'tx-hyperdrive-cleanup-diagnostic',
        tenantId: 'tenant-a',
        schoolId: 'school-a',
        operationName: 'read-only lifecycle test',
        trustedContext: { tenantId: 'tenant-a', schoolId: 'school-a' }
      });

      await session.commit();
      await expect(session.release()).resolves.toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('samples real pool connections without returning secret fields', async () => {
    const client: any = {
      query: vi.fn(async (sql: string) => String(sql).includes('FROM pg_roles')
        ? {
            rows: [{
              current_user: 'edupro_staging_app',
              session_user: 'edupro_staging_app',
              rolsuper: false,
              rolbypassrls: false,
              password: 'must-not-be-returned'
            }],
            rowCount: 1
          }
        : { rows: [], rowCount: 0 }),
      release: vi.fn()
    };
    const pool = { connect: vi.fn(async () => client) };
    const driver = new PostgresTransactionDriver(pool as any);

    const identities = await driver.inspectPoolIdentity(2);

    expect(pool.connect).toHaveBeenCalledTimes(2);
    expect(identities).toEqual([
      {
        current_user: 'edupro_staging_app',
        session_user: 'edupro_staging_app',
        rolsuper: false,
        rolbypassrls: false
      },
      {
        current_user: 'edupro_staging_app',
        session_user: 'edupro_staging_app',
        rolsuper: false,
        rolbypassrls: false
      }
    ]);
    expect(identities[0]).not.toHaveProperty('password');
    expect(client.release).toHaveBeenCalledTimes(2);
  });
});
