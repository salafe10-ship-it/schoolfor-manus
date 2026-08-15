# PERF-007 — Validation Report

## Environment

- Environment: Staging only
- Service: `edupro-school-erp-staging`
- Branch: `codex/sop-001-staging`
- Code commit: `e310925`
- Production impact: None

## Local Validation

| Check | Result |
|---|---|
| TypeScript/lint | PASS |
| Focused Student Read tests | PASS — 5 files, 42 tests |
| Full Vitest suite | PASS — 20 files, 121 tests |
| Production build | PASS |
| `git diff --check` | PASS |

The build retained pre-existing non-blocking warnings for large chunks and CommonJS `import.meta` usage in unrelated financial files.

## Live Student Read Validation

Warm-up: 3 requests. Sequential sample: 20 requests. All responses were HTTP 200 with correct Student data and no request errors.

| Metric | Result |
|---|---:|
| Client wall-clock p50 | 1217.839 ms |
| Client wall-clock p95 | 1607.727 ms |
| Client wall-clock p99 | 1724.611 ms |
| Maximum | 1724.611 ms |
| Transactions per request | 1 |
| Pool acquisitions per request | 1 |
| Transaction context commands | 1 |
| Tenant DB queries | 1 |
| Student DB queries | 1 |
| Other DB queries | 0 |

Representative server trace:

- Authentication: approximately 197.528 ms
- Tenant engine: approximately 120.955 ms
- Student PostgreSQL work: approximately 119.704 ms
- Commit: approximately 119.823 ms

## Concurrency Validation

All requests at concurrency 1, 4, and 8 returned HTTP 200 with one transaction and one pool acquisition per request.

| Concurrency | Wall p95 | Pool-connect wait p95 |
|---:|---:|---:|
| 1 | 1527.762 ms | 0.141 ms |
| 4 | 2740.488 ms | 734.984 ms |
| 8 | 2509.238 ms | 729.877 ms |

## Security and Isolation Regression

| Test | Expected | Result |
|---|---|---|
| Missing authentication | 401 | PASS |
| Invalid token | 401 | PASS |
| Forged school query | 403 | PASS |
| Forged school header | 403 | PASS |
| Cross-tenant Student Read path | blocked by trusted tenant validation/RLS path | PASS |
| App role `edupro_staging_app` bypass flag | false | PASS |
| RLS enabled on four Student target tables | enabled | PASS |
| Policies per target table | 4 each | PASS |

The current Staging policy definitions use trusted transaction-local `app.tenant_id`, `app.school_id`, `app.branch_id`, and `app.user_id` settings. The application sets these only after authentication and tenant validation. No RLS policy was changed by PERF-007.

## SOP-001 Regression and Idempotency

- First registration request: HTTP 201, success.
- Same idempotency key retried: HTTP 200, success, idempotent replay confirmed.
- Temporary registration fixture, linked guardian, public provisioned user, and Auth user were removed from Staging.
- Final cleanup verification: Auth rows 0, public user rows 0, Student rows 0, Guardian rows 0, related audit rows 0.

## Certification Decision

**Performance certification: NOT CERTIFIED.** The approved Student Read p95 target is ≤300 ms; the measured p95 is 1607.727 ms. The architectural objective was met — one request-scoped transaction, one pool acquisition, and one trusted context setup — but the remaining database/network latency and concurrency pool wait require a new approved performance scope.

**Security/regression status: PASS for the tested Staging application path.**

**Overall mission status: READY FOR CTO REVIEW — PERFORMANCE NOT CERTIFIED.**

## Recommended Next Decision

CTO should choose a separately scoped follow-up for database/network latency and concurrency pool wait. Do not alter RLS, schema, pool sizing, or Production as part of PERF-007.
