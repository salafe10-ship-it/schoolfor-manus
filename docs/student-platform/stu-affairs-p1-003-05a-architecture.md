# STU-AFFAIRS-P1-003-05A — Import Architecture

## Boundary

`StudentImportService` is the application boundary for `student_import`. It consumes a validated command and a trusted `TenantContext`; it does not accept client scope or identity. The existing generic `/api/students/bulk` service is not the target implementation and must not be patched into this contract.

## Aggregate composition

One import command composes the approved Student Registration workflow for each item:

`Student → Guardian resolution → StudentGuardian relationship → Enrollment/academic context → audit/outbox`

The batch is an orchestration boundary, not a new business aggregate. Each item has deterministic index identity for error reporting, while the batch has one server-generated `batchId` and one idempotency record.

## Trusted context

The server derives:

- tenant ID;
- school ID;
- branch ID;
- academic year;
- actor/user ID;
- role and permissions;
- request, correlation, and server timestamps.

Every item reference is checked against this context. Client-provided scope fields are forbidden, not merely overwritten.

## Transaction boundary

The complete batch executes inside one request-scoped transaction. The import orchestrator must call transaction-aware domain/repository operations and must not call a public method that starts another UnitOfWork for each item. No static transaction state and no cross-request reuse are allowed.

Commit occurs only after all items, relationships, audit records, and outbox records succeed. Any failure rolls back all business writes. A failed attempt receives an immutable failure audit record after rollback through the approved audit path; it must not be represented as a successful outbox event.

## Authorization

The design requires a dedicated permission such as `Student.Import` in addition to normal Student.Write. Manual student-number override requires the existing dedicated override permission. Existing Guardian-link and duplicate-override permissions apply only if a future contract explicitly enables those features; the first import contract forbids those overrides.

No AuthorizationEngine or PermissionRegistry change is part of this design mission.

## Duplicate policy

Preflight checks are deterministic and tenant-scoped:

- duplicate student number: reject;
- duplicate student fingerprint within the batch: reject;
- match against an existing student: reject unless a future approved exception workflow exists;
- ambiguous guardian match: reject;
- unique guardian match: use only the server-resolved identity.

The order of validation is stable by item index so the same payload produces the same failure report.

## Audit and outbox

The batch creates an immutable audit/change-set reference containing operation, batch ID, request/correlation IDs, actor, trusted scope, item count, payload hash, result, and safe error summary. Each committed student creation has its canonical domain event and outbox entry. A failed batch emits no success event and has a durable failure audit entry.

## Generic bulk and Batch Transfer disposition

- Generic Bulk Mutation: legacy/unsafe and not supported by this contract.
- Student Import: design target for this mission.
- Batch Transfer: P0-002P blocked and explicitly excluded.

