# PERF-004 — Production-Like Runtime Latency Forensics

## Environment and protection boundary

- Environment: Render Staging only (`edupro-school-erp-staging`).
- Production: not accessed, changed, or redeployed.
- Protected controls: Authentication, Authorization, TenantEngine, trusted TenantContext, UnitOfWork, DB-SEC-002, DB-SEC-003, SOP-001, and the canonical Student repository were preserved.
- Diagnostic activation: `PERF004_DIAGNOSTICS=true` in Staging plus request header `x-perf-004-probe: 1`. Without both conditions, the diagnostic payload is disabled.
- Diagnostic output contains only a generated trace ID, stage names, elapsed milliseconds, and aggregate measurements. It does not contain credentials, tokens, URLs, connection strings, tenant secrets, or student fields.

## Method

Three warm-up requests were discarded, followed by 20 sequential authenticated requests to `GET /api/students?limit=100`. The test identity and database fixture were synthetic and were deleted after the run. Missing authentication and forged school query/header controls were tested separately.

## Warm baseline

| Metric | Result |
|---|---:|
| Requests | 20 |
| HTTP statuses | 20 × 200 |
| Wall p50 | 2857 ms |
| Wall p95 | 3243 ms |
| Wall p99 | 3268 ms |
| Wall max | 3268 ms |
| Internal request-to-serialization p50 | 2591.564 ms |
| Internal request-to-serialization p95 | 2931.032 ms |
| Response bytes p50 / p95 | 2435 / 2437 |

## Stage measurements

| Stage | p50 | p95 | Interpretation |
|---|---:|---:|---|
| Authentication | 188.434 ms | 527.385 ms | Trusted Supabase identity verification remains enabled. |
| Tenant pool connection | 0.089 ms | 0.159 ms | Warm pool acquisition is not the dominant warm bottleneck. |
| Tenant trusted-context setup | 720.501 ms | 722.042 ms | Dominant: six sequential trusted `set_config` calls in the TenantEngine transaction. |
| Tenant PostgreSQL business query | 120.877 ms | 121.380 ms | Combined school/branch/academic-year lookup. |
| Student pool connection | 0.059 ms | 0.071 ms | Not dominant in the warm run. |
| Student trusted-context setup | 720.462 ms | 721.345 ms | Dominant: the same six sequential trusted `set_config` calls. |
| Student PostgreSQL business query | 120.464 ms | 120.899 ms | Canonical Student read query. |
| Student mapping | below 0.01 ms | below 0.01 ms | Not a bottleneck. |
| Serialization preparation | below 0.02 ms | below 0.02 ms | Not a bottleneck. |

## Query and remote-call evidence

- Runtime business SELECTs per request: 2 — one TenantEngine lookup and one canonical Student lookup.
- The Student query is one statement containing `COUNT(*) OVER()` plus `LIMIT/OFFSET`; separate COUNT and PAGE timings are therefore not available without changing the query shape. No query change was made in PERF-004.
- Static driver evidence shows two request-scoped transactions, each with `BEGIN`, isolation setup, six trusted-context `set_config` calls, one business SELECT, and `COMMIT`: 20 database/driver interactions in total before transport effects, plus two pool connection requests.
- No hidden application remote call was observed in the diagnostic path beyond trusted authentication and PostgreSQL transactions.
- PostgreSQL business execution is approximately 121ms per query while trusted-context setup is approximately 720ms per transaction. The dominant measured layer is trusted-context setup, not PostgreSQL business execution, mapping, serialization, or warm pool acquisition.

## Security and regression evidence

- Missing authentication: HTTP 401.
- Forged `schoolId` query: HTTP 403.
- Forged `x-school-id` header: HTTP 403.
- RLS and trusted transaction context were not disabled or weakened.
- Fixture cleanup: all public fixture counters and the synthetic Auth user returned zero.

## Root cause classification

**BOTTLENECK IDENTIFIED.** The dominant warm latency is the sequential trusted-context setup performed during each of the two request-scoped transactions. PERF-004 does not authorize changing it; remediation belongs to the next CTO-approved performance mission.
