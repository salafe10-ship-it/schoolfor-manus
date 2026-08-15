# STU-AFFAIRS-P0-002E — Transaction Composition

## Required flow

`authenticateRequest → requirePermission(Student.Write if proven correct) → resolve trusted TenantContext → validate command and scope → acquire one request-scoped UoW → lock/read source state → validate all items → write Enrollment changes → write transfer rows → append history → append audit → append outbox → commit → return result`

## Transaction ownership

The application service owns the boundary. Repositories are transaction participants and receive the active session from an approved composition mechanism. They must never create a nested Unit of Work, commit independently, or fall back to immediate storage during the command.

## Locking and ordering

All source records are validated and locked in deterministic order (tenant, student, enrollment ID) before mutation. This prevents two concurrent commands from producing conflicting source closures. Destination uniqueness and date overlap must be rechecked inside the same transaction.

## Failure behavior

- Validation failure before mutation: no writes.
- Failure during any item: rollback all items.
- Audit/outbox failure: rollback business writes.
- Commit failure: return an unknown/ retryable result only after the transaction is known to be closed; never claim success from a partial response.
- Retry: consult durable idempotency state before starting a second command.

## Current feasibility result

`TransactionSession` and active-context patterns exist, but the current StudentRepository transfer path writes directly and the generic bulk endpoint has nested UnitOfWork behavior. Therefore this document is a target composition design, not permission to modify `UnitOfWork` or patch the legacy path.
