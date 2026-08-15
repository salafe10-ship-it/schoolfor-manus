# STU-AFFAIRS-P0-002F — Approved Transaction Composition Design Target

## Boundary

`EnrollmentTransferApplicationService.execute(command, trustedContext)` owns exactly one `UnitOfWork.runInTransaction` call. It must reject execution when called inside an active Unit of Work rather than joining implicitly.

## Participants

All participants receive the active `TransactionSession` through the established active-context seam:

`EnrollmentRepository → EnrollmentTransferRepository → EnrollmentHistoryWriter → AuditWriter → OutboxWriter`

Each participant uses parameterized SQL, trusted tenant/scope predicates, optimistic version checks, and deterministic locking. No participant commits or releases the session.

## Commit protocol

1. Resolve authenticated actor and trusted tenant scope.
2. Validate all transfer items before mutation.
3. Lock source Enrollment rows in deterministic order.
4. Apply source/destination changes and transfer rows.
5. Append history, audit, and outbox records.
6. Let the owning Unit of Work commit once.
7. On any exception, let the owning Unit of Work rollback and release once.

## Prohibited patterns

- calling legacy `transferStudent` from the canonical service;
- nested `runInTransaction`;
- direct Supabase writes inside the command;
- fallback storage for a production command;
- process-local idempotency as the only protection;
- success response before a confirmed commit.

## Implementation boundary

This design does not authorize modifying `UnitOfWork.ts`, the transaction driver, schema, RLS, or legacy repositories. If a required participant cannot use the active session, open a dedicated implementation mission for that participant or transaction infrastructure.
