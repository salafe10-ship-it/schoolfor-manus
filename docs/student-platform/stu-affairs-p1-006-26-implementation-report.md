# STU-AFFAIRS-P1-006-26 — Bulk Unknown-Operation Fail-Closed Fix

## Mission status

`P1-006-26 = CODE-LEVEL CLOSED — UNKNOWN BULK OPERATION FAIL-CLOSED`

## Root cause

`StudentService.executeBulkOperation` accepted a runtime `operation` value but had no explicit membership check. An unsupported value skipped every item branch, then reached the success audit and returned `success: true` with `processedCount: items.length` and an empty result list.

The Bulk route also converted every caught error into `DATABASE_ERROR`/HTTP 500, so a validation rejection would not have had the required 4xx semantics.

## Minimum fix

- Added an explicit allow-list check before opening the Bulk transaction or processing any item.
- Unsupported values raise the existing `ValidationError` contract with the proposed stable detail code `STU-API-UNKNOWN-OPERATION`.
- The Bulk route preserves `ValidationError` so the central handler returns HTTP 400 and `success:false`.
- Supported operations remain exactly: `insert`, `update`, `delete`, `transfer`, `promote`, `archive`.
- No mutation, success audit, transaction, or Legacy writer is reached for an unknown operation.

## Files modified

- `src/database/services/StudentService.ts`
- `server.ts`
- `src/__tests__/stuAffairsP1BulkUnknownOperation.test.ts`

## Explicitly not changed

No per-item authorization, TenantEngine, Bulk transaction architecture, UnitOfWork, operation-specific permissions, TransferOperation, Legacy lifecycle writer, DB/SQL/RLS/Migration, Staging, Production, or other business operation was modified.

## Verification

- TypeScript `tsc --noEmit`: PASS.
- Focused Vitest: PASS — 8/8 tests.
- Full Vitest: 569 passed; 2 known duplicate UnitOfWork fixture failures under `.pnpm-store` and `.p10603-isolation` (`Nested UnitOfWork is prohibited`), outside this mission.
- Vite production build: PASS.
- Server production bundle: PASS.
- Server bundle warnings: four pre-existing `import.meta`/CommonJS warnings in FinancialClosing files; unrelated to this fix.
- Diff check and secret scan: PASS.
