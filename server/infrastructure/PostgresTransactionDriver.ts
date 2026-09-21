import { randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type {
  TransactionBeginOptions,
  TransactionDriver,
  TransactionQueryResult,
  TransactionSession,
} from "../../src/database/transactions/TransactionContracts.js";
import type { Perf004PoolMetric } from "../../src/performance/Perf004LatencyDiagnostics.js";
import {
  readConnectionIdentity,
  type ConnectionIdentity,
} from "./StagingConnectionDiagnostics.js";
import { createPostgresSslConfig } from "./PostgresSslConfig.js";

type PostgresRow = QueryResultRow & Record<string, unknown>;

type PoolSnapshot = Omit<Perf004PoolMetric, "phase">;

function nowMs(): number {
  return typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now();
}

class PostgresTransactionSession implements TransactionSession {
  private state: "active" | "committed" | "rolled_back" | "released" = "active";
  private readonly discardOnRelease = process.env.EDUPRO_CLOUDFLARE_HYPERDRIVE === "true";

  public constructor(
    public readonly id: string,
    private readonly client: PoolClient,
    private readonly timeoutMs?: number,
    private readonly diagnosticTrace?: { mark(stage: string): void },
    private readonly diagnosticPrefix = '',
    private readonly poolSnapshot?: () => PoolSnapshot,
    private readonly recordPoolMetric?: (metric: Perf004PoolMetric) => void,
    private readonly acquiredAtMs = nowMs(),
    private readonly transactionStarted = true
  ) {}

  /**
   * Hyperdrive's pg adapter can expose release() as either a synchronous
   * method or a thenable cleanup operation. Always await the result so a
   * rejected discard cannot escape as an unhandled protocol error and mask
   * the original database failure.
   */
  private async discardClient(): Promise<void> {
    try {
      await Promise.resolve(this.client.release(true));
    } catch {
      // The client is already unusable from the transaction boundary's point
      // of view. Never return it to the pool and never replace the original
      // query/transaction error with a cleanup diagnostic.
      this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_discard_failed`);
    }
  }

  public async query<Row extends Record<string, unknown> = PostgresRow>(
    sqlText: string,
    parameters: readonly unknown[] = []
  ): Promise<TransactionQueryResult<Row>> {
    this.assertActive();
    const result = await this.client.query<Row>(sqlText, [...parameters]);
    return { rows: result.rows, rowCount: result.rowCount ?? 0 };
  }

  public async commit(): Promise<void> {
    this.assertActive();
    this.diagnosticTrace?.mark(`${this.diagnosticPrefix}commit_started`);
    if (!this.transactionStarted) {
      this.state = "committed";
      this.diagnosticTrace?.mark(`${this.diagnosticPrefix}commit_completed`);
      return;
    }
    await this.client.query("COMMIT");
    this.state = "committed";
    this.diagnosticTrace?.mark(`${this.diagnosticPrefix}commit_completed`);
  }

  public async rollback(): Promise<void> {
    this.assertActive();
    if (!this.transactionStarted) {
      this.state = "rolled_back";
      return;
    }
    try {
      await this.client.query("ROLLBACK");
      this.state = "rolled_back";
    } catch (error) {
      this.diagnosticTrace?.mark(`${this.diagnosticPrefix}rollback_failed`);
      throw error;
    }
  }

  public async release(): Promise<void> {
    if (this.state === "released") return;
    this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_started`);
    const releaseStartedAtMs = nowMs();

    // Hyperdrive operates in transaction-pooling mode. A read-only session
    // deliberately does not issue BEGIN/COMMIT, so return it normally; using
    // release(true) here would discard a healthy pooled connection and can
    // trigger the very recycle protocol error this boundary is designed to
    // contain.
    if (!this.transactionStarted) {
      try {
        if (!this.discardOnRelease) await this.client.query("RESET ALL");
        await Promise.resolve(this.client.release());
      } catch (error) {
        await this.discardClient();
        this.state = "released";
        this.diagnosticTrace?.mark(`${this.diagnosticPrefix}read_only_release_discarded`);
        return;
      }
      this.state = "released";
      this.diagnosticTrace?.mark(`${this.diagnosticPrefix}read_only_release_completed`);
      this.recordPoolMetric?.({
        phase: 'released',
        ...(this.poolSnapshot ? this.poolSnapshot() : { totalCount: 0, idleCount: 0, waitingCount: 0, activeCount: 0 }),
        transactionOccupancyDurationMs: Number((releaseStartedAtMs - this.acquiredAtMs).toFixed(3)),
        releaseDurationMs: Number((nowMs() - releaseStartedAtMs).toFixed(3))
      });
      return;
    }

    // Hyperdrive owns the origin pool. After the transaction has been
    // finalized, return the checked-out client exactly once. Calling
    // release(true) here asks the adapter to recycle/discard the connection
    // while it may still be draining its transaction protocol, which can
    // produce: "Tried to recycle a connection still in a transaction".
    // Cleanup is deliberately best-effort; it must never turn a committed
    // database write into an API failure.
    if (this.discardOnRelease) {
      try {
        if (this.state === "active") {
          try {
            await this.client.query("ROLLBACK");
            this.state = "rolled_back";
          } catch {
            // The connection is already tainted from the failed transaction.
            // Discard it below and never let a cleanup protocol error replace
            // the original database exception.
            this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_rollback_failed`);
          }
        }
      } finally {
        try {
          await Promise.resolve(this.client.release());
        } catch {
          this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_failed`);
        }
        this.state = "released";
      }
      this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_completed`);
      this.recordPoolMetric?.({
        phase: 'released',
        ...(this.poolSnapshot ? this.poolSnapshot() : { totalCount: 0, idleCount: 0, waitingCount: 0, activeCount: 0 }),
        transactionOccupancyDurationMs: Number((releaseStartedAtMs - this.acquiredAtMs).toFixed(3)),
        releaseDurationMs: Number((nowMs() - releaseStartedAtMs).toFixed(3))
      });
      return;
    }

    // A committed/rolled-back session is already idle. Sending another
    // ROLLBACK through Hyperdrive during recycling can race its protocol
    // state machine and produce "connection still in a transaction". Only
    // normalize an actually active session, then release it normally.
    if (this.state === "active") {
      try {
        await this.client.query("ROLLBACK");
        this.state = "rolled_back";
      } catch (error) {
        // Never return an uncertain session to the pool. `release(true)` is
        // the pg contract for discarding a broken/transaction-tainted client.
        await this.discardClient();
        this.state = "released";
        this.diagnosticTrace?.mark(`${this.diagnosticPrefix}active_release_discarded`);
        return;
      }
    }

    try {
      await Promise.resolve(this.client.release());
    } catch (error) {
      // Hyperdrive may reject recycling when the server still reports an
      // open transaction. Discard that client instead of turning a completed
      // read/commit into an application failure or leaking a pooled session.
      await this.discardClient();
      this.state = "released";
      this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_discarded`);
      return;
    }
    this.state = "released";
    this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_completed`);
    this.recordPoolMetric?.({
      phase: 'released',
      ...(this.poolSnapshot ? this.poolSnapshot() : { totalCount: 0, idleCount: 0, waitingCount: 0, activeCount: 0 }),
      transactionOccupancyDurationMs: Number((releaseStartedAtMs - this.acquiredAtMs).toFixed(3)),
      releaseDurationMs: Number((nowMs() - releaseStartedAtMs).toFixed(3))
    });
  }

  private assertActive(): void {
    if (this.state !== "active") {
      throw new Error(`Transaction ${this.id} is ${this.state} and cannot be used.`);
    }
  }
}

export class PostgresTransactionDriver implements TransactionDriver {
  private poolConnectEvents = 0;

  public constructor(private readonly pool: Pool) {
    const poolWithEvents = this.pool as Pool & { on?: (event: string, listener: () => void) => void };
    poolWithEvents.on?.('connect', () => {
      this.poolConnectEvents += 1;
    });
  }

  private poolSnapshot(): PoolSnapshot {
    const totalCount = this.pool.totalCount;
    const idleCount = this.pool.idleCount;
    return {
      totalCount,
      idleCount,
      waitingCount: this.pool.waitingCount,
      activeCount: Math.max(0, totalCount - idleCount)
    };
  }

  /**
   * Reads only the non-secret PostgreSQL identity fields from several real
   * pool connections. This is used by the temporary Staging certification
   * gate; it never returns connection details or credentials.
   */
  public async inspectPoolIdentity(sampleCount: number): Promise<ConnectionIdentity[]> {
    const identities: ConnectionIdentity[] = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const client = await this.pool.connect();
      try {
        await client.query("BEGIN");
        identities.push(await readConnectionIdentity(client as any));
      } finally {
        try {
          await client.query("ROLLBACK");
        } finally {
          client.release();
        }
      }
    }
    return identities;
  }

  private async applyTrustedContext(
    client: PoolClient,
    context: NonNullable<TransactionBeginOptions['trustedContext']>,
    diagnosticTrace?: { mark(stage: string): void; count?(name: string, increment?: number): void },
    diagnosticPrefix = '',
    local = true
  ): Promise<void> {
    if (!context.tenantId || !context.schoolId) {
      throw new Error('Trusted tenant context is missing or invalid.');
    }

    const values: Array<[string, string | undefined]> = [
      ['app.tenant_id', context.tenantId],
      ['app.school_id', context.schoolId],
      ['app.branch_id', context.branchId],
      ['app.academic_year', context.academicYear],
      ['app.user_id', context.userId],
      ['app.actor_user_id', context.actorUserId],
      ['app.role', context.role]
    ];

    diagnosticTrace?.mark(`${diagnosticPrefix}trusted_context_started`);
    const configured = values.filter((entry): entry is [string, string] => Boolean(entry[1]));
    if (configured.length > 0) {
      const parameters: string[] = [];
      const expressions = configured.map(([setting, value], index) => {
        const settingIndex = index * 2 + 1;
        const valueIndex = settingIndex + 1;
        parameters.push(setting, value);
        return `set_config($${settingIndex}, $${valueIndex}, ${local ? 'true' : 'false'})`;
      });
      await client.query(`SELECT ${expressions.join(', ')}`, parameters);
      diagnosticTrace?.count?.('contextCommands');
    }
    diagnosticTrace?.mark(`${diagnosticPrefix}trusted_context_completed`);
    diagnosticTrace?.mark(`${diagnosticPrefix}context_established`);
  }

  public async begin(options: TransactionBeginOptions): Promise<TransactionSession> {
    const diagnosticPrefix = options.diagnosticPrefix || '';
    const poolRequestedAtMs = nowMs();
    const poolEventsBefore = this.poolConnectEvents;
    options.diagnosticTrace?.mark(`${diagnosticPrefix}pool_connection_requested`);
    options.diagnosticTrace?.recordPoolMetric?.({ phase: 'requested', ...this.poolSnapshot() });
    const client = await this.pool.connect();
    const poolAcquiredAtMs = nowMs();
    options.diagnosticTrace?.mark(`${diagnosticPrefix}pool_connection_acquired`);
    options.diagnosticTrace?.count?.('poolAcquisitions');
    const acquisitionDurationMs = Number((poolAcquiredAtMs - poolRequestedAtMs).toFixed(3));
    const connectionCreated = this.poolConnectEvents > poolEventsBefore;
    options.diagnosticTrace?.recordPoolMetric?.({
      phase: 'acquired',
      ...this.poolSnapshot(),
      acquisitionDurationMs,
      waitDurationMs: connectionCreated ? 0 : acquisitionDurationMs,
      connectionCreationDurationMs: connectionCreated ? acquisitionDurationMs : 0
    });
    const transactionId = options.transactionId || randomUUID();
    try {
      await client.query("BEGIN");
      // Tenant RLS policies are intentionally granted to the explicitly
      // provisioned application role (for example edupro_staging_app). A
      // pooler connection may authenticate as a transport role, so enter the
      // policy-matched role locally for tenant transactions. Platform
      // transactions remain on their privileged control-plane role.
      if (options.scope !== 'platform') {
        const tenantRole = String(process.env.DATABASE_ROLE_EXPECTED || '').trim();
        if (tenantRole && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(tenantRole)) {
          throw new Error('DATABASE_ROLE_EXPECTED contains an invalid PostgreSQL role name.');
        }
        if (tenantRole) await client.query(`SET LOCAL ROLE "${tenantRole}"`);
      }
      options.diagnosticTrace?.count?.('transactions');
      // PostgreSQL's default_transaction_isolation is READ COMMITTED in the
      // Staging/production contract. Omitting the redundant SET avoids one
      // network round-trip while preserving the existing transaction
      // semantics. The value is verified by the PERF-009 Staging baseline.
      if (options.trustedContext) {
        await this.applyTrustedContext(client, options.trustedContext, options.diagnosticTrace, diagnosticPrefix);
      }
      options.diagnosticTrace?.mark(`${diagnosticPrefix}transaction_begin_configured`);
      if (options.timeoutMs && options.timeoutMs > 0) {
        await client.query("SELECT set_config('statement_timeout', $1, true)", [String(options.timeoutMs)]);
      }
      return new PostgresTransactionSession(
        transactionId,
        client,
        options.timeoutMs,
        options.diagnosticTrace,
        diagnosticPrefix,
        () => this.poolSnapshot(),
        options.diagnosticTrace?.recordPoolMetric,
        poolAcquiredAtMs
      );
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // The connection is released even if the failed begin cannot be rolled back.
      } finally {
        try {
          await Promise.resolve(client.release(true));
        } catch {
          // Never replace the begin error with a Hyperdrive cleanup error.
        }
      }
      throw error;
    }
  }

  /**
   * Runs a bounded read against Hyperdrive without opening an explicit
   * transaction. Hyperdrive already pools in transaction mode; keeping a
   * read-only connection out of an application BEGIN/COMMIT cycle avoids
   * recycle races while preserving tenant RLS through session-local context
   * that is cleared before the connection is returned.
   */
  public async beginReadOnly(options: TransactionBeginOptions): Promise<TransactionSession> {
    const diagnosticPrefix = options.diagnosticPrefix || '';
    const poolRequestedAtMs = nowMs();
    const poolEventsBefore = this.poolConnectEvents;
    options.diagnosticTrace?.mark(`${diagnosticPrefix}pool_connection_requested`);
    options.diagnosticTrace?.recordPoolMetric?.({ phase: 'requested', ...this.poolSnapshot() });
    const client = await this.pool.connect();
    const poolAcquiredAtMs = nowMs();
    options.diagnosticTrace?.mark(`${diagnosticPrefix}pool_connection_acquired`);
    options.diagnosticTrace?.count?.('poolAcquisitions');
    const acquisitionDurationMs = Number((poolAcquiredAtMs - poolRequestedAtMs).toFixed(3));
    const connectionCreated = this.poolConnectEvents > poolEventsBefore;
    options.diagnosticTrace?.recordPoolMetric?.({
      phase: 'acquired',
      ...this.poolSnapshot(),
      acquisitionDurationMs,
      waitDurationMs: connectionCreated ? 0 : acquisitionDurationMs,
      connectionCreationDurationMs: connectionCreated ? acquisitionDurationMs : 0
    });
    const transactionId = options.transactionId || randomUUID();
    try {
      if (options.scope !== 'platform') {
        const tenantRole = String(process.env.DATABASE_ROLE_EXPECTED || '').trim();
        if (tenantRole && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(tenantRole)) {
          throw new Error('DATABASE_ROLE_EXPECTED contains an invalid PostgreSQL role name.');
        }
        if (tenantRole) await client.query(`SET ROLE "${tenantRole}"`);
      }
      if (options.trustedContext) {
        await this.applyTrustedContext(client, options.trustedContext, options.diagnosticTrace, diagnosticPrefix, false);
      }
      if (options.timeoutMs && options.timeoutMs > 0) {
        await client.query("SELECT set_config('statement_timeout', $1, false)", [String(options.timeoutMs)]);
      }
      return new PostgresTransactionSession(
        transactionId,
        client,
        options.timeoutMs,
        options.diagnosticTrace,
        diagnosticPrefix,
        () => this.poolSnapshot(),
        options.diagnosticTrace?.recordPoolMetric,
        poolAcquiredAtMs,
        false
      );
    } catch (error) {
      try {
        await Promise.resolve(client.release(true));
      } catch {
        // Preserve the original setup/query error.
      }
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createPostgresTransactionDriverFromEnvironment(): PostgresTransactionDriver | null {
  // DATABASE_URL is the application data-plane connection and must use a
  // non-bypass RLS role in production. DIRECT_URL remains a local fallback.
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) return null;

  // A Worker instance is short-lived and Hyperdrive already maintains the
  // origin pool. Matching Hyperdrive's ceiling with a pg pool of 20 per
  // isolate causes connection waits and eventually `timeout exceeded when
  // trying to connect` during RBAC resolution. Keep the local pool small in
  // Cloudflare while preserving the existing override for deliberate tuning.
  const isCloudflareHyperdrive = process.env.EDUPRO_CLOUDFLARE_HYPERDRIVE === 'true';
  const configuredPoolMax = Number(process.env.PG_POOL_MAX);
  const poolMax = Number.isFinite(configuredPoolMax) && configuredPoolMax > 0
    ? configuredPoolMax
    : (isCloudflareHyperdrive ? 4 : 20);

  const pool = new Pool({
    connectionString,
    max: poolMax,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    allowExitOnIdle: process.env.NODE_ENV !== "production",
    ssl: createPostgresSslConfig(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
  });

  return new PostgresTransactionDriver(pool);
}
