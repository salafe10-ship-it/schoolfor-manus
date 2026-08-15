import { afterEach, describe, expect, it } from 'vitest';
import { createPerf004Trace } from '../performance/Perf004LatencyDiagnostics';

const previousFlag = process.env.PERF004_DIAGNOSTICS;
const previousPerf008Flag = process.env.PERF008_DIAGNOSTICS;

afterEach(() => {
  if (previousFlag === undefined) delete process.env.PERF004_DIAGNOSTICS;
  else process.env.PERF004_DIAGNOSTICS = previousFlag;
  if (previousPerf008Flag === undefined) delete process.env.PERF008_DIAGNOSTICS;
  else process.env.PERF008_DIAGNOSTICS = previousPerf008Flag;
});
describe('PERF-006 request forensics diagnostics', () => {
  it('records call-graph counters and the request timeline without sensitive values', () => {
    process.env.PERF004_DIAGNOSTICS = 'true';
    const trace = createPerf004Trace(true);
    expect(trace).toBeDefined();

    trace?.mark('request_received');
    trace?.count?.('authRemoteCalls');
    trace?.count?.('httpRemoteCalls');
    trace?.mark('authentication_started');
    trace?.mark('authentication_completed');
    trace?.mark('tenant_engine_started');
    trace?.mark('tenant_engine_completed');
    trace?.mark('student_transaction_started');
    trace?.count?.('transactions', 2);
    trace?.count?.('poolAcquisitions', 2);
    trace?.count?.('contextCommands', 2);
    trace?.recordPoolMetric?.({
      phase: 'requested',
      totalCount: 4,
      idleCount: 2,
      waitingCount: 1,
      activeCount: 2
    });
    trace?.recordPoolMetric?.({
      phase: 'acquired',
      totalCount: 4,
      idleCount: 1,
      waitingCount: 0,
      activeCount: 3,
      acquisitionDurationMs: 12.5,
      waitDurationMs: 12.5,
      connectionCreationDurationMs: 0
    });
    trace?.mark('student_postgres_query_started');
    trace?.count?.('studentDbQueries');
    trace?.mark('student_postgres_query_completed');
    trace?.mark('student_mapping_started');
    trace?.mark('student_mapping_completed');
    trace?.mark('student_commit_started');
    trace?.mark('student_commit_completed');
    trace?.mark('student_release_started');
    trace?.mark('student_release_completed');
    trace?.mark('serialization_started');
    trace?.mark('serialization_prepared');
    trace?.mark('response_generated');
    trace?.mark('response_sent');

    const report = trace?.report();
    expect(report?.counters).toMatchObject({
      authRemoteCalls: 1,
      httpRemoteCalls: 1,
      studentDbQueries: 1,
      transactions: 2,
      contextCommands: 2,
      poolAcquisitions: 2
    });
    expect(report?.durationsMs).toHaveProperty('studentCommit');
    expect(report?.durationsMs).toHaveProperty('studentRelease');
    expect(report?.durationsMs).toHaveProperty('responseResidual');
    expect(report?.durationsMs).toHaveProperty('total');
    expect(report?.pool?.samples).toEqual([
      expect.objectContaining({ phase: 'requested', totalCount: 4, waitingCount: 1 }),
      expect.objectContaining({ phase: 'acquired', acquisitionDurationMs: 12.5, waitDurationMs: 12.5 })
    ]);
    expect(JSON.stringify(report)).not.toMatch(/password|token|student_number|email/i);
  });

  it('records PostgreSQL EXPLAIN metrics only when PERF-008 diagnostics are enabled', async () => {
    process.env.PERF004_DIAGNOSTICS = 'true';
    process.env.PERF008_DIAGNOSTICS = 'true';
    const trace = createPerf004Trace(true);
    const transaction = {
      query: async <Row extends Record<string, unknown> = Record<string, unknown>>(
        _sqlText: string,
        _parameters: readonly unknown[] = []
      ): Promise<{ rows: Row[]; rowCount: number }> => ({
        rows: [{
          'QUERY PLAN': [{
            'Planning Time': 1.25,
            'Execution Time': 8.75,
            Plan: { 'Actual Rows': 1 }
          }]
        } as unknown as Row],
        rowCount: 1
      })
    };

    await trace?.recordQuery?.(transaction, 'SELECT 1', [], 'student');

    const report = trace?.report();
    expect(report?.counters.studentExplainQueries).toBe(1);
    expect(report?.queryMetrics).toEqual([
      expect.objectContaining({
        label: 'student',
        planningMs: 1.25,
        executionMs: 8.75,
        actualRows: 1
      })
    ]);
    expect(JSON.stringify(report)).not.toMatch(/password|token|student_number|email/i);
  });
});
