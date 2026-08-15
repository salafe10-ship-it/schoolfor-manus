# PERF-004 — Validation Report

## Mission status

**Diagnostic complete — BOTTLENECK IDENTIFIED. Student Read Performance remains NOT CERTIFIED.**

## Scope

Staging only. Production was not accessed or modified.

## Automated validation

| Check | Result |
|---|---|
| TypeScript | PASS |
| PERF-004/Tenant/Canonical focused tests | PASS — 3 files, 20 tests |
| Full Vitest | PASS — 18 files, 117 tests |
| Vite production build | PASS |
| Server bundle | PASS — 4 pre-existing `import.meta` CJS warnings |
| `git diff --check` | PASS |

The final timing instrumentation patch also passed TypeScript and the focused 20-test suite. It contains no business query or security-policy change.

## Deployment

| Item | Result |
|---|---|
| PERF-004 instrumentation commit | `6760719` |
| Timing split commit | `0b8f362` |
| Branch | `codex/sop-001-staging` |
| Render Staging | Live and healthy |
| Production impact | NONE |

## Live diagnostic baseline

Three warm-up requests were discarded; 20 sequential warm authenticated requests were measured. All returned HTTP 200.

| Metric | Result |
|---|---:|
| Wall p50 | 2857 ms |
| Wall p95 | 3243 ms |
| Wall p99 | 3268 ms |
| Wall max | 3268 ms |
| Internal p95 to serialization preparation | 2931.032 ms |
| Response size p50 / p95 | 2435 / 2437 bytes |
| TenantEngine calls/request | 1 |
| Student business SELECTs/request | 1 |
| Total business SELECTs/request | 2 |
| Warm Tenant pool-connect p95 | 0.159 ms |
| Warm Tenant trusted-context p95 | 722.042 ms |
| Warm Tenant PostgreSQL query p95 | 121.380 ms |
| Warm Student pool-connect p95 | 0.071 ms |
| Warm Student trusted-context p95 | 721.345 ms |
| Warm Student PostgreSQL query p95 | 120.899 ms |

## Security regression gates

| Gate | Result |
|---|---|
| Authentication | PASS — missing authentication returned 401 |
| Tenant isolation | PASS — forged query and header returned 403 |
| RLS | PASS — unchanged and not bypassed |
| Correctness | PASS — authenticated Student read returned 200 |
| Fixture cleanup | PASS — all synthetic public and Auth counters returned 0 |

## Decision

The performance target is `p95 <= 300 ms`; the measured warm wall p95 is 3243ms. Therefore Student Read Performance is **NOT CERTIFIED**.

The measured bottleneck is the sequential trusted-context setup (`set_config`) executed inside each of the two transactions. PERF-004 made no optimization and did not alter RLS, authentication, authorization, TenantEngine behavior, pool size, PostgreSQL resources, or query shape.

## Next gate

PERF-005 may address only the measured trusted-context overhead after CTO approval. Any remediation must preserve the trusted request-local context, RLS, and tenant isolation, then repeat the same 20-request warm benchmark.
