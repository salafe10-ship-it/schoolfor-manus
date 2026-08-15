# STU-AFFAIRS-P1-006-19 — Transaction Boundary Matrix

| Operation | Request boundary | Transaction boundary | Version scope | Audit/outbox scope | Rollback scope |
|---|---|---|---|---|---|
| Student edit only | One Student Edit request | One Student UnitOfWork | Student version | Student operation | Student write and its audit |
| Guardian edit only | One Guardian PATCH request | One Guardian UnitOfWork | Guardian + relationship versions | Guardian operation | Guardian, relationship, audit, outbox |
| Composite form today | Two sequential HTTP requests | Two independent UnitOfWorks | Independent Student and Guardian versions | Two operation records | Each request only; no cross-request rollback |
| Composite command option | One future request | One explicit shared UnitOfWork | All affected aggregate versions | One change set plus domain events | Student, Guardian, relationship, audit, outbox together |

## Option A — Separate Operations

Acceptable only if the product explicitly treats Student and Guardian as separate saves. The UI must then communicate separate outcomes and provide a safe refresh/reconciliation path. The current single “Save Student” affordance makes this decision a product/architecture concern rather than an implementation detail.

## Option B — Composite Transaction

Required capabilities before approval:

- One authenticated, authorized, trusted-tenant request context.
- One command and one idempotency key.
- One UnitOfWork created at the request boundary.
- Guardian service and Student repository APIs that enlist in the existing transaction rather than open nested transactions.
- Locks and expected versions for Student, Guardian, and `student_guardians`.
- One audit change set and correlated outbox event strategy.
- Rollback of every enlisted write on any failure.
- A retry rule distinguishing safe replay, stale version, and unknown outcome.

## Finding

The current implementation is internally atomic per request but not atomic as a composite form operation. Choosing Option B without an owner decision would be an architecture change outside this discovery mission.
