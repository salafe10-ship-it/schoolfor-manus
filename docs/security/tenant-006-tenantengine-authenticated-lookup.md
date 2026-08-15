# TENANT-006 — TenantEngine Authenticated Lookup Remediation

## Scope

Staging-only remediation for the tenant validation failure observed after PERF-002. The change preserves DB-SEC-003, does not use the service role, does not weaken RLS, and does not introduce fallback success in a configured environment.

## Root Cause

TenantEngine resolved `schools`, `branches`, and `academic_years` through the shared anonymous Supabase client. The authenticated request had already passed Supabase Auth verification, but its bearer token was not carried into those lookup requests. Under the Staging security posture, the lookups therefore failed closed before SOP-001 or the canonical Student read repository could run.

## Remediation

- The verified bearer token is retained only on the current Express request for the tenant-validation step.
- TenantEngine accepts that token as an internal parameter and forwards it only to the three trusted lookup operations.
- Each lookup uses a request-scoped Supabase client with `SUPABASE_ANON_KEY`, `Authorization: Bearer <verified-token>`, session persistence disabled, and the existing request timeout.
- No client-selected tenant, school, branch, or academic year is used to construct identity.
- No service-role key, database bypass, RLS change, fallback record, cache sharing, or persistent token storage was introduced.

## Security Invariants

1. Authentication runs before tenant resolution.
2. Only `extractTrustedIdentity` output supplies identity claims.
3. The bearer token is never logged, persisted, or returned to the client.
4. A configured database still fails closed when authenticated lookup returns an error or no matching record.
5. DB-SEC-003 remains unchanged.

## Files

- `src/database/client.ts`
- `src/tenant/TenantEngine.ts`
- `src/middleware/tenantValidation.ts`
- `server.ts`
- `src/__tests__/tenantIsolation.test.ts`

## Validation

Unit, TypeScript, frontend production build, server bundle, and Staging E2E results are recorded in `tenant-006-validation-report.md`.
