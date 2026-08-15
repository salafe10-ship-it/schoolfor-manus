# STU-AFFAIRS-P1-003-05C — Replay and Crash Recovery Contract

## Replay Contract

The command record must retain enough data to return the original response without executing the Student import again. The recommended contract stores both:

1. a compact immutable result summary for fast response metadata; and
2. a durable result reference or immutable result payload containing per-row outcomes, student IDs, guardian IDs where applicable, item indexes, request ID, correlation ID, and batch ID.

The exact storage representation remains a schema decision, but the behavior is mandatory: replay must be deterministic and must not call the student writer again.

## Request Decision Table

| Existing command state | Hash comparison | Response behavior |
|---|---|---|
| none | n/a | Attempt one durable claim and begin execution |
| PENDING | same | Claim if available; otherwise follow claim arbitration |
| PROCESSING with valid lease | same | In-progress response; no second execution |
| PROCESSING with expired lease | same | Move to reconciliation evaluation; do not blindly reclaim |
| COMMITTED | same | Return stored original result with `idempotent: true` |
| FAILED | same | Return stored definitive failure with `idempotent: true` |
| RECONCILE_REQUIRED | same | Return reconciliation-required; operator workflow only |
| any state | different | `409 Conflict` with no mutation |

## Lease and Ownership

The command claim must record a server-generated owner token and lease metadata. The owner token is not an identity assertion and never comes from the client.

Required behaviors:

- only one owner may execute a command at a time;
- owner renewal must be explicit and auditable;
- an expired lease cannot prove that the prior database transaction did not commit;
- lease expiry therefore leads to reconciliation evaluation, not blind re-execution;
- ownership loss during a transaction must be handled by database rollback/commit semantics and then reconciled from durable evidence.

No lease duration is invented here. Operations/Product must approve the duration using measured import latency, database timeout, deployment behavior, and recovery objectives.

## Crash Scenarios

### Crash before business transaction begins

The command may be safely marked failed or recovered from `PENDING` only if the claim and absence of business evidence are proven.

### Crash during transaction

The command must enter `RECONCILE_REQUIRED` unless the database transaction outcome is definitively known. Do not rerun the import.

### Crash after database commit but before response

Replay by the same key/hash returns the durable committed result. No student writer is called again.

### Outbox delivery failure after import commit

The import remains `COMMITTED`; event delivery retry belongs to `outbox_events` and must not re-run the business command.

## Reconciliation Evidence

An authorized reconciliation process may use:

- command ID and batch ID;
- trusted tenant scope;
- request/correlation IDs;
- immutable audit/change-set evidence;
- canonical Student/Guardian/relationship records;
- matching success outbox events;
- transaction/database evidence available from the approved environment.

The reconciliation process must produce an immutable audit record and may close only to `COMMITTED` or `FAILED` after the evidence is sufficient.

## Recovery Safety Rule

There is no automatic “retry the whole batch” fallback for an uncertain command. A new key is not a recovery mechanism and must not be used to bypass duplicate detection.

