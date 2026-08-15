# STU-AFFAIRS-P0-002D — Idempotency Analysis

## Existing Mechanisms Reviewed

### Student Registration

Registration uses a durable outbox lookup by tenant and idempotency key, payload comparison and transaction-scoped writes. This is a registration-specific contract tied to the registration payload and events.

### Student Documents

Documents use scoped idempotency keys, payload hashes and outbox-backed result lookup inside their document service. This is a document-specific contract.

### In-process IdempotencyGuard

`src/utils/IdempotencyGuard.ts` provides a process-local lock. It is not durable result storage and cannot by itself guarantee replay behavior across processes, restarts or concurrent deployments.

## Transfer Reuse Finding

No generic transfer idempotency store or approved transfer result record was found. Reusing Registration or Documents lookup directly would couple unrelated event semantics and would not prove transfer-specific payload binding.

## Required Transfer Contract

The future transfer implementation needs:

- trusted tenant namespace;
- operation and contract version;
- batch-scoped key;
- canonical payload hash;
- processing/completed/failed state;
- stored result reference;
- conflict when the same key has a different payload;
- concurrency protection;
- no duplicate history/audit/outbox effects.

## Storage Boundary

If the existing outbox contract can store and retrieve a transfer result without a schema change, an implementation mission may evaluate that option. If not, a new schema/storage architecture mission is required. This feasibility phase does not choose or create storage.

## Decision

**Idempotency is not reusable as-is from the current transfer path. ARCHITECTURE MISSION REQUIRED before P0-002E.**
