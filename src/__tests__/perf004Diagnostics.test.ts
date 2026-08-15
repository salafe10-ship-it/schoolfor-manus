import { afterEach, describe, expect, it } from 'vitest';
import { createPerf004Trace } from '../performance/Perf004LatencyDiagnostics';

const previousFlag = process.env.PERF004_DIAGNOSTICS;

afterEach(() => {
  if (previousFlag === undefined) delete process.env.PERF004_DIAGNOSTICS;
  else process.env.PERF004_DIAGNOSTICS = previousFlag;
});

describe('PERF-004 latency diagnostics', () => {
  it('stays disabled unless the staging environment flag and probe are both present', () => {
    process.env.PERF004_DIAGNOSTICS = 'false';
    expect(createPerf004Trace(true)).toBeUndefined();

    process.env.PERF004_DIAGNOSTICS = 'true';
    expect(createPerf004Trace(false)).toBeUndefined();
  });

  it('records safe stage events and paired durations without request data', () => {
    process.env.PERF004_DIAGNOSTICS = 'true';
    const trace = createPerf004Trace(true);
    expect(trace).toBeDefined();

    trace?.mark('request_received');
    trace?.mark('student_postgres_query_started');
    trace?.mark('student_postgres_query_completed');

    const report = trace?.report();
    expect(report?.traceId).toMatch(/^perf004_/);
    expect(report?.events.map(event => event.stage)).toEqual([
      'request_received',
      'student_postgres_query_started',
      'student_postgres_query_completed'
    ]);
    expect(report?.durationsMs).toHaveProperty('studentPostgres');
    expect(JSON.stringify(report)).not.toContain('password');
    expect(JSON.stringify(report)).not.toContain('token');
  });
});
