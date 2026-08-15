# DB-SEC-003 — Performance Report

## Method

Server-side `EXPLAIN ANALYZE` measurements were collected over 12 iterations on Staging with the RLS predicates active. The measurements isolate PostgreSQL execution from browser, pooler, and free-plan wake-up latency.

## Database execution results

| Workload | p95 | Budget | Result |
|---|---:|---:|---|
| Student lookup | 0.089 ms | 300 ms | PASS |
| Current academic status | 0.089 ms | 300 ms | PASS |
| Document lookup | 0.170 ms | 300 ms | PASS |
| Registration-style write | 0.610 ms | 800 ms | PASS |

The RLS predicates did not create a database execution bottleneck in this validation sample.

## End-to-end observation

An earlier 40-iteration client round-trip sample through the free-plan pooler measured p95 values of approximately 757 ms for student lookup, 751 ms for status lookup, 813 ms for document lookup, and 762 ms for the write path. These values include network, pooler, transaction setup, and free-plan scheduling/cold latency; they are not PostgreSQL execution times.

Accordingly, database performance is certified for the current scope, while production end-to-end SLA certification remains `NEEDS-ENVIRONMENT-VERIFICATION` on a non-sleeping, production-like Staging runtime.

## Recommendation

Repeat the end-to-end benchmark after the Staging runtime and database tier are configured for production-like availability. Do not compensate for infrastructure latency by weakening RLS predicates.
