# STU-AFFAIRS-P1-006-42 — Student Documents Metadata Error and Concurrency UX

## Mission

Apply the approved bounded hardening to the existing Student Documents metadata UI only.

## Implemented

- Treat HTTP 409 and canonical `CONFLICT_ERROR` responses as stale/conflict outcomes; no success notification is emitted.
- Keep the stale record open and expose read-only refresh/resynchronization through the existing retry action.
- Prevent automatic mutation retry after conflict, timeout, or network failure.
- Normalize timeout and network failures as unknown outcomes with clear Arabic user feedback.
- Require a non-null canonical result from successful requests before treating a mutation as successful.
- Refresh the canonical document list after a successful metadata mutation before showing success.
- Treat `success:false`, all non-2xx responses, missing canonical results, timeout, and network failures as non-success.

## Explicit Non-Scope

No API, service, repository, database, SQL, migration, RLS, Storage, binary, authorization, tenant, or server changes were made.

## Files

- `src/modules/student-documents/presentation/StudentDocumentsPortal.tsx`
- `src/__tests__/studentDocumentsPortal.test.tsx`

## Status

CODE-LEVEL CLOSED — STUDENT DOCUMENTS METADATA ERROR/CONCURRENCY UX HARDENING; submitted for CTO/consultant review.
