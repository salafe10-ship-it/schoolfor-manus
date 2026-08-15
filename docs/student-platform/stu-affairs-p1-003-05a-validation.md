# STU-AFFAIRS-P1-003-05A — Design Validation

## Status

`DESIGN PASS — IMPLEMENTATION NOT AUTHORIZED`

## Design gates covered

- Envelope and operation identity are explicit.
- Trusted context fields are server-derived and client scope fields are forbidden.
- Item required/optional fields, guardian restrictions, numbering, and duplicate policy are explicit.
- Batch size is bounded to 100.
- `ALL_OR_NOTHING` is selected; partial acceptance is not allowed.
- One transaction boundary is defined without nested UnitOfWork calls.
- Authorization, audit/change-set, outbox, and failure semantics are defined.
- Idempotency key, canonical hash, replay, mismatch, concurrency, retry, and timeout behavior are defined.
- Generic Bulk Mutation and Batch Transfer are explicitly excluded.

## Implementation acceptance tests

### Envelope and validation

- reject raw arrays;
- accept only `operation=student_import`;
- reject empty and over-limit batches;
- reject unknown fields and forbidden client scope;
- validate every required field and report stable item indexes.

### Business integrity

- reject duplicate student numbers and duplicate fingerprints;
- reject ambiguous guardians;
- enforce trusted term/school/branch references;
- verify all-or-nothing rollback when any item fails;
- verify no success response or success outbox event on failure.

### Idempotency

- same key and same hash returns the original result without writes;
- same key and different hash returns 409;
- concurrent same-key requests produce one execution;
- timeout retry returns the committed result;
- a new key cannot bypass duplicate detection.

### Security and audit

- require dedicated import permission;
- reject tenant/school/branch/actor spoofing;
- verify immutable batch audit and per-student events;
- verify no cross-tenant idempotency result is readable.

## Decision

`STU-AFFAIRS-P1-003-05A = DESIGN PASS — READY FOR CTO REVIEW`.

Implementation requires a separate CTO order after the durable idempotency and transaction dependencies are approved. No code was changed.

