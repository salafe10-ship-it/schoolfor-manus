# TENANT-006 — Validation Report

## Status

Validation is executed in Staging only. Production was not accessed or modified.

## Automated Validation

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | PASS |
| Focused Tenant isolation tests | PASS — 14/14 |
| Full Vitest suite | PASS — 17 files, 115 tests |
| Vite production build | PASS |
| Server bundle | PASS — existing `import.meta` CJS warnings only |
| `git diff --check` | PASS |

## Staging E2E

The authenticated lookup, SOP-001 registration, Student read correctness, cross-tenant isolation, rollback coverage, and preliminary p95 measurements were completed after deployment and are recorded below.

| Gate | Result | Evidence |
|---|---|---|
| TenantEngine Authenticated Lookup | PASS — authenticated lookup resolved the provisioned Staging context |
| Trusted Tenant Context | PASS — context was derived from verified Auth app_metadata |
| School Resolution | PASS |
| Branch Resolution | PASS |
| Academic Year Resolution | PASS |
| Cross-Tenant Isolation | PASS — forged school target returned 403; no-auth request returned 401 |
| RLS Preservation | PASS — DB-SEC-003 unchanged |
| Authentication | PASS — Staging login returned 200 with a trusted session |
| SOP-001 Registration | PASS — committed with HTTP 201 |
| Student Read | PASS — authenticated endpoint returned HTTP 200 |
| Student Read Correctness | PASS — committed student returned in the canonical read response |
| Rollback | PASS — existing transaction rollback suite; lookup itself is read-only |
| Preliminary Student Read p95 | 2929 ms across 10 warm authenticated requests; performance target remains open |
| Production Impact | NONE |

## Data Hygiene

All temporary Auth, tenant, school, branch, academic-year, term, public-user, student, guardian, enrollment, audit, and outbox fixtures were removed. A post-cleanup SQL verification returned zero for all ten scoped counters.

## Performance Reopening

Correctness is certified for the canonical Student read path. The observed end-to-end p95 includes three authenticated REST lookups before the repository query and exceeds the PERF-002 target. This is a performance follow-up and does not weaken the security result; no performance optimization was introduced in TENANT-006.

## Certification Rule

The mission can be certified on Staging only when authenticated tenant resolution, SOP-001 registration, Student read correctness, and cross-tenant isolation all pass. Production readiness is outside this mission.
