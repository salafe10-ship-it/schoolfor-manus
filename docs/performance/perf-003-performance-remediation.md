# PERF-003 — Student Read Performance Remediation

## Scope

Staging-only performance remediation for the authenticated Student read path. Security contracts, DB-SEC-002, DB-SEC-003, SOP-001 transaction behavior, and the response contract remain unchanged.

## Baseline

After TENANT-006, the authenticated `GET /api/students` path was correct but the preliminary end-to-end p95 was 2929 ms. The latency included three sequential Supabase REST lookups in TenantEngine before the canonical PostgreSQL Student repository ran.

## Remediation

When the server-side PostgreSQL transaction driver is configured, TenantEngine now performs one request-scoped, read-only transaction containing a single parameterized PostgreSQL lookup for:

- trusted school existence;
- active/provisioning branches in the trusted school;
- planned/active academic years scoped to the trusted branch.

The lookup uses the same trusted identity-derived context applied by the existing transaction driver. It does not use client tenant values, service-role credentials, RLS bypass, fallback data, global cache, or schema changes. The existing authenticated Supabase REST path remains available only where the server transaction driver is not configured, preserving browser/test compatibility and fail-closed behavior in configured environments.

## Invariants

1. Authentication precedes TenantEngine.
2. TenantEngine identity comes only from verified Supabase Auth `app_metadata`.
3. All SQL parameters are bound values.
4. The lookup transaction is request-scoped and released by UnitOfWork.
5. RLS and the restricted `edupro_staging_app` role remain unchanged.
6. SOP-001 remains the existing transaction boundary.

## Validation

Results are recorded in `perf-003-validation-report.md` after the Staging deployment and controlled benchmark.
