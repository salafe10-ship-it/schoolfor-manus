# STU-AFFAIRS-P1-006-19 — Student/Guardian Atomicity Discovery

## Decision

`P1-006-19 = ATOMICITY CONTRACT READY — OWNER/ARCHITECTURE DECISION REQUIRED`

This is a discovery and contract analysis only. No Student Edit, Guardian API, UnitOfWork, database, migration, authorization, tenant, staging, or production change was made.

## Actual UI Flow

When a Student Edit form changes guardian data, `StudentAffairsPortal.handleSaveStudent` performs:

1. `StudentRepository.updateGuardian(...)` through `PATCH /api/students/:studentId/guardian`.
2. Only after that request resolves, `StudentRepository.saveStudent(studentPayload)` through the Student Edit endpoint.
3. A success notification after the Student response is received.

These are two HTTP requests and two independent persistence workflows. They are not one request-scoped transaction.

## Persistence Flow

### Guardian branch

`Guardian UI → PATCH /api/students/:studentId/guardian → authentication/permission/tenant context → CanonicalGuardianUpdateService → UnitOfWork → guardian + student_guardians + audit/outbox commit`

The canonical Guardian service uses trusted context, row locks, independent optimistic versions, audit, and outbox within its own UnitOfWork.

### Student branch

`Student UI → POST /api/students → authentication/tenant context → CanonicalStudentWriteRepository → Student update + audit commit`

The canonical Student update uses its own optimistic version and its own UnitOfWork boundary when no transaction is already active.

## Partial-Outcome Analysis

| Scenario | Current result | Integrity classification |
|---|---|---|
| Guardian unchanged, Student succeeds | Student commit only | Atomic for the single operation |
| Guardian changed, Guardian fails | Student request is not attempted because the UI awaits Guardian first | No Student mutation; Guardian failure is visible |
| Guardian changed, Guardian succeeds, Student fails | Guardian commit remains; Student does not commit | Partial composite-form outcome |
| Guardian succeeds, browser/network fails before Student response | Guardian may already be committed; UI cannot prove composite outcome | Requires reload/reconciliation |
| Student succeeds after Guardian retry | Possible only after a fresh Student request; Guardian versions may now be stale | Optimistic concurrency can reject stale retry |
| Both succeed | Two independent commits; UI reports success after both responses | No single composite transaction |

## Success Notification

The edit success notification is emitted after `saveStudent` returns. It is not emitted before either awaited request. However, it describes the whole form while the two writes have no shared commit boundary; a later client/network failure can leave a partial outcome without a composite operation ID.

## Current Safety Properties

- Guardian and Student writes are each tenant-scoped and version-checked.
- Guardian failure prevents the subsequent Student request in the current UI sequence.
- Student failure cannot roll back a previously committed Guardian update.
- No client tenant, school, or branch value is used as trusted identity by these canonical services.
- Audit and outbox records are per aggregate operation, not a single composite change set.

## Owner/Architecture Decision Required

Decide whether the business meaning of “Save Student Profile” requires:

- **A — Separate operations:** keep Student and Guardian updates independent, expose separate operation results, and provide reconciliation/retry UX; or
- **B — Composite transaction:** accept one composite command containing Student, Guardian, and relationship changes and commit them in one request-scoped UnitOfWork.

Option B must not be implemented by simply nesting the existing UnitOfWork calls. It requires an explicit composite command, shared request/correlation/change-set identity, one transaction boundary, rollback semantics, idempotency, and a defined partial-failure response.
