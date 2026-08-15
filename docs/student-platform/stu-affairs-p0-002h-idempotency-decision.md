# STU-AFFAIRS-P0-002H — Idempotency Storage Decision

## Decision status

`ARCHITECTURE/BUSINESS DECISION REQUIRED`.

## Options

### A — Dedicated durable Transfer Batch Store

Owns operation key, namespace, canonical payload hash, lifecycle state, result reference, retries, reconciliation, and retention. This is the clearest separation of business command idempotency from event delivery, but it requires an approved schema/migration mission unless an existing durable store is formally adopted.

### B — Reuse `outbox_events`

Uses the existing tenant-scoped unique key, payload hash, payload, status, and aggregate reference. This is acceptable only if CTO approves a formal Transfer operation namespace, result contract, event/consumer ownership, retry/reconciliation behavior, retention, and proof that the row will not be treated as an unrelated integration event.

## Current selection

`UNDECIDED`. The existing code does not authorize either option for Batch Transfer.

## Common contract required for either option

- tenant-scoped operation namespace;
- canonical payload hash;
- same key + same hash → deterministic replay;
- same key + different hash → `409 Conflict`;
- one concurrent owner;
- explicit `pending`, `committed`, `failed`, and `reconcile_required` semantics;
- no business retry from an outbox delivery retry;
- retention long enough to cover the client retry window.

## Safe behavior until approval

Do not start Batch Transfer implementation and do not create a migration or modify `outbox_events`.
