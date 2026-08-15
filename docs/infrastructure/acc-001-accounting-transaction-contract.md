# ACC-001 — Accounting Transaction Contract

**Status:** Contract proposal for owner approval; no implementation  
**Decision:** `BLOCKED — ACCOUNTING OWNER DECISION REQUIRED`

## 1. Required transaction boundary

The canonical financial command must own one request-scoped database transaction covering the approved path:

`Receipt → Journal Entry → Journal Lines → Ledger Lines → Balance Projection → Audit → Outbox`

The boundary starts only after authentication, session validation, authorization, and trusted tenant context resolution. Client-supplied tenant, school, branch, actor, or audit values are never authority.

## 2. Boundary rules

- One command creates or resumes one idempotent financial operation.
- No nested transaction is opened by a repository.
- No static shared transaction context is used across requests.
- The transaction uses the server-side PostgreSQL driver and a request-scoped connection.
- All writes use parameterized statements or the approved server repository abstraction.
- Commit occurs only after every mandatory step succeeds.
- Any failure before commit rolls back the entire financial effect.
- Release/rollback is guaranteed when the request ends or an error occurs.
- A successful response is emitted only after commit confirmation.

## 3. Consistency requirements

At commit time, the following must be true:

- receipt is persisted once;
- journal is persisted once and references the receipt;
- journal lines balance exactly under approved precision;
- ledger lines reference the journal and source receipt;
- balance state follows the approved stored/derived/projection model;
- mandatory audit and outbox events are persisted according to owner policy;
- all rows share the trusted tenant/school/branch scope;
- no conflicting version or lock check was bypassed.

## 4. Unknown outcome and idempotency

When the client or server loses the response after the database command may have committed, the command result is `OUTCOME_UNKNOWN`. The system must not automatically repeat the mutation. A subsequent status/reconciliation request uses the approved idempotency key to discover the existing result.

The Accounting owner must approve:

- idempotency key source and format;
- uniqueness scope;
- retention period;
- response for a replay with the same payload;
- response for the same key with a different payload;
- recovery authority for unresolved outcomes.

## 5. Concurrency

The implementation must use one approved strategy:

- optimistic version check on the receipt/journal/account projection; or
- row-level locking for affected accounts and idempotency record; or
- an owner-approved serializable/constraint strategy.

No automatic retry of a failed financial mutation is allowed until the owner defines whether the failure is safe to replay.

## 6. Audit and outbox coupling

The owner must decide whether audit and outbox writes are mandatory members of the same transaction. If mandatory, their failure rolls back the financial effect. If asynchronous, the committed financial record must still make the event recoverable and observable without reporting a false delivery.

## 7. Approval gate

This contract is not a server implementation contract until the owner approves the state model, account mapping, balance model, idempotency, concurrency, reversal, period-close, and audit/outbox decisions. DB-003 cannot reopen before that approval.
