# DB-001-NONACC-015 — Validation

## Static Validation

- AI model reads use `FallbackStorage.performRead`.
- Backup definition reads use `FallbackStorage.performRead`.
- Prompt reads use the same fail-closed boundary without introducing a canonical table or schema.
- Canonical errors are propagated; stale fallback getters are not reached after a canonical failure.
- Existing `system` scope is preserved for all three paths.

## Test Matrix

| Case | Expected | Status |
| --- | --- | --- |
| Canonical AI success | Canonical model returned | Covered |
| Canonical Backup success | Canonical definition returned | Covered |
| Canonical empty | `undefined` returned | Covered |
| Canonical failure | `PERSISTENCE_UNKNOWN` propagated | Covered |
| Stale fallback plus canonical failure | No fallback success | Covered |
| Prompt without canonical contract | Explicit failure in canonical path | Covered |
| Scope preservation | `system` passed to read boundary | Covered |

## Required Commands

- TypeScript: `tsc --noEmit`
- Focused unit test: `db001Nonacc015AiBackupReadFailClosed.test.ts`
- Regression test: `db001Nonacc008ErrorSemanticsReachability.test.ts`
- `git diff --check`
- Scoped secret scan

## Boundaries

- Database/RLS/migration/schema: not run and not changed.
- Staging/production: not touched.
- Full suite and production build: outside this bounded mission unless separately authorized.
