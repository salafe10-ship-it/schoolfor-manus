# STU-AFFAIRS-P0-006-10 — Authorization Cache Security Decision

Status: `UNDECIDED — SECURITY/OPERATIONS APPROVAL REQUIRED`

## Current evidence

The database permission assignment is resolved from identity and scope, while `AuthorizationEngine` caches the permission set by role. Middleware clears the engine cache before route checks, but this does not establish a safe contract for direct engine consumers or future scope-sensitive checks.

## Decision options

| Option | Security effect | Operational effect | Status |
|---|---|---|---|
| No shared authorization cache | Fresh resolution for every protected decision | More database/load cost | `UNDECIDED` |
| Scoped cache | Key by identity, tenant, school, branch, assignment/permission revision | Requires revision and invalidation ownership | `RECOMMENDED FOR REVIEW` |
| Role-only cache | Shares permissions across identities/scopes | Fast but privilege leakage risk | `REJECTED FOR SCOPE-SENSITIVE USE` |

## Recommended review position

If caching is approved, use:

`identity_id + tenant_id + school_id + branch_id + permission_revision → permission set`

Require bounded TTL, fail-closed behavior when the source/revision is unavailable, and invalidation on role assignment, permission, scope, user status, or session changes. Sensitive approval operations should bypass stale shared cache or use an approved immutable authorization snapshot.

## Unresolved decisions

- whether a permission/assignment revision exists;
- who owns revision increments and invalidation;
- maximum TTL;
- whether direct engine consumers are allowed;
- whether cache hit/miss and invalidation failures are audited;
- whether cache failure always denies.

No TTL, revision, or exception is invented by this document.
