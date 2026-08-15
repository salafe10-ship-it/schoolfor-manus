# PERF-010 — Student Read Transaction Latency Report

## Objective

Determine whether a verified redundant remote round-trip can be removed from `GET /api/students?limit=100` while preserving authentication, authorization, transaction-local tenant context, RLS, and the existing response contract.

## Baseline

Staging measurement used three warmup requests followed by twenty sequential requests. All responses were HTTP 200.

| Measure | Result |
|---|---:|
| Client wall-clock p50 | 1106.713 ms |
| Client wall-clock p95 | 1462.937 ms |
| Client wall-clock p99 | 1472.913 ms |
| Minimum | 1057.342 ms |
| Maximum | 1472.913 ms |

The PERF-010 target is Student Read p95 `<= 300 ms`; the target was not met.

## Server Timeline

Diagnostic requests showed the following p95 stage measurements:

| Stage | p95 |
|---|---:|
| Authentication | 210.144 ms |
| Authorization | 0.044 ms |
| Tenant engine | 119.199 ms |
| Tenant PostgreSQL lookup | 119.140 ms |
| Transaction acquire | 236.704 ms |
| Trusted context setup | 118.575 ms |
| Begin/configuration | 236.697 ms |
| Student PostgreSQL diagnostic stage | 238.284 ms |
| Commit | 118.282 ms |
| Pool release | 0.071 ms |
| Server total | 922.516 ms |
| Response residual | 0.542 ms |

The diagnostic Student stage includes the intentionally extra `EXPLAIN` probe. Its measured executor work was approximately `0.058 ms` at the representative request, while the EXPLAIN round-trip was approximately `119.003 ms`. This separates PostgreSQL executor time from network/driver round-trip time.

## Candidate Review

| Candidate | Evidence | Decision |
|---|---|---|
| Remove Auth verification | One required trusted Supabase Auth call; removal weakens session trust | Rejected |
| Remove Tenant lookup | Required to build trusted transaction-local context and support RLS | Rejected |
| Combine Tenant and Student queries | Requires repository/tenant architecture change and would risk isolation | Rejected |
| Remove transaction or commit | Breaks transaction-local RLS context and approved isolation order | Rejected |
| Increase pool or add shared cache/read replica | Explicitly forbidden and changes capacity/architecture | Rejected |
| Remove diagnostic EXPLAIN | Safe only for diagnostic overhead; it is not part of the normal request path | No production optimization required |

No candidate was both redundant and safe within the approved PERF-010 scope.

## Concurrency Sample

The diagnostic concurrency sample used one batch at each level. The observed wall-clock times were noisy and therefore are not certification evidence:

| Concurrency | Wall p50 | Pool p95 | Executor p95 |
|---:|---:|---:|---:|
| 1 | 4537.837 ms | 724.128 ms | 0.171 ms |
| 4 | 2560.834 ms | 722.486 ms | 0.088 ms |
| 8 | 1645.719 ms | 943.994 ms | 0.078 ms |

The sample shows pool wait under load, but does not justify increasing pool size or changing the Render plan. Those are outside the mission.

## Conclusion

The remaining latency is not caused by a verified duplicate application query. The database executor is not the bottleneck. The required Auth, tenant validation, transaction setup, and commit stages cannot be removed without changing approved security architecture. PERF-010 therefore cannot safely certify the `<=300 ms` target under its current constraints.
