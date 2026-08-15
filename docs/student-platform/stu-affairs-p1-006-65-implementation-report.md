# STU-AFFAIRS-P1-006-65 — Documents Metadata Release-Gate Hardening

## Scope

Only the Student Documents metadata UI, its directly related tests, and this report were reviewed. No API, backend, service, repository, database, SQL, migration, RLS, authorization, tenant, Storage, binary, F02, timeline, export, print, lifecycle, bulk, graduation, staging, or production surface was changed.

## Finding and fix

The metadata detail surface already used canonical detail verification, request sequencing, confirmation binding, and mutation serialization. One release-gate gap remained: a document with a current version could still expose `Add Version` while it was expired or under legal hold. The canonical mutation guard now requires a current version, a non-archived/non-expired lifecycle, and no legal hold. This also fail-closes the related mutation controls when the same state makes them unsafe.

## Capability boundary

- `Verify` and `Reject` appear only for the canonical pending-verification state and a valid mutation context.
- `Expire` appears only when retention is due, the document is not archived/expired, has a current version, and is not under legal hold.
- `Archive` appears only when archive eligibility is due and legal hold is false.
- `Restore` appears only for archived documents.
- `Add Version` appears only for a non-archived, non-expired, non-held document with a current version.
- `Access History` and `Retry` remain read-only GET operations.
- Binary upload, download, preview, OCR, scanning, quarantine, and signed URLs remain explicitly unavailable.

## Mutation isolation

Action confirmation is bound to the selected document ID. A second confirmation cannot dispatch while a mutation is in flight. Canonical refresh and detail postconditions are required before success notification. Unknown outcomes do not produce success, and no mutation is retried automatically.

## Decision

All required tests and checks passed. The implementation closes as `CODE-LEVEL CLOSED — DOCUMENTS METADATA RELEASE-GATE HARDENING`.
