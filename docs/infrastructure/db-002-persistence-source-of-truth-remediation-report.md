# DB-002 — Persistence Source-of-Truth Remediation Report

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-002`  
**Date:** 2026-08-13  
**Scope:** Persistence source-of-truth hardening only  
**Production / Supabase database mutation:** None

## Executive decision

**DB-002 = BLOCKED — canonical financial writer and PostgreSQL transaction contract remain pending.**

The remediation removes false-success paths for the Student write surface, makes the audit repository append-only, and fails closed for unsafe bulk operations. It does not claim completion while the remaining financial and transaction-boundary gaps prevent the PostgreSQL/Supabase source of truth from being guaranteed for every in-scope operation.

## Implemented controls

### Student persistence

- Configured staging/production/canonical environments no longer receive silent localStorage fallback after a Supabase write, read, health, timeout, or network failure.
- Canonical mutation paths do not automatically retry, preventing duplicate writes when the outcome is unknown.
- Student create, update, delete, restore, and permanent-delete paths fail closed when canonical persistence is unavailable or the outcome is unknown.
- Legacy bulk create, update, delete, restore, promote, and transfer methods fail closed instead of performing partial sequential writes without an explicit transaction-aware workflow.
- Canonical reads used for lookup and duplicate detection fail closed when the configured source cannot be reached; stale local fallback is not treated as authoritative.

### Financial persistence

- The legacy payment UI path is blocked when canonical persistence is configured.
- It no longer reports a successful collection while writing receipt, journal, or balance state only to localStorage.
- A canonical Supabase/PostgreSQL financial writer is intentionally not introduced in this mission; accounting scope remains a declared dependency.

### Audit integrity

- Audit update and delete operations now reject immediately.
- The repository requires compensating append-only events for corrections and retention/legal-hold actions rather than mutating historical records.

### Migration and seed failure semantics

- Student Affairs auxiliary migration failures now abort the reported migration instead of being swallowed.
- Core migration and seed insert failures now throw/return failure rather than reporting a successful completion.
- These changes prevent false completion, but do not yet provide one PostgreSQL transaction boundary for the complete migration/seed workflows.

### Build configuration

- The Vite alias root now resolves through `import.meta.url`, which is valid for the repository's ESM configuration and allows the production build to load reliably.

## Validation evidence

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | PASS |
| DB-002 + transaction focused suite | PASS — 7 files, 43 tests |
| Full regression suite (excluding known generated/cache trees) | PASS — 62 files, 330 tests |
| Vite production build | PASS — 3029 modules transformed; chunk-size warnings only |
| Node server bundle | PASS — `dist/server.cjs` generated |
| `git diff --check` on scoped changes | PASS; only CRLF normalization warnings |
| Scoped secret scan | PASS — no service-role key, private key, or PEM material found |

The server bundle emitted four existing warnings because `import.meta` is used in financial-closing code while the server output is CommonJS. This is a warning and is outside DB-002 persistence remediation.

## Remaining blockers and dependencies

### F02 — Accounting canonical writer

**Status:** `BLOCKED — ACCOUNTING CANONICAL WRITE REQUIRED`.

The guarded legacy payment path has no false success, but there is no approved canonical PostgreSQL/Supabase transaction writer for receipt, journal, and balance persistence in the affected UI flow. Implementing that writer would expand into Accounting and requires a separate authorized mission and contract.

### F03 — Transaction boundary

**Status:** `BLOCKED — TRANSACTION CONTRACT REQUIRED`.

Bulk Student operations are fail-closed to prevent partial writes. Migration and seed failures are fail-fast, but the current Supabase client path does not provide a single database transaction spanning all related writes. A transaction-aware PostgreSQL/RPC or server-side unit-of-work contract must be approved before these operations can be certified atomic.

### Explicitly unchanged

- RLS, Authorization, Tenant Isolation, Authentication, Storage, and Production data were not modified.
- Financial localStorage surfaces outside the guarded payment path, including unrelated legacy accounting state, were not redesigned under this mission.
- No automatic retry or duplicate recovery was added to unknown-outcome mutations.

## Files changed for this remediation

- `vite.config.ts`
- `src/App.tsx`
- `src/database/migrations/init.ts`
- `src/database/migrations/student_affairs_tables.ts`
- `src/database/repositories/AuditRepository.ts`
- `src/database/repositories/FallbackStorage.ts`
- `src/database/repositories/StudentRepository.ts`
- `src/database/seed/init.ts`
- `src/__tests__/db002PersistenceSourceOfTruth.test.ts`

## Closure decision

**Not ready for closure.** The Student false-success paths and append-only audit boundary are materially hardened and verified, but DB-002 remains blocked until the owner approves and implements the canonical Accounting writer and the transaction-aware PostgreSQL boundary for bulk/migration/seed operations.
