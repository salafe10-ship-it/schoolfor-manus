# PERF-008 — Database / Network Latency Forensics

## Mission

PERF-008 is a Staging-only diagnostic mission for the Student read path. No production traffic, schema, RLS, pool configuration, API behavior, or application remediation was changed by this mission.

## Evidence boundary

- Environment: `edupro-school-erp-staging` on Render and its isolated Supabase Staging project.
- Identity: a temporary authenticated user with the normal application authentication and tenant context.
- RLS/auth posture: hostile requests were tested through the application boundary; no service-role or `BYPASSRLS` path was used.
- Database diagnostic: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` was executed only for the synthetic Staging Student read and only while PERF-008 diagnostics were enabled.
- Sample sizes: 20 sequential probe responses; concurrency probe batches at 1, 4, and 8; Render application-log evidence contained 10 completed server traces.

## Executive finding

The target of p95 <= 300 ms was not met. The database executor is not the dominant cause: PostgreSQL planning and execution were sub-millisecond in the normal sample. The dominant evidence points to multiple layers:

1. Remote database/driver round-trip and transaction lifecycle latency.
2. Authentication latency before the database work begins.
3. Pool wait/connection contention under the diagnostic concurrency probes.
4. A small, non-dominant Render/application response residual.

This is a diagnosis, not a certification. PERF-008 makes no performance claim for Production.

## Sequential Student read — client evidence

All 20 probe requests returned HTTP 200, one Student row, and `totalCount=1`.

| Metric | p50 | p95 | p99 | Max |
|---|---:|---:|---:|---:|
| Client wall time (ms) | 1338.495 | 1916.698 | 3136.559 | 3136.559 |

Result: **FAIL against the p95 <= 300 ms target**.

## Layer evidence — 20 response traces

These are server-side elapsed spans emitted by the gated diagnostic trace. They are not SQL execution times unless explicitly labelled as such.

| Layer / span | p50 (ms) | p95 (ms) | p99 (ms) | Interpretation |
|---|---:|---:|---:|---|
| Authentication | 173.110 | 334.264 | 535.094 | Significant pre-database cost. |
| Authorization | 0.039 | 0.060 | 0.071 | Not a material contributor in this sample. |
| Pool connection wait | 0.083 | 0.142 | 728.802 | Usually negligible, but severe tail under probe contention. |
| Transaction acquire / begin configuration | 355.791 | 358.577 | 1084.765 | Includes transaction acquisition/setup and its remote lifecycle. |
| Trusted context | 118.682 | 120.430 | 120.733 | Tenant context setup has measurable remote cost. |
| Tenant PostgreSQL step | 119.433 | 121.944 | 122.929 | One remote database step before the Student query. |
| Student PostgreSQL span | 238.322 | 239.239 | 242.101 | Application-observed query span; not equivalent to executor time. |
| Mapping | 0.022 | 0.045 | 0.137 | Negligible. |
| Commit | 118.464 | 119.321 | 126.229 | Remote transaction completion cost. |
| Release | 0.028 | 0.033 | 0.037 | Negligible. |
| Serialization preparation | 0.002 | 0.006 | 0.006 | Negligible. |

## PostgreSQL executor versus database round-trip

The gated EXPLAIN evidence was collected for the same synthetic Student read under the same tenant context:

| PostgreSQL diagnostic | p50 | p95 | p99 | Max |
|---|---:|---:|---:|---:|
| Planning time (ms) | 0.172 | 0.222 | 0.640 | 0.640 |
| Executor time (ms) | 0.073 | 0.143 | 1.743 | 1.743 |
| EXPLAIN call round-trip (ms) | 119.265 | 119.767 | 122.481 | 122.481 |
| Actual rows | 1 | 1 | 1 | 1 |

The approximately 119 ms EXPLAIN call round-trip is orders of magnitude larger than executor time. This is strong evidence of network/driver/database-session latency rather than an expensive SQL plan. The application Student PostgreSQL span is approximately 238 ms at p50, so the real request path also includes additional database/session work beyond executor time.

## Concurrency evidence

The following batches used the PERF-008 diagnostic header. The diagnostic header adds EXPLAIN work and must not be treated as a production throughput measurement; it is useful for isolating contention.

| Concurrent requests | Wall p95 (ms) | EXPLAIN executor p95 (ms) | Pool wait p95 (ms) |
|---:|---:|---:|---:|
| 1 | 2593.908 | 0.074 | 727.706 |
| 4 | 2804.404 | 0.117 | 729.179 |
| 8 | 2713.780 | 0.126 | 727.412 |

The nearly flat pool-wait tail across these probe batches indicates contention or diagnostic interaction around connection/transaction acquisition. It does not justify changing pool settings in PERF-008; that is a PERF-009 investigation item.

## Render server-log evidence

Render application logs contained 10 `PERF004 diagnostic completed` records with final server timing fields:

| Server-log metric | p50 (ms) | p95 (ms) | p99 (ms) | Max |
|---|---:|---:|---:|---:|
| Server total | 1053.714 | 2124.407 | 2124.407 | 2124.407 |
| Response residual | 0.414 | 0.493 | 0.493 | 0.493 |

The residual between server completion and response handoff is small. Render response serialization/network outside the application is therefore not the primary explanation for the multi-second client tail.

## Security and workflow evidence

- Missing authentication: HTTP 401.
- Invalid token: HTTP 401.
- Forged school in query: HTTP 403.
- Forged school in header: HTTP 403.
- SOP-001 first registration: HTTP 201.
- SOP-001 same idempotency key retry: HTTP 200 with idempotent replay behavior.
- Before cleanup, the registration verification showed one row in each required Student/Guardian/Enrollment/Academic Status/Audit/Outbox table.
- After cleanup, the targeted verification query returned zero rows for all nine SOP-related tables.
- Authentication was refreshed after cleanup: no `perf008`, `perf008b`, `perf008c`, or `perf008d` user remained; Staging showed six unrelated retained users.

## Decision

**MULTIPLE BOTTLENECKS** — the evidence implicates database/network/driver round-trips and transaction lifecycle, with authentication and concurrency-related pool wait as additional contributors. PostgreSQL planning/execution itself is not the primary bottleneck in this sample.

## Scope boundary

No index, query, RLS, tenant-isolation, authentication, pool, schema, or API remediation was implemented. Any optimization requires CTO approval as PERF-009.
