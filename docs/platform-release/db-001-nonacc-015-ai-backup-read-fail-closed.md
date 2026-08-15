# DB-001-NONACC-015 — AI / Backup Legacy Read Fail-Closed

## Scope

This bounded hardening covers only the proven AI and Backup repository read paths:

- `AIRepository.getModel`
- `AIRepository.getPrompt`
- `BackupRepository.getDefinition`

## Behavior

- Canonical success returns the canonical record.
- Canonical empty returns the existing `undefined` detail-read contract.
- Canonical failure is propagated through `FallbackStorage.performRead` and is never converted into a local record, empty result, or false success.
- Local fallback remains available only where the existing explicitly unconfigured offline compatibility mode permits it.
- The prompt path has no proven canonical persistence contract, so it fails closed in canonical mode rather than inventing a table or source of truth.
- No retry, schema, API, tenant, authorization, RLS, database, staging, or production behavior was changed.

## Files Changed

- `src/database/repositories/AIRepository.ts`
- `src/database/repositories/BackupRepository.ts`
- `src/__tests__/db001Nonacc015AiBackupReadFailClosed.test.ts`

## Decision

The code-level AI/Backup read paths are hardened. The prompt canonical-contract dependency remains explicitly surfaced and is not silently masked.
