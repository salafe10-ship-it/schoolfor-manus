# CONN-SEC-002 — Staging Connection Identity Diagnostic

## Mission

Provide a temporary, server-side gated diagnostic capability for Staging so CONN-SEC-001B can prove the real PostgreSQL connection identity. Production, RLS, schema, migrations, grants, roles, and business logic are outside scope.

Date: 2026-08-10

## Implementation

- Added `server/infrastructure/StagingConnectionDiagnostics.ts` with a single approved identity query and a strict Staging feature gate.
- Added `PostgresTransactionDriver.inspectPoolIdentity()` to sample the existing application pool. It starts and rolls back a harmless transaction for every sample and releases every client.
- Added `/api/internal/staging/connection-identity` in `server.ts`.
- The route requires the existing trusted authentication middleware and `DATABASE_MONITOR` permission.
- The route is enabled only when both server-side flags are set:
  - `EDUPRO_ENVIRONMENT=staging`
  - `CONN_DIAGNOSTIC_ENABLED=true`
- Pool sample count is bounded to 1–5 by `CONN_DIAGNOSTIC_SAMPLE_COUNT` and defaults to 3.
- UnitOfWork is exercised through its existing request-scoped transaction path. The harmless identity read is deliberately rolled back.

## Allowed output

The diagnostic returns only:

- `current_user`
- `session_user`
- `rolsuper`
- `rolbypassrls`

It never returns passwords, connection strings, JWTs, pool credentials, environment variables, or arbitrary SQL results.

## Lifecycle and removal

The capability is temporary and Staging-only. After CONN-SEC-001B certification, disable the feature flag and remove the diagnostic route and driver sampling method before any Production release.

## Explicit non-changes

- No RLS policy or schema change.
- No database role, grant, pool-size, or connection-string change.
- No Student Documents, SOP-001, authorization registry, tenant engine, or business repository change.
- No Production access or configuration change.
