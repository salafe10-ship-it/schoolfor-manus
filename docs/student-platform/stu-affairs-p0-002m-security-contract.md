# STU-AFFAIRS-P0-002M — TransferOperation Security Contract

## Status

Security/architecture design only. No RLS, schema, migration, role, or application change is included.

## Security objective

`TransferOperation` must be inaccessible across tenants even if a client sends a forged tenant, school, branch, actor, operation key, or result reference.

## Required trust chain

1. Supabase Auth authenticates the request.
2. Server middleware resolves the authenticated user and trusted tenant context.
3. Tenant, school, branch, actor, role, request ID, and correlation ID are server-derived.
4. The database transaction receives only that trusted context through the approved connection contract.
5. Database policy fails closed when trusted context is absent, malformed, or mismatched.

## Policy requirements

- Every read, claim, update, reconciliation, and purge is tenant-scoped.
- School/branch filters are derived from trusted context and the operation record; client values are not authoritative.
- Actor references must belong to the same tenant and be active.
- Operation key uniqueness is tenant/namespace scoped.
- Result references cannot point outside the same tenant.
- `PROCESSING` and `RECONCILE_REQUIRED` records cannot be purged by ordinary application roles.
- Service-role bypass is not an application authorization mechanism.

## Current contract decision

The existing RLS migration uses `current_setting('app.*')`, while the platform audit requirements call for trusted JWT/app metadata and fail-closed behavior. It is not safe to declare `current_setting` alone an approved TransferOperation trust source without an independent security review of who can set it, connection pooling, `SET LOCAL` lifetime, and role permissions.

## Required security decisions

- Whether trusted JWT `app_metadata` is the authoritative database identity source.
- Whether server-injected transaction settings are permitted only as a verified derived context.
- Whether `FORCE ROW LEVEL SECURITY` is required.
- Which roles may read, claim, reconcile, and purge.
- How missing/mismatched context is rejected.

Until these decisions are approved, no physical TransferOperation table may be created.
