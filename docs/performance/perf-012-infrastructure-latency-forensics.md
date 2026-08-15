# PERF-012 — Staging Infrastructure Latency Forensics

## Mission and scope

- Environment: isolated Render Staging service backed by the Staging Supabase project.
- Date: 2026-08-09 UTC.
- Endpoint under test: `GET /api/students?limit=100`.
- Production was not accessed or modified.
- Authentication, authorization, trusted tenant context, transaction-local context, RLS, and the `edupro_staging_app` role were preserved.

## Attribution result

**Mandatory classification: F — multiple external infrastructure bottlenecks.**

The evidence separates a fast database executor and a fast warm pooled lease from a materially slower newly established pooled lease. The end-to-end staging path also includes remote authentication, tenant resolution, and Render-to-Supabase network time. The exact contribution of Render free-tier scheduling versus Supabase pooler/network behavior cannot be isolated with the permitted controls, so the precise free-tier source remains **UNVERIFIED SOURCE**.

## Phase 1 — normal Student Read baseline

Three warmups were excluded. Twenty sequential requests were executed against the normal endpoint without `EXPLAIN` and without a diagnostic bypass.

| Metric | Result |
|---|---:|
| Successful requests | 20/20 (HTTP 200) |
| Client wall p50 | 1073.194 ms |
| Client wall p95 | 1114.749 ms |
| Client wall p99 | 1114.749 ms |
| Maximum | 1125.428 ms |
| Returned totalCount | 0 |

Concurrency samples on the same normal path were HTTP 200 at C1, C4, and C8. Client wall times were 1168.428 ms, 2058.038 ms, and 2134.149 ms respectively.

## Phase 2 — lifecycle instrumentation

The diagnostic path measured request, pool lease acquisition, connection creation as observed by the pool, transaction occupancy, release, and database executor time. No pool configuration was changed.

| Metric | Sequential diagnostic result |
|---|---:|
| Successful requests | 20/20 (HTTP 200) |
| Client wall p50 | 1202.266 ms |
| Client wall p95 | 1341.007 ms |
| Client wall p99 | 1341.007 ms |
| Maximum | 1619.591 ms |
| Server total p50 | 908.082 ms |
| Server total p95 | 933.739 ms |
| Server total p99 | 933.739 ms |
| Server maximum | 1254.954 ms |

Observed component contribution p95 values were approximately: remote auth 215.129 ms, tenant resolution 120.895 ms, and Student DB work 241.017 ms. The database executor itself remained near 0.1 ms.

## Phase 3 — warm versus new pooled leases

| Load | Warm acquisition | Newly created acquisition / creation | Pool waiting |
|---|---:|---:|---:|
| C1 | 0.071 ms | 0 ms | 0 |
| C4 | 0.084 ms sample | up to 902.855 ms | 0 |
| C8 | 0.107 ms sample | up to 752.986 ms | 0 |

Across the C1/C4/C8 samples, warm leases had p95 acquisition of approximately 0.089 ms. Newly created leases had p95 acquisition/creation of approximately 887.926 ms, with a maximum of 902.855 ms. `waitingCount` remained zero, so queue contention was not observed. Transaction occupancy was approximately 0.71–0.77 seconds on the measured new-lease samples, while executor time remained below 0.12 ms.

## Phase 4 — network and control path

A permitted Supabase REST control path returned 20/20 HTTP 200 with client wall p50 141.116 ms, p95 422.413 ms, p99 422.413 ms, and maximum 668.283 ms. This control path is not treated as a direct PostgreSQL equivalent; it only confirms that remote service/network latency is variable and materially below the slow newly-created PostgreSQL lease in the measured samples.

DNS, TCP, TLS/SSL handshake, and pooler sub-phases were not independently measured. No SSL setting was disabled, and no claim is made that SSL alone is the cause.

## Phase 5 — database correlation

The instrumented application timestamps show that the large increment appears before useful database execution on newly established leases. The PostgreSQL executor remained near 0.1 ms, and pool waiting remained zero. This rules out the Student SQL executor and an exhausted application pool as the primary measured cause.

## Security regression evidence

| Case | Expected | Observed |
|---|---:|---:|
| Valid trusted Student Read | 200 | 200 |
| Missing Authorization | 401 | 401 |
| Invalid bearer token | 401 | 401 |
| Forged school query | 403 | 403 |
| Forged school header | 403 | 403 |
| Forged tenant | 403 | 403 |
| Forged branch | 403 | 403 |
| Forged academic year | 403 | 403 |

## Conclusion

The measured application and database work are not the source of the 700–900 ms step. The evidence supports classification F: multiple external infrastructure contributors, dominated in this run by newly established remote pooled connections, with Render/Supabase network or pooler contribution not independently separable under the approved constraints. The staging end-to-end latency target is therefore not certifiable on the current runtime.
