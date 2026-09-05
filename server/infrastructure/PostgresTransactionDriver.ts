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

type PostgresRow = QueryResultRow & Record<string, unknown>;

type PoolSnapshot = Omit<Perf004PoolMetric, "phase">;

function nowMs(): number {
  return typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now();
}

class PostgresTransactionSession implements TransactionSession {
  private state: "active" | "committed" | "rolled_back" | "released" = "active";

  public constructor(
    public readonly id: string,
    private readonly client: PoolClient,
    private readonly timeoutMs?: number,
    private readonly diagnosticTrace?: { mark(stage: string): void },
    private readonly diagnosticPrefix = '',
    private readonly poolSnapshot?: () => PoolSnapshot,
    private readonly recordPoolMetric?: (metric: Perf004PoolMetric) => void,
    private readonly acquiredAtMs = nowMs()
  ) {}

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
    await this.client.query("COMMIT");
    this.state = "committed";
    this.diagnosticTrace?.mark(`${this.diagnosticPrefix}commit_completed`);
  }

  public async rollback(): Promise<void> {
    this.assertActive();
    await this.client.query("ROLLBACK");
    this.state = "rolled_back";
  }

  public async release(): Promise<void> {
    if (this.state === "released") return;
    this.diagnosticTrace?.mark(`${this.diagnosticPrefix}release_started`);
    const releaseStartedAtMs = nowMs();
    if (this.state === "active") {
      try {
        await this.client.query("ROLLBACK");
      } finally {
        this.state = "rolled_back";
      }
    }
    this.client.release();
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
    diagnosticPrefix = ''
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
        return `set_config($${settingIndex}, $${valueIndex}, true)`;
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
        client.release();
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

  const pool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 20),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5_000),
    allowExitOnIdle: process.env.NODE_ENV !== "production",
    ssl: process.env.PGSSLMODE === "disable"
      ? undefined
      : { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true" },
  });

  return new PostgresTransactionDriver(pool);
}
