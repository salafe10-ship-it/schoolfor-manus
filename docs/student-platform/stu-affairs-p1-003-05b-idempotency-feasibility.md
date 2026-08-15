# STU-AFFAIRS-P1-003-05B — Idempotency Feasibility

## Decision

`student_import` is not implementation-ready on the current platform without a dedicated durable command/idempotency result contract. The current code provides useful primitives, but it does not provide a complete, concurrency-safe import command store with replayable batch results.

## Evidence

1. `src/utils/IdempotencyGuard.ts` stores active keys in a process-local static `Set`. It blocks duplicate execution only while the current process is alive. It does not survive restart, does not coordinate multiple Render instances, and does not persist the original result.
2. `supabase/migrations/202608051400_governance_platform.sql` defines `outbox_events` with a unique `(tenant_id, idempotency_key)` constraint, payload hash, status, retry fields, and delivery timestamps. This is an event-delivery/outbox record, not a dedicated command execution record.
3. `StudentRegistrationService` reads and replays a prior registration result from `outbox_events.payload`, but that behavior is registration-specific and tied to the emitted `StudentRegistered` event.
4. `StudentDocumentService` uses the same outbox-backed lookup pattern for document/category operations, with operation-specific key prefixes. This is not a generic batch-command result store.
5. There is no proven `student_import` batch identifier, per-row result persistence, request payload hash record, terminal command status, or durable replay contract.

## What Is Feasible Now

- Require and validate an `Idempotency-Key` header.
- Canonicalize the request and calculate a SHA-256 payload hash.
- Reject the same key with a different hash.
- Use the existing unique tenant/key constraint as a database race guard for an outbox record.
- Emit audit and outbox records only after the import transaction succeeds.

## What Is Not Proven

- Safe concurrent ownership of one import command across multiple server processes.
- Recovery after process termination between database commit and response delivery.
- Replay of the exact `student_import` batch response, including per-row outcomes.
- Durable retention and cleanup rules for command records.
- Separation between command idempotency state and asynchronous event-delivery state.

## Required Dependency Before Implementation

Approve a dedicated durable command store or an explicitly approved equivalent. It must contain at least:

- tenant-scoped operation namespace and idempotency key;
- canonical payload hash;
- command status (`processing`, `succeeded`, `failed`, `expired` or an approved equivalent);
- batch/request/correlation references;
- durable result payload or a durable result reference;
- ownership/lease timestamps for crash recovery;
- created/completed timestamps and retention policy;
- a uniqueness rule that prevents two successful executions for the same tenant/key.

No table, migration, RLS policy, or SQL was created by this discovery mission.

## Feasibility Status

**BLOCKED — durable command idempotency contract required before `student_import` implementation.**

