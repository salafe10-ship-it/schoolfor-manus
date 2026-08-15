# STU-AFFAIRS-P0-002D — Canonical Transfer Feasibility

## Mission

**Canonical Transfer Transaction Feasibility — read/design only**  
**Status:** STOP + RCA recommended  
**Date:** 2026-08-11

## Executive Finding

The existing platform has a usable `TransactionSession` contract and transaction-aware repository patterns in Student Registration and Student Documents. However, no transaction-aware canonical Enrollment Transfer application/repository was found, and the current Student Affairs transfer path is not connected to that infrastructure.

**Conclusion:** Batch Transfer cannot be implemented within the current approved path without a separate architecture/implementation mission for transfer persistence composition. No source modification is authorized by this feasibility mission.

## Evidence

### Transaction infrastructure exists

`src/database/transactions/TransactionContracts.ts` defines `TransactionSession.query`, `commit`, `rollback` and `release`. `UnitOfWork.runInTransaction` acquires this session and closes it on commit/rollback.

### Transaction-aware patterns exist but are module-specific

`src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts` obtains the active session from `UnitOfWork.getActiveContext()` and issues parameterized queries. Its service uses one transaction for registration, status/history and outbox effects.

`src/modules/student-documents/infrastructure/StudentDocumentRepository.ts` uses the same pattern for document operations and idempotent outbox-backed writes.

These patterns prove feasibility of the infrastructure in other domains; they do not prove a transfer contract or a reusable generic transfer repository.

### Transfer path is not transaction-aware

`src/database/repositories/StudentRepository.ts` performs direct Supabase updates or immediate fallback writes. It does not accept or query a `TransactionSession` for the transfer update. `src/database/services/StudentEnrollmentService.ts` opens a per-student UnitOfWork but delegates to that direct-write repository.

### Audit/history/outbox are not one transfer boundary

The current transfer service writes an audit record through the legacy `AuditRepository`; it does not write the approved Enrollment transfer/history/outbox chain. No canonical transfer outbox publisher or transfer idempotency lookup was found.

### Idempotency is not a shared transfer facility

Registration and Documents each have module-specific idempotency lookup and payload behavior. `IdempotencyGuard` is an in-process lock and is not a durable transfer result store. No approved reusable transfer idempotency storage was found.

## Feasibility Matrix

| Question | Result |
|---|---|
| Can a session be acquired? | YES — existing UnitOfWork/TransactionSession |
| Can current StudentRepository use it? | NO — direct Supabase/fallback writes |
| Can current single transfer be composed inside one batch UoW? | NO — nested UoW and non-transaction-aware repository |
| Can current audit write share the same boundary? | NOT PROVEN — legacy repository path |
| Can Enrollment history/transfer records be written? | NOT THROUGH CURRENT TRANSFER SERVICE |
| Can current idempotency be reused? | NOT AS A PROVEN TRANSFER CONTRACT |
| Can batch scope be validated from current payload? | NO — command lacks required Enrollment context |
| Can implementation proceed without shared UnitOfWork change? | NOT PROVEN |

## Decision Classification

- **Code-level capability:** transaction infrastructure exists.
- **Canonical Transfer capability:** missing.
- **Business semantics:** class/section versus Enrollment Transfer distinction is approved, but the UI command contract is not aligned.
- **Architecture dependency:** transfer-aware repository/application composition required.
- **Schema dependency:** possible, depending on the approved placement-history and idempotency storage decisions; no schema change may be assumed.

## Required Next Mission

Open a separate architecture/implementation mission for a canonical Enrollment Transfer persistence boundary. That mission must define exact files and must not modify the shared UnitOfWork incidentally. Only after it is complete can a new `P0-002E` implementation order be considered.

## Boundary

`PLATFORM-EVIDENCE-002` remains **CLOSED — BLOCKED + RCA**. No live DB/RLS/production certification is claimed.

## Final Status

**STOP + RCA — READY FOR CTO REVIEW**
