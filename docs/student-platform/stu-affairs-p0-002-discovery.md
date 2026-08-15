# STU-AFFAIRS-P0-002 — Discovery Gate Report

## Mission

**Student Affairs — Batch Transfer Atomicity & Integrity**  
**Phase:** Discovery Gate  
**Decision:** STOP + RCA  
**Date:** 2026-08-11

## Executive Decision

`STU-AFFAIRS-P0-002` is **STOP + RCA**.

The repository contains a canonical-looking single-student transfer service with a transaction boundary per student, but it does not contain an approved canonical Batch Transfer service/API/contract that can guarantee all-or-nothing behavior. The current UI performs one request per selected student. Implementing a new batch endpoint, inventing transfer semantics or modifying the shared UnitOfWork would violate the CTO execution order.

No source code, database, migration, RLS, authorization, tenant engine or production configuration was modified.

## Discovery Path

```text
StudentAffairsPortal.handleBatchTransfer
  -> components/student-affairs/repository/StudentRepository.transferStudent
  -> POST /api/students/:id/transfer
  -> authenticateRequest + STUDENT_WRITE
  -> StudentService.transferStudent
  -> StudentEnrollmentService.transferStudent
  -> UnitOfWork.runInTransaction (one student only)
  -> StudentRepository.update + AuditRepository.log
```

## Evidence

### 1. Active UI path is sequential per-student execution

**File:** `src/components/StudentAffairsPortal.tsx`  
**Symbol:** `handleBatchTransfer`  
**Evidence:** the handler loops through `selectedStudentIds`, awaits `StudentRepository.transferStudent` for each ID, updates local React state after each response and reports the completed count if a later operation fails.

**Finding:** the UI does not send one batch command and does not own one transaction boundary for the entire selected set.

### 2. Browser repository calls a single-student endpoint

**File:** `src/components/student-affairs/repository/StudentRepository.ts`  
**Symbol:** `transferStudent`  
**Evidence:** it sends `POST /api/students/${studentId}/transfer` for one student ID. It has no batch-transfer method used by the active UI and no idempotency-key contract.

### 3. API exposes only single-student transfer as the active transfer route

**File:** `server.ts`  
**Route:** `POST /api/students/:id/transfer`  
**Evidence:** the route authenticates the request, checks `STUDENT_WRITE`, creates trusted audit metadata and calls `StudentService.transferStudent` for one `req.params.id`.

**Finding:** authorization and trusted audit metadata exist at the single-student route level. This is code-level evidence only; it is not live database/RLS certification.

### 4. Single-student service has a per-student transaction

**File:** `src/database/services/StudentEnrollmentService.ts`  
**Symbol:** `transferStudent`  
**Evidence:** the service reads one student, enters `UnitOfWork.runInTransaction`, applies one update and writes one audit entry.

**Finding:** this can protect one student operation. It does not protect a batch containing several independent calls.

### 5. Legacy repository bulk method is a loop, not an atomic contract

**File:** `src/database/repositories/StudentRepository.ts`  
**Symbol:** `bulkTransfer`  
**Evidence:** it loops through students and calls `update` for each item. No single transaction boundary, idempotency key, batch audit contract or outbox contract is defined there. The active UI does not call this method.

### 6. Generic bulk route is not a valid canonical transfer path

**Files:** `server.ts`, `src/database/services/StudentService.ts`  
**Route:** `POST /api/students/bulk`  
**Evidence:** the route passes `operation` and `items` to `StudentService.executeBulkOperation`. That service opens an outer `UnitOfWork.runInTransaction`, then for `operation === 'transfer'` calls `this.transferStudent` for each item. `StudentEnrollmentService.transferStudent` itself calls `UnitOfWork.runInTransaction`, while the shared UnitOfWork explicitly rejects nested transactions.

**Finding:** this route is not a proven working canonical Batch Transfer path. It has no transfer-specific idempotency contract and no transfer-specific audit/outbox contract. It must not be promoted or patched into a canonical contract without a separate approved design decision.

### 7. No approved Batch Transfer outbox/event contract found

The inspected Student Affairs transfer path writes an audit log, but no transfer-specific canonical outbox event, event version or idempotency lookup was found. Existing registration and document outbox patterns are separate domain contracts and cannot be copied into transfer without an approved business contract.

### 8. No batch idempotency contract found

The active UI and single-student transfer repository do not send an `Idempotency-Key`. The generic bulk route does not require one. Existing idempotency mechanisms in registration/documents/other domains are not a transfer contract and cannot be assumed applicable.

## Required Acceptance Conditions Not Yet Satisfied

| Condition | Result |
|---|---|
| Canonical Batch Transfer service | NOT FOUND |
| Canonical Batch Transfer API | NOT FOUND |
| One transaction for all selected students | NOT FOUND |
| All-or-nothing rollback contract | NOT PROVEN |
| Transfer-specific idempotency contract | NOT FOUND |
| Transfer-specific outbox contract | NOT FOUND |
| Existing authorization contract for a batch | NOT FOUND; single-student permission exists |
| Existing tenant/school/branch batch enforcement | NOT PROVEN |
| Live database/RLS proof | EVIDENCE BLOCKED; not requested in this mission |

## Root Cause

The feature named “batch transfer” is currently a UI orchestration of independent single-student operations. The project has a single-student transfer service and a generic bulk abstraction, but not a coherent approved Batch Transfer aggregate/contract. The generic bulk abstraction also conflicts with the single-transfer transaction boundary through nested UnitOfWork protection.

## Why Implementation Stops

Continuing would require at least one of the following decisions that the mission forbids us to invent:

- Define canonical batch transfer business semantics.
- Decide whether a batch is one business aggregate or a set of independent transfers.
- Define idempotency key scope and replay behavior.
- Define audit/outbox event semantics for a batch.
- Introduce or change a batch API contract.
- Change shared UnitOfWork behavior or transaction composition.
- Define cross-branch/school transfer rules for a batch.

These are architecture/business decisions, not safe local fixes.

## Files Modified

- `docs/student-platform/stu-affairs-p0-002-discovery.md` only.

No source file was modified.

## Validation Performed

- Static path search across the active UI, repository, API routes, StudentService, StudentEnrollmentService and UnitOfWork.
- No database mutation.
- No migration or RLS operation.
- No production/staging operation.

## Recommendation to CTO

Keep `STU-AFFAIRS-P0-002` stopped until a separate decision defines the canonical Batch Transfer contract. After approval, issue a new implementation phase with explicit files and tests. The safest next design choice is to reuse the existing single-student business rules inside one request-scoped transaction only if the shared transaction abstraction can support that composition without changing its global contract; otherwise issue a dedicated Student Affairs transfer application contract rather than patching the generic bulk route.

`PLATFORM-EVIDENCE-002` remains **CLOSED / BLOCKED + RCA**. This discovery does not reopen or replace Operations evidence C–G and makes no live database/RLS claim.

## Mission Status

**STOP + RCA — READY FOR CTO REVIEW**

No `STU-AFFAIRS-P0-003`, `P0-004`, `P0-005` or P1 work has started.
