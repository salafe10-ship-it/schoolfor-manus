# DB-003 — Accounting Canonical Write Path

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-003`  
**Date:** 2026-08-13  
**Decision:** `BLOCKED — ACCOUNTING DOMAIN CONTRACT REQUIRED`  
**Production / Supabase mutation:** None

## Executive decision

DB-003 cannot be implemented safely within the approved scope. The repository contains UI and local-storage accounting paths, but it does not contain a complete, approved canonical Accounting contract or a deployed PostgreSQL schema for the required Receipt → Journal Entry → Ledger/Balance flow. Implementing the missing semantics would require guessing accounting policy and creating a schema/migration, both forbidden by the mission.

## Required path review

### Receipt

`src/App.tsx` contains `handleStudentPaymentSubmit`, which creates receipt-like records under `erp_receipt_vouchers_v2` in browser `localStorage`. DB-002 now fails this path closed when canonical persistence is configured, so it cannot produce false financial success. No canonical Receipt repository or PostgreSQL table was found in the approved `supabase/migrations` set.

### Journal Entry

- `src/database/services/AccountingPostingService.ts` can calculate a balanced in-memory journal, but `approveJournal` and `postJournal` are not implemented.
- `src/modules/accounting/application/AccountingPostingEngine.ts` generates a `STUDENT_FEE_COLLECTION` entry using hard-coded `CASH_ACCOUNT` and `REVENUE_ACCOUNT` identifiers and system actor metadata. This is not an approved account-mapping contract and cannot be promoted to the canonical writer.
- `src/database/repositories/JournalRepository.ts` supports Supabase writes only if a `journal_entries` table and contract exist; otherwise it can use the legacy fallback path. The repository is not a complete Receipt → Journal → Balance orchestration boundary.

### Ledger / Balance

- `src/database/services/PostingEngine.ts` contains a local calculation path for ledger lines and account balances, but it reads fallback state in validation/lookup paths and is not a verified canonical financial writer for the affected receipt UI flow.
- `src/database/repositories/GeneralLedgerRepository.ts` only enlists SQL commands inside an already configured Unit of Work; it does not define the missing accounting schema or account semantics.
- `src/database/repositories/AccountRepository.ts` likewise contains repository behavior, but the canonical schema and approved balance/locking rules are absent from the production migration set.

## Schema evidence

The repository's `supabase/migrations` directory contains Core, Identity, Governance, Student, Enrollment, Academic Status, Documents, Attendance, and security migrations. It contains no approved Finance/Accounting migration defining the required canonical tables for:

- receipts / receipt vouchers;
- journal entries and journal lines;
- accounts / chart of accounts;
- general ledger lines;
- balances or balance-version concurrency state.

The DB-003 command explicitly forbids schema redesign and migrations, so adding those tables is outside the authorized boundary.

## Contract decisions that are missing

The following decisions cannot be inferred safely from the code:

1. Which account mapping is authoritative for student fee collection.
2. Whether a receipt is draft, posted, or both, and the exact posting transition.
3. Whether balance is stored, derived, or maintained by ledger projection.
4. The authoritative relationship between receipt, journal entry, and ledger lines.
5. Reversal and correction semantics for an already posted receipt.
6. The idempotency key and duplicate-posting uniqueness rule.
7. The concurrency/version rule for simultaneous postings.
8. The audit/outbox records required for a canonical posting.

## Required owner decision before implementation

Issue an Accounting Domain Contract that defines the above semantics and authorizes the canonical schema/transaction boundary. After that contract, a separate implementation mission can add the minimum approved PostgreSQL schema and canonical server-side writer. DB-003 must not invent either one.

## Validation

| Check | Result |
|---|---|
| Source-of-truth audit | BLOCKED — receipt UI is localStorage-only when unguarded; DB-002 guard prevents configured false success |
| Canonical Receipt writer | NOT PRESENT |
| Canonical Journal writer | NOT COMPLETE; post operation is unimplemented |
| Canonical Ledger/Balance writer | NOT PROVEN for the receipt path |
| Accounting schema in approved Supabase migrations | NOT PRESENT |
| Contract completeness | BLOCKED — domain decisions unresolved |
| Production mutation | NONE |

## Files changed in DB-003

- `docs/infrastructure/db-003-accounting-canonical-write-blocked-report.md`

No application code, migration, schema, UI, RLS, Authorization, Tenant Isolation, or Production data was modified for DB-003.

## Final status

**DB-003 = BLOCKED — ACCOUNTING DOMAIN CONTRACT REQUIRED**

DB-002 remains blocked as well. DB-004 must not begin until the Accounting contract and the required canonical schema/writer authorization are resolved; the original DB-002 F03 transaction contract remains a separate dependency.
