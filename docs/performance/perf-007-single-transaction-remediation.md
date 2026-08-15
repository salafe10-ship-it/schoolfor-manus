# PERF-007 — Single Request-Scoped Transaction Remediation

## Status

Implemented on Staging and deployed from commit `e310925`.

Performance certification is **not granted** because the measured Student Read p95 remains above the approved 300 ms budget. The remediation is structurally correct and preserves the existing security boundaries.

## Scope

Only `GET /api/students` and the directly required Student Read infrastructure were changed. Production, schema, RLS policies, RPCs, Finance, Accounting, and unrelated modules were not modified.

## Root Cause

The Student Read request previously acquired two independent database transactions/pool connections: one for tenant resolution and another for the canonical student query. The duplicated boundary added a second context setup and commit/release path to every request.

## Remediation

The route now executes the following request-scoped flow:

`Authentication → permission check → one UnitOfWork transaction → trusted transaction context → tenant validation → canonical student query → commit/release`

The existing repository/provider behavior remains backward compatible when called outside an active transaction. When an active UnitOfWork exists, the tenant snapshot and canonical student repository reuse it instead of opening nested transactions.

## Code Changes

- `server.ts`: Student Read route opens the single UnitOfWork and performs tenant validation inside it.
- `src/middleware/auth.ts`: added the narrow `requirePermissionOnly` middleware so authorization remains separate from the route-owned tenant transaction.
- `src/middleware/tenantValidation.ts`: exposes the request target used for spoofing checks.
- `src/tenant/TenantEngine.ts`: reuses the active request transaction for tenant snapshot reads.
- `src/database/repositories/CanonicalStudentReadRepository.ts`: reuses the active request transaction for the canonical query.
- `src/__tests__/canonicalStudentRead.test.ts`: verifies active-transaction reuse and one transaction boundary.

## Security Preservation

- Authentication and permission checks still execute before business logic.
- Tenant context is derived from trusted authenticated identity and server-side context.
- Forged school query values and forged school headers were rejected with 403.
- Missing and invalid authentication were rejected with 401.
- Staging application role `edupro_staging_app` remains `rolbypassrls = false`.
- Student-related RLS remains enabled for `students`, `guardians`, `enrollments`, and `student_academic_status`, with four policies per table.
- Existing DB-SEC-003 policies use transaction-local `app.*` settings. PERF-007 did not alter those policies; the application path sets them only after trusted authentication and tenant resolution. Any future policy modernization is a separate security mission.

## Rollback

Rollback is a source-only revert of commit `e310925` on the Staging branch followed by a Staging redeploy. No database rollback is required because no schema or data migration was introduced.

## Operational Decision

The one-transaction optimization is **READY FOR CTO REVIEW**, but the overall performance target is **NOT CERTIFIED** until the remaining database/network latency and concurrency pool wait are addressed under a separately approved scope.
