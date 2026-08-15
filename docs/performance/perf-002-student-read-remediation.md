# PERF-002 — Canonical Student Read Path Remediation

## Mission

PERF-002 remediates the correctness failure identified by PERF-001: Student Registration committed records through the request-scoped PostgreSQL `UnitOfWork`, while `GET /api/students` read through the legacy Supabase/FallbackStorage repository. The remediation establishes one protected PostgreSQL read path for the Student list endpoint.

## Scope and safety boundary

- Environment: Staging only.
- Production: untouched.
- Student Registration writes: unchanged.
- DB-SEC-002 trusted transaction context: preserved.
- DB-SEC-003 RLS policies: unchanged.
- TenantEngine and authorization middleware: unchanged.
- No schema, migration, RLS, or policy changes.

## Trace before the change

`GET /api/students`

1. `server.ts` authenticated the request and applied the centralized permission and tenant middleware.
2. The route called `StudentService.advancedSearch(schoolId, searchParams)`.
3. `StudentService.advancedSearch` delegated to `StudentRepository.advancedSearch`.
4. `StudentRepository.advancedSearch` checked `FallbackStorage`, then queried the anon Supabase client when available.
5. On query failure it returned FallbackStorage data instead of failing closed.

This was not the same persistence path used by SOP-001. It also allowed the legacy repository's client-side school argument to influence the read path and could silently hide a database failure.

## Canonical path after the change

`GET /api/students`

1. `server.ts` authenticates the request.
2. Authorization and tenant validation run through the existing middleware chain.
3. `tenantValidationMiddleware` establishes the trusted `TenantContext`.
4. `StudentService.advancedSearch` passes the middleware-created trusted `TenantContext` to `CanonicalStudentReadRepository`.
5. The repository requires that trusted context and a configured PostgreSQL transaction driver. The context is type-only in the shared service path, so Node-only async context code is not pulled into the browser bundle.
6. A request-scoped `UnitOfWork` begins a PostgreSQL transaction with the trusted context.
7. The parameterized query applies `tenant_id`, `school_id`, `branch_id`, and `deleted_at IS NULL` predicates.
8. `PostgresTransactionDriver` applies the trusted context using transaction-local settings; DB-SEC-003 RLS remains the database enforcement layer.
9. Query failure rolls back and propagates; no FallbackStorage or anon-client fallback is used.

## Tenant and security invariants

- The route's legacy `schoolId` parameter remains only for backward-compatible method shape; it is not used to scope the SQL query.
- Tenant, school, and branch predicates are populated from the trusted context produced by the existing authentication/tenant middleware.
- No request body, query parameter, or client-selected identity supplies the tenant scope.
- The read transaction uses the configured `edupro_staging_app` path and does not require a superuser or RLS bypass.
- Missing tenant context and missing transaction driver fail closed.

## API compatibility

The response shape remains `{ data, totalCount, page, limit }`. Canonical rows are mapped to the existing Student list contract, including `id`, `studentNumber`, `name`, status, dates, and tenant-visible identifiers.

The canonical Student schema does not contain the legacy placement and finance fields (`classroom`, `section`, `fees_remaining`). Those fields are returned as empty/default compatibility values and are not used to fabricate results. Classroom and outstanding-fee filtering require a separately approved academic/finance read model and are intentionally not implemented in PERF-002.

## Files changed

- `server.ts`
- `src/database/repositories/CanonicalStudentReadRepository.ts`
- `src/database/services/StudentService.ts`
- `src/__tests__/canonicalStudentRead.test.ts`

## Local verification

- TypeScript compilation: PASS.
- Focused canonical read, trusted-context, and Student Registration tests: PASS.

Staging end-to-end performance and isolation results are recorded separately in `perf-002-performance-validation.md` after deployment.
