# STU-AFFAIRS-P0-002K — Transfer Operation State Machine

## States

`PENDING → PROCESSING → COMMITTED`

Failure and recovery states:

- `PENDING → FAILED` when validation/business work definitively fails before mutation;
- `PROCESSING → FAILED` only when rollback is confirmed;
- `PROCESSING → RECONCILE_REQUIRED` when commit outcome is unknown;
- `RECONCILE_REQUIRED → COMMITTED` after durable evidence confirms the result;
- `RECONCILE_REQUIRED → FAILED` after durable evidence confirms rollback/no result.

## Replay rules

| Request | Behavior |
|---|---|
| No existing operation | Atomically claim and execute |
| Same tenant/namespace/key + same hash, `COMMITTED` | Return stored result; never execute again |
| Same key + different hash | `409 Conflict`; never mutate |
| Same key, active `PROCESSING` claim | Wait/poll or return deterministic retryable response; never run a second owner |
| `FAILED` | Retry only according to explicit policy and a new attempt; no partial state may exist |
| `RECONCILE_REQUIRED` | Reconcile first; never blindly retry |

## Atomicity requirement

The operation claim and all canonical transfer writes must be coordinated so that a successful transfer cannot exist without a committed operation result, and a failed operation cannot advertise a committed result. The exact database mechanism is a separate implementation/schema decision.

## Immutability

The original key and payload hash are immutable. Status changes must use optimistic version checks and an append-only audit trail. A result reference cannot be replaced silently.
