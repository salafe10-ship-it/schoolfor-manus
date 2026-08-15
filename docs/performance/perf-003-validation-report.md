# PERF-003 — Validation Report

## Scope

Staging only. Production was not accessed or modified.

## Automated Validation

| Check | Result |
|---|---|
| TypeScript | PASS |
| Focused Tenant/Student/Registration tests | PASS — 3 files, 24 tests |
| Full Vitest | PASS — 17 files, 115 tests |
| Vite production build | PASS |
| Server bundle | PASS — 4 pre-existing `import.meta` CJS warnings |
| `git diff --check` | PASS |

## Benchmark

The final controlled benchmark ran against Render Staging after commit `0d8f33c` was live. It used one authenticated test identity and eight sequential `GET /api/students?limit=100` requests. No credentials, tokens, or customer data are recorded here.

| Metric | Result |
|---|---|
| Baseline p95 | 2929 ms (TENANT-006, n=10) |
| Final p95 | 4243 ms (n=8) |
| Baseline p99 | NOT RECORDED in TENANT-006 |
| Final p99 | 4243 ms (n=8) |
| Final p50 | 2858 ms (n=8) |
| Final max | 4243 ms (n=8) |
| TenantEngine calls/request | 1 — verified by the PERF-003 code path; runtime tracing not enabled |
| Database calls/request | 1 server-side tenant snapshot transaction — verified by the PERF-003 code path; runtime tracing not enabled |
| Network calls/request | 1 client HTTP request; no per-request network telemetry was added |
| Pool acquisition | Not instrumented |
| PostgreSQL execution | Not instrumented separately |
| Serialization | Not instrumented separately |
| Response size | Not captured in the benchmark |
| N+1 status | Tenant lookup N+1 removed; the canonical student query still intentionally performs its count and page query |

## Regression Gates

| Gate | Result |
|---|---|
| RLS status | Must remain PASS — DB-SEC-003 unchanged |
| Student correctness | PASS — authenticated read returned 200 and read back the registered test student |
| Tenant isolation | PASS — forged query and `x-school-id` header returned 403 |
| Authentication | PASS — authenticated login returned 200; missing authentication returned 401 |
| SOP-001 registration | PASS — first request 201; repeated idempotency key returned 200/idempotent |
| Cleanup verification | PASS — all PERF-003B public-table counters and Auth user counter returned 0 |
| Production impact | NONE |

## Certification Rule

Student Read Performance is **NOT CERTIFIED**. Correctness, authentication, tenant isolation, regression, and cleanup passed, but the final Staging read benchmark was p95 4243 ms (p50 2858 ms), above the required 300 ms budget. The remaining latency is outside the eliminated TenantEngine N+1 path and requires a separate approved performance investigation before certification. No Production change was made.
