# STU-AFFAIRS-P1-006-22 — Bulk Containment Analysis

## Static endpoint path

`POST /api/students/bulk`

`authenticateRequest → requirePermission(Student.Write) → read operation/items → schoolId = authenticated user.schoolId → StudentService.executeBulkOperation → per-item service dispatch → generic success envelope`

The route does not visibly call `resolveStudentTenantMiddleware` before dispatch. No request was executed.

## Accepted operations

At the TypeScript contract level, `StudentService.executeBulkOperation` declares:

`insert | update | delete | transfer | promote | archive`

The runtime body is untrusted JavaScript input. The dispatch uses independent `if` branches and has no visible explicit rejection branch for an unknown operation.

## Unknown-operation behavior

Static control-flow result:

1. The loop iterates over `items`.
2. If `operation` is not one of the six recognized strings, no per-item branch executes.
3. The method still reaches the aggregate `AuditRepository.log` call.
4. It returns `{ success: true, operation, processedCount: items.length, results }` with an empty `results` array.

Therefore an unknown operation can reach the generic success envelope and report `processedCount` equal to the input length without a corresponding mutation. This is a containment defect in static analysis. It was not executed or patched in this mission.

## Trusted scope assessment

| Question | Static answer |
|---|---|
| Is `schoolId` taken from the client body? | No; the route reads it from authenticated user state. |
| Is a complete `TenantContext` injected before Bulk dispatch? | Not proven; no visible tenant resolver middleware is used on the Bulk route. |
| Is school scope passed to each service? | Yes, the route passes the authenticated `schoolId`. |
| Is tenant identity separately validated? | Not proven for the Bulk route. |
| Is branch scope validated per item? | Not proven. |
| Is every item authorization-checked? | Not proven; the endpoint uses one broad permission and service-specific checks are inconsistent. |
| Are operation-specific permissions used? | No evidence; the route uses broad `Student.Write`. |
| Does every operation have one transaction boundary? | No; the outer Bulk Unit of Work can call services that open their own Unit of Work, creating nested-transaction risk. |
| Is idempotency required? | No bulk idempotency contract is proven. |
| Is a canonical history/outbox record proven? | No for Legacy lifecycle branches. |

## Risk classification

- Unknown operation generic success: containment risk; requires fail-closed input validation.
- Missing visible tenant resolver: security/design gate; not an executed cross-tenant finding.
- Missing branch/item scope proof: P1 security/domain dependency.
- Broad permission for all operations: authorization decision required.
- Nested Unit of Work paths: P0 dependency for any atomic bulk transfer; do not execute as a canonical batch.
- Legacy writers behind Bulk: P1 containment; do not promote.

## Required future contract

The future Bulk contract must require:

1. An explicit operation enum with rejection of unknown values.
2. A trusted, resolved TenantContext including tenant, school, branch, academic year, and actor.
3. Per-item existence, scope, version, authorization, and business-rule validation.
4. Operation-specific permissions and approval rules.
5. One request-scoped transaction boundary, with no nested Unit of Work.
6. Idempotency key, retry behavior, partial-failure policy, and deterministic result semantics.
7. Canonical history, audit, and outbox behavior.

