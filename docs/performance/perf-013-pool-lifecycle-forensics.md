# PERF-013 — Pool Lifecycle Forensics

## Mission scope

- Environment: isolated Render Staging service and Staging Supabase project only.
- Date: 2026-08-09 UTC.
- Production was not accessed or modified.
- No RLS, authentication, authorization, tenant, schema, migration, plan, pool-size, or API contract change was made.

## Final classification

**MULTIPLE EXTERNAL BOTTLENECKS CONFIRMED**

The application creates one PostgreSQL pool at server bootstrap. Warm leases are reused in sub-millisecond time. Newly established leases take approximately 700–900 ms, while pool waiting remains zero and PostgreSQL execution remains approximately 0.1 ms. The evidence therefore does not show an application-created Pool per request or unnecessary churn. The remaining latency is external to the Student query and includes the remote connection/network/pooler/hosting path. The exact split between Render runtime and Supabase network/pooler is not independently measurable under this mission.

## Source and lifecycle review

The production driver uses a single `Pool` instance constructed by `createPostgresTransactionDriverFromEnvironment()` at process initialization. Each request acquires a client from that shared pool and releases it after the request-scoped transaction. The configured defaults are `max=20`, `idleTimeoutMillis=30000`, and a 5-second connection timeout. There is no request-scoped `new Pool()` path in the reviewed driver.

Render Staging environment inspection exposed the key `DATABASE_URL` and did not expose a separate `DIRECT_URL` key. Secret values were never read or displayed. A direct PostgreSQL comparison was therefore not performed.

## PERF-013 baseline

Three warmups were excluded from the sequential measurements. Twenty sequential requests were executed for the normal endpoint and diagnostic endpoint.

| Metric | Normal endpoint | Diagnostic endpoint |
|---|---:|---:|
| Requests | 20/20 HTTP 200 | 20/20 HTTP 200 |
| Client p50 | 1105.321 ms | 1198.681 ms |
| Client p95 | 1824.326 ms | 1560.164 ms |
| Client p99 | 1824.326 ms | 1560.164 ms |
| Maximum | 2136.868 ms | 1725.605 ms |
| Diagnostic server p95 | — | 1220.439 ms |
| Student DB component p95 | — | 239.495 ms |

The result is variable but remains far above the 300 ms end-to-end target. The PostgreSQL Student component remains stable and small compared with the remote lifecycle.

## Concurrency and reuse evidence

| Load | Client wall | Server p95 | Student DB p95 | New lease observations | Pool waiting |
|---|---:|---:|---:|---:|---:|
| C1 | 2301.698 ms | 1752.623 ms | 239.523 ms | 725.158 ms | 0 |
| C4 | 2434.905 ms | 1951.209 ms | 238.773 ms | 719.789–722.243 ms | 0 |
| C8 | 2597.296 ms | 1625.536 ms | 238.115 ms | 719.882–729.355 ms | 0 |

Warm acquisition samples remained approximately 0.077–0.101 ms. New connection creation appeared only when concurrent demand exceeded currently idle connections, which is expected pool behavior. No sample showed a non-zero `waitingCount`.

## Render correlation

The Staging service log recorded a bootstrap database connection established in 828 ms before the service became live. This independently aligns with the application pool measurements, but it does not identify whether the time is Render runtime, network, or Supabase pooler behavior.

## Tuning decision

No Staging pool tuning was applied. The approved tuning condition was not met: the evidence shows legitimate new leases under concurrent demand, not unnecessary connection creation. Changing `min`, idle timeout, or connection lifetime without a direct comparison would be blind tuning and could increase connection pressure on the free environment.

## Direct comparison decision

No direct PostgreSQL comparison was executed. Render exposes no separate `DIRECT_URL` in the inspected Staging environment, and introducing one would require a new secret/configuration path outside this mission. No credentials were exposed and no infrastructure change was requested.
