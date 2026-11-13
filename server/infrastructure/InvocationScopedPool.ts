import type { Pool, PoolClient } from 'pg';

/**
 * Hyperdrive owns the database-side pool. A pg pool created for a Worker
 * invocation must not be reused by another invocation.
 *
 * The application uses the admin pool through promise-based query/connect
 * calls. Each call receives a fresh pool; a connected transaction keeps its
 * pool until the client is released.
 */
export function createInvocationScopedPool(createPool: () => Pool): Pool {
  const facade = {
    async query(...args: unknown[]): Promise<unknown> {
      const pool = createPool();
      try {
        return await Reflect.apply(pool.query, pool, args);
      } finally {
        // The query result or error remains authoritative. Workers also
        // clean up Hyperdrive edge connections when an invocation ends.
        await pool.end().catch(() => undefined);
      }
    },

    async connect(): Promise<PoolClient> {
      const pool = createPool();
      let client: PoolClient;
      try {
        client = await pool.connect();
      } catch (error) {
        await pool.end().catch(() => undefined);
        throw error;
      }

      const release = client.release.bind(client);
      let released = false;
      client.release = (error?: Error | boolean) => {
        if (released) throw new Error('Release called on client which has already been released to the pool.');
        released = true;
        try {
          release(error);
        } finally {
          // pg's release() is synchronous. The Worker owns the connection
          // until the response ends; request teardown also cleans it up.
          void pool.end().catch(() => undefined);
        }
      };
      return client;
    },
  };
  return facade as unknown as Pool;
}
