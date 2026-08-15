# STU-AFFAIRS-P0-006-09 — Authorization Security Hardening Design

Status: `DESIGN COMPLETE — SECURITY APPROVAL REQUIRED`

## Scope

Architecture and security design only. No AuthorizationEngine, PermissionRegistry, TenantEngine, middleware, API, database, RLS, SQL, migration, or UI changes were made.

## Required authorization decision

`Authenticated Identity → Permission → Trusted Tenant → School → Branch → Resource/Student → Operation → Allow/Deny`

Permission presence alone is insufficient. The final decision must include the trusted object scope and operation policy.

## Layer responsibilities

| Layer | Required responsibility |
|---|---|
| Authentication | Verify session and derive immutable identity |
| Permission middleware | Coarse operation capability and denial before business logic |
| Tenant engine | Resolve and validate trusted tenant/school/branch/academic context |
| Authorization policy | Combine permission, operation, role/approval policy, and target scope |
| Domain service | Enforce business invariants, reason, approval, version, idempotency |
| Repository | Apply tenant/school/branch and target-object predicates to every query/write |
| Audit hook | Record every denial and sensitive decision with trusted context |

## Object-level rule

For Student Affairs, the target student, guardian, document, enrollment, and timeline resource must be loaded or mutated only after proving that its tenant/school/branch scope equals the trusted request context. Request body, query, or header values may identify a requested target but cannot define trusted ownership.

## Security result

The current engine can be hardened without a conceptual authorization redesign, but implementation requires security approval because it changes the enforcement boundary and permission cache semantics.
