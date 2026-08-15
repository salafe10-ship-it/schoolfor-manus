# STU-AFFAIRS-P0-006-13 — Security Feasibility and Decision Package

## P0 trigger evaluation

| Trigger | Result | Reason |
|---|---|---|
| Authenticated user → crafted item → mutation outside trusted school | NOT PROVEN | Observed Legacy update predicates include trusted `school_id`; no executed request was allowed. |
| Authenticated user → crafted item → mutation outside trusted branch | SECURITY GAP PROVEN | Branch is not consistently included in Legacy repository predicates or item-level trusted context; same-school cross-branch containment is incomplete. |
| Auth denied → mutation still reachable | NOT PROVEN | Middleware order stops the request before route handler in the observed path. |
| Unknown operation → mutation | DISPROVEN AFTER P1-006-26 | Runtime allow-list rejects the operation before transaction/item processing. |
| Unknown operation → false success | DISPROVEN AFTER P1-006-26 | ValidationError is preserved as HTTP 400; no success audit/envelope is reached. |
| Legacy writer outside transaction | SECURITY/INTEGRITY RISK PROVEN | Legacy repository uses direct Supabase/fallback paths and is not shown to use the active transaction session. |
| Fallback persistence after database failure | RISK PROVEN | Legacy repository catches Supabase failures and falls back to local storage. |
| Cross-school read/update/delete | NOT PROVEN | School predicate and trusted identity school are present in observed Legacy paths; no runtime test performed. |
| Cross-branch read/update/delete | NOT PROVEN SAFE | Branch predicate is absent or not consistently carried; classify as security gap, not executed breach. |

## Feasibility conclusion

The smallest safe future hardening is not a generic permission check. It must establish an operation-aware, item-aware trusted context contract before any Bulk writer runs:

`trusted identity → centralized authorization decision(operation) → resolved TenantContext → per-item school/branch/year scope → version/idempotency validation → one canonical transaction writer`

This is a future design boundary. It is not implemented in this mission.

## Security approval required before implementation

Security must decide:

1. Whether `Student.Write` may authorize all Bulk operations.
2. Whether branch and academic-year scope are mandatory for each item.
3. Whether Bulk is allowed to target multiple branches in one command.
4. Which operation-specific permissions and approval rules apply.
5. Whether Legacy writers must be fail-closed until canonical writers exist.
6. Whether local FallbackStorage is forbidden for production Bulk writes.
7. Whether Bulk Transfer remains a P0-blocked separate TransferOperation.

## Forbidden actions respected

No cross-tenant request, cross-school request, cross-branch request, Bulk mutation, SQL, service-role access, source edit, AuthorizationEngine change, PermissionRegistry change, TenantEngine change, UnitOfWork change, DB/RLS/Migration, Staging, Production, TransferOperation, lifecycle writer, import, or export was performed.

