import { describe, expect, it, vi } from 'vitest';
import type { Pool, PoolClient } from 'pg';
import { createInvocationScopedPool } from '../../server/infrastructure/InvocationScopedPool';

describe('Hyperdrive admin pool lifecycle', () => {
  it('uses and closes a different pool for each sequential or concurrent query', async () => {
    const pools: Array<{ query: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> }> = [];
    const factory = () => {
      const pool = { query: vi.fn(async (sql: string) => ({ rows: [sql] })), end: vi.fn(async () => undefined) };
      pools.push(pool);
      return pool as unknown as Pool;
    };
    const scoped = createInvocationScopedPool(factory);
    expect((await scoped.query('first')).rows).toEqual(['first']);
    const [second, third] = await Promise.all([scoped.query('second'), scoped.query('third')]);
    expect([second.rows, third.rows]).toEqual([['second'], ['third']]);
    expect(pools).toHaveLength(3);
    for (const pool of pools) expect(pool.end).toHaveBeenCalledOnce();
  });

  it('closes a pool after a failed query without replacing the original error', async () => {
    const failure = new Error('query failed');
    const pool = { query: vi.fn().mockRejectedValue(failure), end: vi.fn().mockRejectedValue(new Error('cleanup failed')) };
    const scoped = createInvocationScopedPool(() => pool as unknown as Pool);
    await expect(scoped.query('SELECT 1')).rejects.toBe(failure);
    expect(pool.end).toHaveBeenCalledOnce();
  });

  it('holds a transaction pool until release and closes it once', async () => {
    const release = vi.fn();
    const client = { release } as unknown as PoolClient;
    const pool = { connect: vi.fn().mockResolvedValue(client), end: vi.fn().mockResolvedValue(undefined) };
    const scoped = createInvocationScopedPool(() => pool as unknown as Pool);
    const leased = await scoped.connect();
    expect(pool.end).not.toHaveBeenCalled();
    leased.release(true);
    expect(release).toHaveBeenCalledWith(true);
    expect(pool.end).toHaveBeenCalledOnce();
    expect(() => leased.release()).toThrow();
    expect(pool.end).toHaveBeenCalledOnce();
  });

  it('closes the pool when acquiring a client fails', async () => {
    const failure = new Error('connect failed');
    const pool = { connect: vi.fn().mockRejectedValue(failure), end: vi.fn().mockResolvedValue(undefined) };
    const scoped = createInvocationScopedPool(() => pool as unknown as Pool);
    await expect(scoped.connect()).rejects.toBe(failure);
    expect(pool.end).toHaveBeenCalledOnce();
  });
});
