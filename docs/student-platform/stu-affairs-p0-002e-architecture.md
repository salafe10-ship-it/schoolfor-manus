# STU-AFFAIRS-P0-002E — Transfer Persistence & Transaction Composition Architecture

## Status

Architecture design only. No source, database, migration, RLS, authorization, or production changes are included.

## Decision

The canonical operation is an Enrollment Transfer application command over the source and destination Enrollment aggregates. The legacy `students` mutation and `/api/students/bulk` are not authoritative transfer paths.

The command must be executed once per request inside one request-scoped Unit of Work. A batch is a command envelope containing multiple transfer items; it is not a new persistent Batch Aggregate.

## Required components

1. `EnrollmentTransferApplicationService` — validates the command, resolves trusted context, classifies Placement Edit versus First-class Enrollment Transfer, and coordinates one Unit of Work.
2. `EnrollmentTransferRepository` — reads and writes canonical Enrollment and Transfer records through the active `TransactionSession`.
3. `EnrollmentHistoryWriter` — appends immutable domain history through the same session.
4. `TransferAuditWriter` — appends the central audit event through the same session.
5. `TransferOutboxWriter` — appends integration events through the same session.
6. `TransferIdempotencyStore` — durable lookup of operation key, payload hash, status, and stored result; its schema and ownership require a separate approval before implementation.

## Invariants

- The actor, tenant, school, branch, request, and correlation context are server-derived.
- A transfer cannot mutate `students` as its source of truth.
- Source Enrollment closure, destination Enrollment creation, transfer record, history, audit, and outbox are one atomic set.
- Any failure rolls back every write in the set.
- A successful retry with the same operation key and payload returns the original result without new domain, audit, or outbox rows.
- Reuse of a key with a different payload is a conflict.
- No repository opens or commits its own transaction when an active Unit of Work exists.

## Explicit dependencies

- Business decision for cross-branch, cross-school, cross-year, and cross-term transfers.
- Approved transaction composition mechanism that does not silently make direct Supabase writes appear atomic.
- Durable idempotency storage and result-retention policy.
- Confirmed canonical Enrollment mapping for all UI fields.

## Stop conditions

If any dependency requires changing the common UnitOfWork, transaction driver, schema/migration, RLS, authorization, or unresolved business semantics, implementation must stop and open a separate mission.
