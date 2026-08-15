# Student Affairs — Academic Enrollment Correction Workflow

## Purpose

Provide a controlled path for correcting an administrative data-entry error, such as a student recorded in the wrong academic year or term, without weakening the Transfer policy or rewriting historical evidence.

## Classification

This is not a normal edit and is not a Transfer. It is a privileged correction workflow.

## Required controls

1. The requester identifies the affected canonical Enrollment and submits the proposed correction, reason, and supporting reference.
2. The server derives tenant, school, branch, actor, request ID, and correlation ID from trusted session/context.
3. The server validates that the request is a correction of an existing record, not an unauthorized cross-school/year movement.
4. A separate authorized approver reviews the old and proposed values.
5. The operation uses optimistic version checking; a stale version is rejected rather than overwritten.
6. The correction writes the new state, immutable domain history, central audit event, and required outbox event in one transaction.
7. The previous value remains visible in history; no physical deletion or silent update is permitted.
8. The result is idempotent and replay-safe using the approved durable idempotency contract.

## Example

Student is recorded in Year 1 / Term 1 but verified as Year 4 / Term 1:

- classify as `Academic Enrollment Correction`;
- require evidence and approval;
- close/amend the affected Enrollment according to the approved Enrollment state machine;
- append the correction reason and old/new academic context to history and audit;
- do not call the Transfer workflow.

## Forbidden behavior

- Direct browser mutation of `academic_year_id` or `term_id`.
- Changing the old history row in place.
- Using `students` legacy fields as the canonical correction source.
- Treating a correction as permission to move between schools.
- Updating after a version conflict without reloading and re-approval.

## Dependencies

- CTO approval of the correction state machine and approver roles.
- Canonical Enrollment mapping and durable idempotency strategy.
- Transaction-aware Enrollment, history, audit, and outbox writers.
- A separate implementation mission; this document does not authorize source, schema, or database changes.
