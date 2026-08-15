# PERF-013 — Connection Reuse Report

## Reuse findings

The shared `pg.Pool` is reused correctly for available idle clients:

- Warm acquisition: approximately 0.077–0.101 ms in concurrency samples.
- New lease acquisition/creation: approximately 719.789–729.355 ms in the measured burst samples.
- Pool waiting count: 0 at C1, C4, and C8.
- PostgreSQL Student executor: approximately 238–241 ms at the application timing layer and approximately 0.1 ms at executor timing; the SQL executor is not the dominant delay.

## Interpretation

At C1, C4, and C8, a request obtains an idle client when one is available. When the burst has more concurrent demand than idle clients, the pool establishes additional clients. This is normal pool behavior and is not evidence of a new pool per request. The code constructs the pool once at bootstrap and calls `client.release()` after each request-scoped transaction.

The high acquisition interval remains associated with remote connection establishment. Because the pool has no queue wait in the observed samples, increasing pool capacity or applying idle tuning is not justified by the collected evidence.

## Before/after table

No tuning was approved or applied because the prerequisite “unnecessary connection creation” was not proven.

| Metric | Baseline | Tuned |
|---|---:|---:|
| Warm acquisition p95 | ~0.089 ms across PERF-012 samples | Not applicable — no tuning |
| New connection p95 | ~887.926 ms across PERF-012 samples | Not applicable — no tuning |
| Pool wait p95 C1/C4/C8 | 0 ms observed | Not applicable — no tuning |
| Student Read p95 | Variable; 1824.326 ms in PERF-013 normal run | Not applicable — no tuning |

## Safe conclusion

The current Staging bottleneck is external to SQL execution and is not safely remediated by blind Pool configuration changes. A future infrastructure mission may compare a separately provisioned, server-side-only direct Staging connection against the pooler path if that connection can be supplied without affecting Production.
