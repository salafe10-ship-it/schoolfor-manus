# PERF-001 — Production-Like Staging End-to-End Performance Certification

## Scope and environment

- Environment: isolated Render Staging service only (`edupro-school-erp-staging`).
- Branch: `codex/sop-001-staging`.
- Deployment tested: DB-SEC-003 commit `8f027e3`, live on Render.
- Plan: Render Free; cold-start and pooled/network latency are therefore recorded separately from PostgreSQL execution.
- Data: synthetic PERF-001 tenant, school, branch, academic year, term, Auth user, and 21 registration aggregates. No Production data or credentials were used.
- Cleanup: completed and verified; all PERF-001 tenant, Auth user, student, and audit counts are zero.

## Approved budgets

| Workload | Target |
|---|---:|
| Student lookup | p95 ≤ 300 ms |
| Current academic status lookup | p95 ≤ 300 ms |
| Document lookup | p95 ≤ 300 ms |
| Student registration write | p95 ≤ 800 ms |

## Cold and warm authentication path

The first authenticated session request after a controlled Render service restart completed successfully in **1,143.58 ms** (HTTP 200). This is recorded as cold/wake behavior and is not mixed into the warm sample.

| Request | n | Success | p50 | p95 | p99 | Max | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| Warm `/api/auth/session` | 20 | 20/20 | 454.75 ms | 716.81 ms | 744.07 ms | 744.07 ms | Observed, not a Student SLA |

## Warm application measurements

| Request | n | Success | p50 | p95 | p99 | Max | Budget result |
|---|---:|---:|---:|---:|---:|---:|---|
| `GET /api/students?limit=100` | 20 | 20/20 | 1,315.09 ms | 1,774.23 ms | 1,929.08 ms | 1,929.08 ms | FAIL |
| `GET /api/students/:id/timeline` | 20 | 20/20 | 1,149.77 ms | 1,530.42 ms | 2,213.54 ms | 2,213.54 ms | FAIL; timeline proxy only |
| `POST /api/student-registration` | 20 | 20/20 | 3,983.95 ms | 4,948.89 ms | 5,965.77 ms | 5,965.77 ms | FAIL |

The first exploratory request batch contained transient 401 responses while the free service was stabilizing; it was not used as the final warm sample. The final stable sample above was 20/20 successful for each measured endpoint.

## Data-path correctness finding

The synthetic registration path created 21 rows in each of the expected student, guardian, enrollment, audit, and outbox families. A subsequent authenticated `GET /api/students?limit=100` returned HTTP 200 with `data=[]` and `totalCount=0`.

This is not a performance-only variance. It is a data-path correctness blocker: the current Student read endpoint does not expose the committed Staging rows. Source review shows `StudentService.advancedSearch` delegates to the legacy `StudentRepository`, which uses the generic Supabase client/fallback path, while SOP-001 registration uses the request-scoped PostgreSQL UnitOfWork. The two paths are not currently equivalent evidence of the same database truth.

## Missing required surfaces

- No dedicated protected HTTP endpoint for current academic status lookup was found in `server.ts`.
- No dedicated protected HTTP endpoint for Student document lookup was found in `server.ts`.
- The timeline endpoint was measured only as a Student timeline proxy; it is not a certification of current academic status or document lookup.

The database-only measurements from DB-SEC-003 remain valid and passed: Student 0.089 ms p95, status 0.089 ms p95, document 0.170 ms p95, and write 0.610 ms p95. They cannot substitute for the missing or inconsistent end-to-end API paths.

## Security and isolation

- RLS remained enabled throughout.
- No policy was weakened or bypassed.
- Authentication, authorization, TenantContext, UnitOfWork, and the actual registration path were used.
- Production was untouched.

## Certification decision

`DATABASE-LEVEL TENANT ISOLATION CERTIFIED ON STAGING`

`RLS: CERTIFIED ON STAGING`

`PERFORMANCE NOT CERTIFIED — REMEDIATION REQUIRED`

The performance gate remains closed because the measured Student read and registration write exceed their budgets, and the read endpoint returns an empty result despite committed synthetic rows. No Production Ready decision is implied.
