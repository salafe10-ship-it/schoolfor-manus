# STU-AFFAIRS-P1-003-05B — Transaction Feasibility

## Decision

The import transaction is feasible only if it composes transaction-aware repository participants inside one request-scoped `UnitOfWork`. The existing public registration service cannot be called once per row from an outer import transaction because it opens its own transaction.

## Proven Transaction-Aware Participants

- `src/database/UnitOfWork.ts` uses request-chain transaction context and rejects nested `runInTransaction` calls.
- `src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts` obtains the active `TransactionSession` and rejects execution when no PostgreSQL transaction is active.
- Student, guardian, relationship, academic-status, history, audit, and outbox enqueue functions use parameterized commands enlisted into the active `UnitOfWork`.
- `src/modules/student-documents/infrastructure/StudentDocumentRepository.ts` follows the same active-transaction requirement and enqueues parameterized writes.
- `UnitOfWork.commit()` executes the enlisted commands and commits the PostgreSQL session; failure triggers rollback. `UnitOfWork.rollback()` rolls back and releases the session.

## Blocking Transaction Findings

1. `StudentRegistrationService.register()` calls `UnitOfWork.runInTransaction()` itself. Calling it from an import-level `runInTransaction()` would trigger the explicit `Nested UnitOfWork is prohibited` guard.
2. `StudentService.executeBulkOperation()` opens a transaction and delegates to service methods that may open their own transactions. The prior `STU-AFFAIRS-P0-002B` RCA documents the resulting nested-transaction conflict for transfer.
3. The legacy `src/database/repositories/StudentRepository.ts` bulk helpers use direct Supabase/FallbackStorage paths and are not transaction-session participants. They cannot be used as the atomic import writer.
4. Legacy `AuditRepository` operations are not sufficient proof for an atomic import audit path. The import must use the parameterized, transaction-enlisted audit writer.

## Required Composition Boundary

The future import implementation must have one outer transaction only:

`request -> authentication -> authorization -> tenant validation -> command/idempotency claim -> normalize all rows -> validate all rows -> canonical transaction-aware repositories -> audit/outbox -> commit`

The inner row operations must be transaction-aware functions that accept the already-active context/session. They must not call a public service that starts another `UnitOfWork`.

## Failure Semantics

- Any validation, duplicate, constraint, authorization, repository, audit, or outbox failure rolls back the complete batch.
- No success result or success event is durable before commit.
- A failed or abandoned command must be recoverable through the approved command-store lease/status rules.
- The implementation must not fall back to browser storage, `FallbackStorage`, direct anon-client writes, or per-row independent commits.

## Feasibility Status

**FEASIBLE WITH A NEW TRANSACTION-AWARE IMPORT ORCHESTRATOR; IMPLEMENTATION BLOCKED UNTIL THE DURABLE COMMAND STORE AND PARTICIPANT CONTRACT ARE APPROVED.**

