# PERF-006 — Authentication and Transaction Forensics

**Environment:** Staging only (`edupro-school-erp-staging`)

**Commit:** `659ad2a`

**Date:** 2026-08-09

## Mission result

**BOTTLENECK IDENTIFIED.** PERF-006 was diagnostic only. No authentication rewrite, SQL rewrite, pool-size change, schema change, RLS change, or Production action was performed.

## Instrumentation safety

- Diagnostics require the existing Staging `PERF004_DIAGNOSTICS=true` flag and the explicit `x-perf-004-probe: 1` request header.
- Production configuration was not changed.
- Reports contain stage names, elapsed times, and aggregate call counts only; no tokens, passwords, student personal data, or tenant values are recorded.

## Representative request timeline

The following is one server-side final trace from Render, measured from request receipt. `response_sent` is taken from the Express `finish` event.

| Point | Event | Elapsed ms |
|---|---|---:|
| T0 | Request received | 0.017 |
| T1 | Authentication start | 0.051 |
| T2 | Authentication complete | 186.727 |
| T3 | TenantEngine start | 186.791 |
| T4 | TenantEngine complete | 778.940 |
| T5 | Student transaction start | 779.016 |
| T6 | Student connection acquired | 779.073 |
| T7 | Student trusted context established | 1133.328 |
| T8 | Student query start | 1133.362 |
| T9 | Student query complete | 1251.973 |
| T10 | Student mapping complete | 1251.982 |
| T11 | Student commit complete | 1369.995 |
| T12 | Student connection released | 1370.038 |
| T13 | Response generated | 1370.231 |
| T14 | Response sent | 1370.848 |

## Call graph per request

| Operation | Count |
|---|---:|
| Authentication remote calls | 1 |
| Tenant database queries | 1 |
| Student database queries | 1 |
| Other database queries | 0 |
| Transactions | 2 |
| Trusted context commands | 2 |
| Pool acquisitions | 2 |
| Other HTTP remote calls | 0 |

The single authentication call is also the only HTTP remote call observed for the Student Read request. Tenant context uses one aggregate PostgreSQL query; Student Read uses one PostgreSQL query.

## Findings

1. The remaining dominant server-side stage is `TenantEngine`, approximately 592–593ms p95 in the final Render log sample. It contains transaction setup/context, one tenant query, and tenant commit.
2. `tenantTransactionAcquire` and `studentTransactionAcquire` are each approximately 354ms p95 because they include the transaction begin/configuration path, not pool acquisition alone.
3. Each PostgreSQL business query is approximately 119ms p95. Student mapping and serialization are effectively zero-cost at the measured scale.
4. Authentication is not the largest sequential server-side stage in this trace; it is approximately 188ms p95 in the observed Render sample.
5. The server-side response residual is sub-millisecond in the observed final traces (approximately 0.618ms p95 in the visible Render sample). The difference between the client wall time and server `response_sent` is therefore reported as a measured client/server transport gap, not asserted to be a specific network cause.
6. Under controlled concurrency, pool wait becomes material: approximately 736ms p95 at four concurrent requests and 970ms p95 at eight concurrent requests. This is a separate concurrency bottleneck from the sequential TenantEngine cost.

## Security regression

- Missing authentication: HTTP 401.
- Forged school query value: HTTP 403.
- Forged school header value: HTTP 403.
- `edupro_staging_app.rolbypassrls`: `false`.
- RLS observed enabled on `students`, `student_guardians`, `enrollments`, and `student_academic_status`.
- No service-role credential was used by the diagnostic run.

## Regression and cleanup

- SOP-001 registration: HTTP 201 and success.
- Same idempotency key retry: HTTP 200 and idempotent.
- Temporary fixture cleanup: verified Auth rows 0, PERF-006 tenant rows 0, and P006 student rows 0.
