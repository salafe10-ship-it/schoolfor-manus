# ACC-001-IMPLEMENTATION-004C — Atomicity and Idempotency Guards

## Implemented

- Posting requests for the same school and journal are serialized in-process.
- A concurrent waiter re-reads the journal and returns only when `posted` is proven; otherwise it fails.
- Canonical journal status updates now include the expected previous status.
- PostgreSQL transaction execution fails when a guarded status transition affects no rows, which causes UnitOfWork rollback.

## Boundary

The in-process lock protects one running service instance. Cross-instance idempotency still requires a database-level idempotency key/unique constraint and therefore remains a migration-gated P0 item. No migration or SQL execution was performed.
