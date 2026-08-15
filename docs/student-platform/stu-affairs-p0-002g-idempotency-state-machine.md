# STU-AFFAIRS-P0-002G — Idempotency State Machine

## States

`ABSENT → CLAIMED → COMMITTED` is the successful path.

`CLAIMED → FAILED` is used only when the transaction has definitively rolled back and the retry policy allows re-execution. An unknown commit result must enter reconciliation, not be treated as a normal failure.

## Transitions

| Situation | Required behavior |
|---|---|
| First key/hash | Atomically claim and execute |
| Same key/hash, committed result | Return the stored result; no writes |
| Same key, different hash | Reject with `409 Conflict` |
| Concurrent claim | One executor; deterministic wait/retry response for others |
| Business validation failure | No domain writes; durable failure policy must be explicit |
| Transaction rollback | No transfer/history/audit/outbox partial state |
| Commit outcome unknown | Reconcile durable state before retry |
| Outbox delivery retry | Delivery retry must not re-run the business command |

## Namespacing

The key must be namespaced to avoid collisions with Registration, Documents, or unrelated outbox consumers. A raw client key must never be globally interpreted without the operation namespace and trusted tenant.

## Retention

Retention and purge rules must preserve replay/conflict guarantees for the agreed client retry window. The policy is not currently approved and is therefore a dependency.
