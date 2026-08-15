# STU-AFFAIRS-P0-002G — Durable Batch Transfer Idempotency Architecture

## Current platform evidence

- `IdempotencyGuard` stores active keys in a process-local `Set`; it prevents duplicate work only within one running process and lifetime.
- `outbox_events` has tenant-scoped uniqueness on `idempotency_key`, `payload_hash`, payload, status, and aggregate reference.
- Student Registration and Student Documents use that outbox row as a module-specific replay marker.
- `enrollment_transfers.idempotency_key` is unique per tenant, but it represents a transfer row and does not persist a batch command/result envelope.

## Decision

No existing mechanism is proven as a reusable Batch Transfer idempotency contract. The outbox table is a durable primitive, not automatically a safe batch result store. Reusing it requires an approved operation namespace, payload/result shape, lifecycle, and consumer policy.

## Required contract

The future operation identity is `tenant_id + operation_namespace + client_operation_key`. The server computes a canonical SHA-256 payload hash after removing client identity/scope claims and normalizing item order.

Durable state must support `pending`, `succeeded`, `failed`, and reconciliation/unknown-commit handling, while retaining the committed result reference. A retry with equal hash replays the stored result; a different hash returns `409 Conflict`; a concurrent duplicate has one owner.

## Storage decision gate

Before implementation, CTO must choose one approved storage strategy:

1. Extend/reuse `outbox_events` only with a formally approved transfer operation event and replay contract; or
2. Create a dedicated operation/idempotency store in a separate schema/migration mission.

No table, migration, event, or source change is created here.
