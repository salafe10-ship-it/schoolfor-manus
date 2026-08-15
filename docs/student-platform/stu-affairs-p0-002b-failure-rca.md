# STU-AFFAIRS-P0-002B — Failure RCA

## Mission

**Batch Transfer Atomic Implementation**  
**Decision:** STOP + RCA  
**Date:** 2026-08-11

## Executive Decision

`STU-AFFAIRS-P0-002B = STOP + RCA`.

The approved contract cannot be implemented safely using the currently proven canonical path without creating a new transfer contract or changing shared infrastructure. No workaround was introduced and no source file was modified.

## Evidence That Blocks Safe Implementation

### 1. Repository writes do not join the active database transaction

`src/database/repositories/StudentRepository.ts` performs the student update through a direct Supabase client update or writes immediately to `FallbackStorage`. It does not use the active `TransactionSession` from `UnitOfWork` for the update. Its audit call is also a separate repository operation.

Therefore wrapping the current calls in one `UnitOfWork.runInTransaction` would not prove all-or-nothing persistence for the actual student updates.

### 2. The generic bulk route has a nested transaction conflict

`POST /api/students/bulk` calls `StudentService.executeBulkOperation`. The bulk service opens a UnitOfWork and then delegates transfer items to `StudentService.transferStudent`, which delegates to `StudentEnrollmentService.transferStudent`, which opens another UnitOfWork. The shared UnitOfWork explicitly rejects nested transactions.

This route cannot be promoted to the canonical batch path by a local patch.

### 3. The current UI operation has no Enrollment Transfer context

`StudentAffairsPortal.handleBatchTransfer` sends one student ID at a time with class, section and stage values. It does not send source/destination Enrollment IDs, academic year, term, transfer reason, approval state or an idempotency key.

Under the approved ENROLL-CONTRACT-002, class/section changes inside the same Enrollment are placement edits, while branch/school/year/term changes are first-class Enrollment Transfers. The current command does not identify which semantic it means.

### 4. The approved schema and legacy student model are not aligned for this operation

The approved `students` migration defines the enterprise student identity and lifecycle fields. The current legacy Student type/repository relies on fields such as `classroom`, `section` and `stageId`, while the approved Enrollment schema uses Enrollment placement fields. Selecting a column mapping here would be a schema/business decision, not a safe P0 patch.

### 5. Idempotency and event contracts are unavailable on the current path

The active single-student repository does not send a batch `Idempotency-Key`. The current transfer path does not implement the approved payload-hash/replay behavior, transfer-specific history chain or outbox event contract. The Enrollment migration has an idempotency column for first-class transfer records, but the current UI/API does not create or manage those records.

## Why We Did Not Implement a Workaround

Any of the following would violate the CTO order or invent architecture:

- modifying the shared `UnitOfWork` or transaction driver;
- adding a new transfer API without an approved live contract;
- adding a new idempotency storage mechanism;
- adding schema/migration/RLS changes;
- silently mapping legacy class/section edits to Enrollment Transfer;
- pretending direct Supabase calls are inside the active transaction;
- using `FallbackStorage` as a transaction substitute.

## Required Separate Decisions

1. Approve the canonical persistence model for placement edits versus Enrollment Transfers.
2. Align the legacy Student UI/repository with the approved Enrollment placement contract, or explicitly retire that legacy path.
3. Approve a transaction-aware repository/application composition that does not modify the shared UnitOfWork incidentally.
4. Approve the idempotency storage and retry contract.
5. Approve the audit/history/outbox event mapping.
6. Approve the authorization permission and destination scope policy.

## Files Modified

- `docs/student-platform/stu-affairs-p0-002b-failure-rca.md` only.
- `docs/student-platform/stu-affairs-p0-002b-validation-report.md` only.

No source, schema, migration, RLS, Auth, Authorization, TenantEngine, UnitOfWork, Render, Supabase or production files were modified.

## Environment Boundary

`PLATFORM-EVIDENCE-002` remains **CLOSED — BLOCKED + RCA**. No live DB, RLS or production certification is claimed.

## Mission Status

**STOP + RCA — READY FOR CTO REVIEW**

`P0-003`, `P0-004`, `P0-005` and all P1/P2 work remain unstarted.
