# STU-AFFAIRS-P0-002F — Transaction Composition Analysis

## Scope

Read-only analysis of the existing transaction composition. No source or database change is included.

## Findings

1. `UnitOfWork.runInTransaction` already rejects nested Unit of Work instances, creates a request-scoped context, acquires one `TransactionSession`, commits on success, and rolls back/releases on failure.
2. `UnitOfWork.getActiveContext()?.databaseTransaction` is already the supported composition seam used by Student Registration and Student Documents.
3. A repository can therefore participate without changing the common UnitOfWork, but only if every write is parameterized and issued through the active session/enlistment API.
4. The current Student transfer path does not satisfy that rule: `StudentRepository.update` writes directly through Supabase/FallbackStorage, and the legacy transfer service opens its own per-student Unit of Work.
5. The current generic bulk path cannot be reused because it creates nested Unit of Work behavior.

## Result

The common transaction infrastructure is sufficient as a low-level boundary for a future canonical transfer service. It is not sufficient to make the existing legacy transfer path atomic by wrapping it externally.

## Safe architectural rule

Create one canonical application service that is the sole owner of `runInTransaction`. Every canonical Enrollment, transfer, history, audit, and outbox repository must require the active `TransactionSession` and fail closed when it is absent. Legacy direct-write repositories must not be called from that service.

## Blocking dependencies

- canonical transfer repositories/application service;
- durable idempotency store;
- transfer scope policy;
- legacy-to-canonical mapping;
- confirmation that audit/outbox writers have transaction-aware implementations.

Until these are separately resolved, closing P0-002F by modifying the common UnitOfWork would be unsafe and unnecessary.
