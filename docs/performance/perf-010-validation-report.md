# PERF-010 — Validation and Certification Report

## Mission

Student Read Remote Round-Trip Elimination and Authentication Latency Isolation.

Environment: Staging only. Production was not accessed or modified.

## Scope Compliance

- No application code changed.
- No schema, migration, function, trigger, view, or RLS policy changed.
- No authentication, authorization, TenantEngine, transaction, pool, or response-contract redesign.
- No global cache, read replica, service role, PostgreSQL superuser, or RLS bypass used.
- SOP-001 was not modified.

## Validation Results

| Area | Result |
|---|---|
| Student Read baseline | Executed: 3 warmups + 20 sequential requests; all HTTP 200 |
| Student Read p95 target | Not met: 1462.937 ms client wall-clock p95 vs target <=300 ms |
| Auth/tenant/student call inventory | PASS: 1 Auth, 1 Tenant, 1 Student, 0 other DB queries |
| RLS state | PASS: `public.students` RLS enabled |
| Application role | PASS: `edupro_staging_app` has `rolbypassrls=false` |
| Missing auth | PASS: HTTP 401 |
| Invalid auth | PASS: HTTP 401 |
| School tampering | PASS: HTTP 403 for query and header variants |
| Tenant/branch/year tampering | Blocked, but current route maps invalid target errors to HTTP 500 |
| SOP-001 first execution | PASS: HTTP 201 |
| SOP-001 idempotent retry | PASS: HTTP 200 with idempotent success |
| Temporary PERF-010 data cleanup | PASS: `auth_remaining=0`, orphan public-user count marker `0` |
| Production impact | PASS: none |

## Regression Status

The PERF-009 code state remained unchanged. PERF-010 local verification completed with TypeScript PASS, Vitest PASS (`20 files, 122 tests`), Vite production compilation PASS, and server bundle PASS. Vite emitted the existing large-chunk/dynamic-import warnings; the CommonJS server bundle emitted the existing four `import.meta` warnings. PERF-010 introduced documentation only, so no application regression surface was added.

## Remaining Risks

1. The Student Read p95 target remains unmet.
2. Invalid tenant, branch, and academic-year target values are blocked but currently surface as HTTP 500 instead of a normalized HTTP 403. This is a pre-existing error-mapping defect and is outside PERF-010.
3. The observed concurrency sample indicates pool wait under load; changing pool capacity is outside PERF-010 and requires a separate approved capacity exercise.
4. The Staging free-tier/network path contributes materially to end-to-end latency; no Production performance claim is made.

## Final Decision

**REMEDIATION BLOCKED — SECURITY/ARCHITECTURE CONSTRAINT**

The performance target cannot be certified by removing any currently observed Auth, Tenant, transaction, or RLS-related round-trip without violating the approved security architecture or the explicit PERF-010 restrictions. No unsafe workaround was applied. CTO approval is required before any broader architecture or capacity mission.
