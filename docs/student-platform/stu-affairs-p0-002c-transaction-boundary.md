# STU-AFFAIRS-P0-002C — Transaction Boundary Decision

## 1. Required Boundary

The batch command must have one request-scoped transaction boundary:

```text
request
  └─ canonical batch application service
       └─ one Unit of Work / TransactionSession
            ├─ prevalidated student and Enrollment effects
            ├─ domain history
            ├─ audit records
            └─ outbox records
       └─ one commit or one rollback
```

The browser, REST loop and individual repository calls cannot be treated as a transaction boundary.

## 2. Current Gap

The current StudentRepository update path performs direct Supabase or fallback writes and does not accept a transaction session. The generic bulk route opens a UnitOfWork and then reaches a single-transfer method that opens another UnitOfWork. The shared UnitOfWork rejects nested transactions.

## 3. Safe Options

### Option A — Existing transaction-aware canonical repository support

Reuse an already approved repository/application contract that accepts the active `TransactionSession` and can persist the required Enrollment effects. **No evidence of a complete transfer-ready implementation was found.**

### Option B — Student Affairs/Enrollment transaction-aware application boundary

Create or extend an existing canonical Student Affairs/Enrollment service so it receives one transaction context and uses transaction-aware repository methods. This requires an architecture/implementation mission with explicit files and tests.

### Option C — Shared UnitOfWork change

Only if Options A and B are impossible and a separate architecture mission approves changing the shared UnitOfWork. This is explicitly out of scope for P0-002B.

## 4. Non-Options

- Wrapping REST calls in one `Promise.all`.
- Calling single-student methods sequentially and claiming atomicity.
- Calling the generic bulk route without resolving nested UoW.
- Updating fallback arrays and treating that as database rollback.
- Catching errors after partial commits and returning a warning.

## 5. Commit/Rollback Requirements

- Preflight every item before the first mutation where possible.
- Reject invalid/mixed scope before mutation.
- Use expected-version checks for optimistic concurrency.
- Commit only after all history/audit/outbox writes are accepted by the same transaction.
- Rollback every state effect on any failure.
- Never emit a success response before commit completes.

## 6. Architecture Mission Dependency

`ARCHITECTURE MISSION REQUIRED` if transaction propagation requires changing shared UnitOfWork, transaction driver, schema, or repository contracts beyond the existing approved path.

## Decision

**TRANSACTION BOUNDARY NOT IMPLEMENTABLE SAFELY ON CURRENT PROVEN PATH — ARCHITECTURE MISSION REQUIRED.**
