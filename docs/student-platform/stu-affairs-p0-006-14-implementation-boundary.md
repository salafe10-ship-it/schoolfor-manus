# STU-AFFAIRS-P0-006-14 — Implementation Boundary

Status: `BOUNDARY DEFINED — NOT AUTHORIZED TO IMPLEMENT`

## Allowed only after explicit Security approval

The first implementation slice may be limited to:

1. `src/authorization/AuthorizationEngine.ts`
2. `src/authorization/PermissionCache.ts`
3. `src/authorization/PermissionRegistry.ts` only for approved permission names
4. `src/authorization/RoleResolver.ts` only for the approved authoritative role source
5. `src/middleware/authorization.ts`
6. `src/middleware/auth.ts` only where route ordering or trusted context handoff is required
7. Explicitly selected Student Affairs route declarations
8. Focused authorization tests and audit metadata tests

## Required implementation contract

The approved implementation must preserve this order:

`trusted authentication → trusted TenantContext → operation authorization → per-item scope authorization → domain validation → canonical transaction writer → audit`

The implementation must:

- fail closed when identity, role, scope, permission source, or permission revision is unavailable;
- never use client role, school, branch, tenant, or academic year as authoritative identity;
- never treat UI capability hints as enforcement;
- keep authorization denial auditable;
- prevent a stale/shared cache from crossing identity or tenant scope;
- reject unsupported operation and incomplete item context before any mutation.

## Explicitly outside this boundary

Do not modify:

- `src/authorization/TenantEngine.ts` or tenant architecture;
- `src/database/UnitOfWork.ts`;
- database schema, SQL, RLS, migrations, RPC, or storage;
- Student Affairs lifecycle writers, TransferOperation, Results, Graduation, Documents, Import, Export, or UI redesign;
- Staging or Production;
- any Bulk request or cross-tenant/cross-school/cross-branch runtime test before an approved test fixture and environment exist.

## Gate criteria before coding

Security/Operations must explicitly approve:

| Gate | Required decision |
|---|---|
| Permission source | Database assignments authoritative, or a bounded approved alternative |
| Wildcards | Prohibited in normal production, or exact break-glass scope/expiry/audit/revocation |
| Cache | Key fields, revision owner, TTL, invalidation, failure behavior |
| Operation permissions | Exact names and role assignments for lifecycle and Bulk operations |
| Object scope | Mandatory tenant/school/branch/year rules per operation |
| Maker/checker | Operations requiring independent approval and trusted approver rules |
| Evidence | Approved focused tests and permitted staging fixture |

Until every gate is recorded, implementation remains blocked.
