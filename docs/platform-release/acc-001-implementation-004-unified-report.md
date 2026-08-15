# ACC-001 — Unified Implementation Report 004A → 004E

## Scope

The accounting hardening sequence was executed in order:

`004A → 004B → 004C → 004D → 004E`

No SQL migration, RLS policy, RPC, Supabase production object, or production database change was executed.

## Completed

### 004A — Canonical persistence discovery

- Removed the false-success journal creation path.
- Journal creation is delegated to `PostingEngine` and requires trusted school context.
- Unapproved account mappings and unsupported posting paths fail closed with `ACCOUNTING DECISION REQUIRED`.

### 004B — Approval and posting boundary

- Implemented explicit draft/submitted → approved → posted transitions.
- Approval and posting re-read and verify the resulting state.
- Reversal remains blocked until the accounting reversal policy is approved.

### 004C — Atomicity and idempotency

- Added affected-row assertions to transactional status transitions.
- Added expected-status predicates to prevent stale concurrent updates.
- Added request-scoped posting locks and idempotent handling of already-posted entries.
- Rollback remains the transaction boundary on any failed command.

### 004D — Canonical integrations

- Invoice, credit-note, and debit-note journal creation now uses the canonical posting adapter.
- Removed default account IDs and direct fallback journal writes.
- Canonical integration failures abort the business operation instead of returning a partial success.

### 004E — Server authorization and canonical GL reads

- Financial API routes use only the verified identity school and reject missing trusted context.
- Financial file persistence is blocked when canonical persistence is required.
- Journal/account reads, trial balance, journal audit, and accounting-period validation fail closed instead of returning local fallback data in canonical mode.
- Local fallback remains limited to explicit isolated development compatibility mode.

## Validation

- TypeScript: PASS (`tsc --noEmit`)
- Focused 004A–004E tests: PASS — 5 files, 13 tests
- Production Vite build: PASS
- Server bundle: PASS
- Diff whitespace check: PASS
- Build warnings: existing chunk-size warnings and existing CJS `import.meta` warnings; no build failure.

## Full Regression

Full suite result: `732 passed, 4 failed` across 150 files.

The four failures are pre-existing/out-of-scope compatibility failures:

1. `db001Nonacc005MigrationSeedProductionSafety.test.ts` expects an older migration transaction shape.
2. `db002PersistenceSourceOfTruth.test.ts` expects legacy error strings (`Student migration failed`, `Exam migration failed`).
3. `.p10603-isolation/src/__tests__/unitOfWork.test.ts` expects nested UnitOfWork joining, while the active contract rejects nested UnitOfWork.
4. `.pnpm-store/v11/projects/.../src/__tests__/unitOfWork.test.ts` repeats the same legacy nested UnitOfWork expectation.

No focused 004A–004E test failed.

## Remaining Release Blockers

- Approved accounting PostgreSQL schema/repository contracts are still required for authoritative reads and writes.
- Unique database idempotency enforcement and live concurrency certification require the approved staging database contract.
- Account mappings, reversal policy, retention, and final accounting ownership decisions remain external decisions.
- Full regression baseline failures above remain open and should be handled in their owning missions; they were not changed here.

## Decision

`ACC-001 IMPLEMENTATION 004A–004E HARDENED / ACCOUNTING RELEASE NOT CLOSED`

The code now fails safely where canonical accounting persistence or approved business policy is absent. It is not certified for production accounting release until the remaining database and owner decisions are supplied.
