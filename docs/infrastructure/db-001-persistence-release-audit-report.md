# DB-001 — Database & Persistence Integrity Release Audit

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001`  
**Audit mode:** Inspection only  
**Environment:** Local source audit; no database mutation; no Production access or deployment  
**Audit date:** 2026-08-13

## Executive decision

**DB-001 = BLOCKED — PERSISTENCE INTEGRITY FINDINGS**

No direct evidence of live data corruption was observed during this read-only audit. The release gate is nevertheless blocked because the application contains reachable alternate write paths that can report success while the canonical Supabase write has failed or has not occurred. The current implementation therefore cannot prove one authoritative persistence source or atomicity across the affected business operations.

This is a release-blocking integrity finding, not a claim that the live database is already corrupted.

## Evidence boundary

Reviewed source and tests only. No SQL was executed, no migration or seed was run, and no database, RLS, Storage, Production, or deployment state was changed.

Validation executed:

- DB/persistence-focused tests: **43/43 passed** across 7 test files after excluding repository-local isolation/cache directories.
- Full Vitest suite: **325/325 passed** across 61 test files after excluding repository-local isolation/cache directories.
- The initial unfiltered invocation discovered duplicate tests under `.p10603-isolation` and `.pnpm-store` and reproduced a stale/mismatched UnitOfWork test failure; those directories are not canonical source roots and were excluded for the valid suite run.

The passing tests validate the UnitOfWork/transaction contracts, not every production repository write path and not live end-to-end PostgreSQL atomicity.

## Persistence Source-of-Truth Matrix

| Area | Intended source | Reachable alternate source | Evidence | Integrity assessment |
|---|---|---|---|---|
| Startup and offline data | Supabase/PostgreSQL when connected | `FallbackStorage` JSON files and browser `localStorage` | `src/database/services/DatabaseService.ts:26-32`; `src/database/repositories/FallbackStorage.ts:153-197,216-417` | **Divergent sources exist** |
| Student create/update/delete/read | Supabase `students` | Local fallback after health/query/write failure | `src/database/repositories/StudentRepository.ts:69-112,136-189,196-312,320-345` | **False-success and stale-read risk** |
| Student bulk operations | One business operation | Per-record repository calls in a loop | `src/database/repositories/StudentRepository.ts:348-367,442-457` | **Not atomic unless caller wraps a UoW** |
| Guardian and Student Affairs auxiliary data | Supabase tables | Fallback arrays/files | `src/database/repositories/FallbackStorage.ts:267-296`; auxiliary repositories use direct Supabase writes | **Dual-write model** |
| Accounting/payment UI | Database transaction/posting engine | Browser `localStorage` receipt, journal, and account-balance records | `src/App.tsx:1413-1504` | **Critical persistence divergence** |
| Users, roles, permission audit | Identity/Governance persistence | Browser `localStorage` | `src/App.tsx:637-654` | **Client-controlled alternate authority** |
| Emergency queue | Explicit durable outbox/queue | Local JSON/`localStorage` queue | `src/database/repositories/FallbackStorage.ts:465-481` | **No database transaction with business write** |
| Audit events | Append-only audit store | Fallback audit file and mutable repository API | `src/database/repositories/AuditRepository.ts:252-324,332-413` | **Immutability not enforced by repository** |

## Fallback Reachability Matrix

| Trigger | Fallback behavior | Can caller receive success? | Risk |
|---|---|---:|---|
| Missing/invalid Supabase configuration | Uses local JSON/in-memory storage | Yes | Business data may exist only on one process/browser |
| Supabase health check fails | `FallbackStorage.performWrite` invokes local writer and queues the operation | Yes; returns local data | **P1 false success / replay divergence** |
| Supabase write throws | `StudentRepository` and multiple repositories catch, log, and continue locally | Yes | Canonical persistence failure is hidden from the caller |
| Supabase read fails after a prior healthy check | Repository reads local fallback/cache | Yes | Stale or incomplete data can be presented as authoritative |
| Queue synchronization | Reads remote record, merges, writes record, then writes audit separately | Yes if record write succeeds even when audit write fails | No atomic business-write/audit-write boundary |
| Browser offline path | `safeWriteFile` maps to `localStorage` | Yes | Client storage becomes a writable data source |

Primary evidence: `src/database/repositories/FallbackStorage.ts:614-679` and `src/database/repositories/StudentRepository.ts:91-112,167-189,485-506`.

## Transaction / Atomicity Matrix

| Operation | Explicit UoW path | Direct/non-UoW path | Atomicity conclusion |
|---|---|---|---|
| Generic repository command with configured PostgreSQL driver | Yes; parameterized commands, commit/rollback, release | Not applicable | Contract is covered by tests; live integration not proven here |
| Student create/update/delete | Only when caller has already opened a UoW; otherwise direct Supabase then separate audit, or local fallback | Yes | **Not universally atomic** |
| Student bulk create/update/delete/promote/transfer | No transaction is opened by the bulk methods; they loop over individual operations | Yes | **Partial completion is reachable** |
| Guardian/auxiliary record writes | Direct Supabase insert/update/delete in repositories | Yes | No shared transaction with related student/audit changes |
| Accounting posting through `AccountingPostingEngine` | Uses `UnitOfWork.runInTransaction` | Other UI/repository flows exist | Mixed; one engine path is atomic, whole module is not demonstrated as single-source |
| Queue replay | One remote row operation followed by a separate audit insert | Yes | **Not atomic across data and audit** |
| Application migration | Sequential inserts for students, exams, and auxiliary tables | No single transaction | **Partial migration possible** |
| Application seed | Sequential table inserts and per-call errors are not consistently checked | No single transaction | **Partial seed possible** |

The PostgreSQL transaction driver correctly rejects missing trusted context and rolls back simulated persistence failures (`server/infrastructure/PostgresTransactionDriver.ts`; `src/__tests__/transactionInfrastructure.test.ts:85-178`). That capability is not equivalent to universal use by all production write paths.

## False-Success Risk Assessment

### P1 — Canonical write failure can be returned as business success

`StudentRepository.create`, `update`, `delete`, `restore`, and `permanentDelete` catch Supabase failures and perform local writes, then return a record/success to the caller. `FallbackStorage.performWrite` likewise returns the fallback payload after queueing it. A user or calling service can therefore receive a successful result without a committed Supabase row.

### P1 — Financial state can be acknowledged without database persistence

The payment flow in `src/App.tsx:1413-1504` writes receipt vouchers, journal entries, and account balances directly to `localStorage` and then emits success notifications. This is an independent client-side ledger path and is outside the PostgreSQL UnitOfWork boundary.

### P1 — Partial completion is reachable in bulk operations and migrations

Bulk student operations call single-record operations sequentially. Application migrations and seeds perform multiple independent Supabase calls without one transaction. Failure after an earlier success can leave a partial state.

### P2 — Audit immutability is not enforced by the repository surface

`AuditRepository.update` and `AuditRepository.delete` intentionally expose mutation and deletion of audit rows (`src/database/repositories/AuditRepository.ts:326-413`). This conflicts with append-only audit requirements even if higher layers do not currently call those methods.

### P2 — Client-side identity/permission persistence is an alternate authority

Users, roles, and permission audit state are loaded from and written to browser `localStorage` (`src/App.tsx:637-654`). This is not a trusted server-side source of truth.

## Production Data Integrity Assessment

| Gate | Result | Basis |
|---|---|---|
| One canonical source of truth | **FAIL** | Supabase, server JSON fallback, browser localStorage, and in-memory state are all reachable |
| Write failure is surfaced as failure | **FAIL** | Several repositories convert remote errors into local success |
| Cross-record business operation is atomic | **FAIL / unproven** | Only explicit UoW callers are atomic; bulk and direct paths are not universally wrapped |
| Audit write shares business transaction | **FAIL / unproven** | Audit is frequently written after the business write or via a separate request |
| Optimistic concurrency is universal | **FAIL / partial** | Student update has version checking; other direct repository/UI paths do not establish one common policy |
| Production startup migration/seed blocked | **PASS at startup gate** | `DatabaseService` restricts AUTO_MIGRATE/AUTO_SEED in production; explicit CLI remains separately callable |
| Live database corruption observed | **NOT OBSERVED** | This audit did not mutate or inspect live records |
| Live end-to-end atomicity certified | **NOT CERTIFIED** | No live multi-step failure/rollback evidence was supplied for all affected paths |

## Findings summary

| ID | Severity | Finding | Release effect |
|---|---|---|---|
| DB-001-F01 | P1 | Reachable fallback writes can report success without canonical Supabase persistence | Blocks release |
| DB-001-F02 | P1 | Financial payment/journal/account state has a client localStorage write path | Blocks financial release |
| DB-001-F03 | P1 | Bulk operations and application migrations/seeds are not universally one transaction | Blocks atomicity certification |
| DB-001-F04 | P2 | Audit repository permits update/delete, contradicting append-only policy | Requires governance/security remediation |
| DB-001-F05 | P2 | User/role/permission state has browser localStorage authority | Requires identity persistence remediation |
| DB-001-F06 | P2 | Test discovery includes repository-local isolation/cache trees, producing duplicate/stale test executions | Requires test hygiene remediation |

## DB-001 closure decision

**DB-001 = BLOCKED — PERSISTENCE INTEGRITY FINDINGS**

No migration, seed, RLS, RPC, schema, Production, or application code change was performed under this audit. The next action requires a separate CTO-approved remediation mission. Do not declare the platform commercially persistence-safe until F01–F03 are remediated and live failure/rollback evidence is captured.

