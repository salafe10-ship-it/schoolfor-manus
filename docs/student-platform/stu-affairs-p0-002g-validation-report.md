# STU-AFFAIRS-P0-002G — Validation Report

| Check | Result |
|---|---|
| Process-local duplicate guard exists | PASS |
| Process-local guard sufficient for distributed staging/production | FAIL |
| Durable outbox primitive exists | PASS |
| Outbox is already an approved batch-result contract | FAIL — module-specific usage only |
| Enrollment transfer row idempotency exists | PASS — row-level only |
| Durable batch result/reference exists | FAIL |
| Same-key/different-payload conflict contract exists for Transfer | FAIL |
| Concurrent cross-instance claim contract exists | FAIL |
| Retry/reconciliation retention policy exists | FAIL |
| Source/DB/migration/RLS/UnitOfWork modified | NONE |

## Static evidence

Reviewed `src/utils/IdempotencyGuard.ts`, Governance `outbox_events`, Enrollment `enrollment_transfers`, Registration idempotency lookup/write code, and Documents idempotency lookup/write code.

`git diff --check` remains PASS with pre-existing CRLF normalization warnings only.

## Decision

`STU-AFFAIRS-P0-002G = STOP + RCA — DURABLE IDEMPOTENCY STORAGE/CONTRACT DEPENDENCY`.

The current system must not claim durable Batch Transfer idempotency. A separate CTO decision is required before choosing outbox reuse or authorizing a dedicated schema/migration mission.
