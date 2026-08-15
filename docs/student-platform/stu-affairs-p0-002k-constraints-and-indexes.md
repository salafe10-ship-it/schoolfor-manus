# STU-AFFAIRS-P0-002K — Constraints, Isolation, and Index Strategy

## Logical constraints

- operation identity is unique within a tenant and namespace;
- operation key and payload hash are non-empty;
- status is one of the approved lifecycle states;
- processing/claim timestamps are paired and ordered;
- committed status requires a result reference and completion timestamp;
- reconcile-required status requires a reason and reconciliation metadata;
- retry count is non-negative and bounded by policy;
- optimistic version is positive;
- tenant and actor references are trusted server values;
- the record cannot be hard-deleted during the replay-retention window.

## Tenant isolation

Every lookup, claim, replay, update, and cleanup operation must include the trusted tenant scope. A client-supplied tenant or school value must never select an operation record. Cross-tenant key reuse is independent and must not collide.

## Scope model

The operation record may store source/destination fingerprints for conflict and audit, but authoritative school/branch/year/term validity remains in Enrollment and Tenant Context validation. The store must not become a second tenant-policy engine.

## Required indexes

Only after schema review, the implementation should consider:

1. unique lookup on tenant + namespace + operation key;
2. claim/recovery queue lookup on status + next-attempt/claimed timestamp;
3. reconciliation lookup on tenant + status + updated timestamp;
4. request/correlation lookup only if operational support requires it.

No index should be added for arbitrary payload fields or duplicated Enrollment indexes.
