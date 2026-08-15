export type Perf004TraceLike = {
  enabled: boolean;
  mark(stage: string): void;
  count?(name: string, increment?: number): void;
  recordPoolMetric?(metric: Perf004PoolMetric): void;
  recordQuery?(transaction: {
    query<Row extends Record<string, unknown> = Record<string, unknown>>(
      sqlText: string,
      parameters?: readonly unknown[]
    ): Promise<{ rows: Row[]; rowCount: number }>;
  }, sqlText: string, parameters: readonly unknown[], label: string): Promise<void>;
  report(): Perf004DiagnosticReport;
};

export type Perf004PoolMetric = {
  phase: 'requested' | 'acquired' | 'released';
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  activeCount: number;
  acquisitionDurationMs?: number;
  waitDurationMs?: number;
  connectionCreationDurationMs?: number;
  transactionOccupancyDurationMs?: number;
  releaseDurationMs?: number;
};

export type Perf004DiagnosticReport = {
  traceId: string;
  events: Array<{ stage: string; elapsedMs: number }>;
  durationsMs: Record<string, number>;
  counters: Record<string, number>;
  queryMetrics?: Array<{
    label: string;
    explainRoundTripMs: number;
    planningMs: number | null;
    executionMs: number | null;
    actualRows: number | null;
  }>;
  pool?: {
    samples: Perf004PoolMetric[];
  };
};

function diagnosticsEnabled(): boolean {
  return String(process.env.PERF004_DIAGNOSTICS || '').toLowerCase() === 'true';
}

function nowMs(): number {
  return typeof globalThis.performance?.now === 'function' ? globalThis.performance.now() : Date.now();
}

export function createPerf004Trace(requested: boolean): Perf004TraceLike | undefined {
  if (!requested || !diagnosticsEnabled()) return undefined;

  const startedAt = nowMs();
  const events: Array<{ stage: string; elapsedMs: number }> = [];
  const counters: Record<string, number> = {
    authRemoteCalls: 0,
    tenantDbQueries: 0,
    studentDbQueries: 0,
    otherDbQueries: 0,
    transactions: 0,
    contextCommands: 0,
    poolAcquisitions: 0,
    httpRemoteCalls: 0,
    studentExplainQueries: 0
  };
  const queryMetrics: Perf004DiagnosticReport['queryMetrics'] = [];
  const poolSamples: Perf004PoolMetric[] = [];
  const perf008Enabled = String(process.env.PERF008_DIAGNOSTICS || '').toLowerCase() === 'true';
  const traceId = `perf004_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  return {
    enabled: true,
    mark(stage: string): void {
      events.push({ stage, elapsedMs: Number((nowMs() - startedAt).toFixed(3)) });
    },
    count(name: string, increment = 1): void {
      counters[name] = (counters[name] || 0) + increment;
    },
    recordPoolMetric(metric: Perf004PoolMetric): void {
      poolSamples.push({ ...metric });
    },
    async recordQuery(transaction, sqlText, parameters, label): Promise<void> {
      if (!perf008Enabled || label !== 'student') return;

      const startedAt = nowMs();
      const result = await transaction.query<Record<string, unknown>>(
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sqlText}`,
        parameters
      );
      const explainRoundTripMs = Number((nowMs() - startedAt).toFixed(3));
      const rawPlan = result.rows[0]?.['QUERY PLAN'];
      const plan = Array.isArray(rawPlan) ? rawPlan[0] as Record<string, unknown> | undefined : undefined;
      const rootPlan = plan?.Plan as Record<string, unknown> | undefined;

      counters.studentExplainQueries += 1;
      queryMetrics?.push({
        label,
        explainRoundTripMs,
        planningMs: typeof plan?.['Planning Time'] === 'number' ? plan['Planning Time'] : null,
        executionMs: typeof plan?.['Execution Time'] === 'number' ? plan['Execution Time'] : null,
        actualRows: typeof rootPlan?.['Actual Rows'] === 'number' ? rootPlan['Actual Rows'] : null
      });
    },
    report(): Perf004DiagnosticReport {
      const firstByStage = new Map<string, number>();
      for (const event of events) {
        if (!firstByStage.has(event.stage)) firstByStage.set(event.stage, event.elapsedMs);
      }

      const durationsMs: Record<string, number> = {};
      const pairs: Array<[string, string, string]> = [
        ['authentication', 'authentication_started', 'authentication_completed'],
        ['authorization', 'authorization_started', 'authorization_completed'],
        ['tenantEngine', 'tenant_engine_started', 'tenant_engine_completed'],
        ['tenantTransactionAcquire', 'tenant_transaction_requested', 'tenant_transaction_acquired'],
        ['tenantPoolConnect', 'tenant_pool_connection_requested', 'tenant_pool_connection_acquired'],
        ['tenantTrustedContext', 'tenant_trusted_context_started', 'tenant_trusted_context_completed'],
        ['tenantBeginConfiguration', 'tenant_transaction_requested', 'tenant_transaction_begin_configured'],
        ['tenantPostgres', 'tenant_postgres_query_started', 'tenant_postgres_query_completed'],
        ['studentTransactionAcquire', 'student_transaction_requested', 'student_transaction_acquired'],
        ['studentPoolConnect', 'student_pool_connection_requested', 'student_pool_connection_acquired'],
        ['studentTrustedContext', 'student_trusted_context_started', 'student_trusted_context_completed'],
        ['studentBeginConfiguration', 'student_transaction_requested', 'student_transaction_begin_configured'],
        ['studentPostgres', 'student_postgres_query_started', 'student_postgres_query_completed'],
        ['studentMapping', 'student_mapping_started', 'student_mapping_completed'],
        ['serializationPreparation', 'serialization_started', 'serialization_prepared'],
        ['responsePreparation', 'request_received', 'serialization_started'],
        ['tenantCommit', 'tenant_commit_started', 'tenant_commit_completed'],
        ['tenantRelease', 'tenant_release_started', 'tenant_release_completed'],
        ['studentCommit', 'student_commit_started', 'student_commit_completed'],
        ['studentRelease', 'student_release_started', 'student_release_completed'],
        ['responseResidual', 'serialization_prepared', 'response_sent'],
        ['total', 'request_received', 'response_sent']
      ];
      for (const [name, start, end] of pairs) {
        const startMs = firstByStage.get(start);
        const endMs = firstByStage.get(end);
        if (startMs !== undefined && endMs !== undefined) durationsMs[name] = Number((endMs - startMs).toFixed(3));
      }

      return {
        traceId,
        events: [...events],
        durationsMs,
        counters: { ...counters },
        ...(queryMetrics?.length ? { queryMetrics: [...queryMetrics] } : {}),
        ...(poolSamples.length ? { pool: { samples: poolSamples.map(sample => ({ ...sample })) } } : {})
      };
    }
  };
}
