# DB-SEC-002 — Trusted Tenant Context Contract

## Purpose

Define the only supported path for database tenant context before RLS policy implementation.

## Trusted source

The context is derived after Supabase Auth verification, authorization, and tenant validation. It is passed from the server-side `TenantContext` into the Student Registration Unit of Work. Request body, query parameters, arbitrary headers, local storage, and client-selected school/branch values are not authority.

Required fields for the Student Registration path:

- `tenantId`
- `schoolId`
- `branchId`
- `academicYear`
- `userId`
- `role`

The current validation requires a non-empty context and requires `tenantId === schoolId`, matching the existing project tenant model. Branch and academic-year authorization remains the responsibility of the trusted Tenant Engine before the transaction starts.

## Database propagation

`PostgresTransactionDriver.begin()` executes `BEGIN`, then applies each supplied context field with parameterized `set_config(name, value, true)`. The third argument is `true`, so the setting is transaction-local (`SET LOCAL` semantics). The application does not expose a database endpoint or a client-controlled context setter.

The context is never set with ordinary session-level `SET`, and it is not stored in a process-global variable. PostgreSQL clears it automatically at COMMIT or ROLLBACK before the pooled connection can serve another request.

## Failure behavior

- Tenant/school mismatch: transaction start fails closed and the connection is rolled back/released.
- Missing trusted context for the Student Registration path: the service rejects incomplete context before business work.
- Invalid tenant, school, branch, or academic year: Tenant Engine rejects the request before business work.
- A failed transaction: ROLLBACK and pool release occur before the error returns.

## Pool isolation contract

Every request must establish context inside its own database transaction. No request may issue arbitrary `SET app.*` through a public API. Future RLS policies must treat absent or invalid context as deny-by-default and must be tested with two concurrent connections.

## Certification boundary

This contract certifies the Staging application identity and transaction-local propagation only. It does not certify RLS until DB-SEC-003 installs policies and executes the hostile cross-tenant matrix under `edupro_staging_app`.

## Live verification

The deployed Staging service accepted a trusted Auth session and completed the SOP-001 Student Registration transaction using the restricted connection role. The temporary test aggregate and its audit/outbox records were then removed and verified absent. No RLS result is inferred from this workflow.
