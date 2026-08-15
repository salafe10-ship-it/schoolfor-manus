# DB-001-NONACC-018 — DMS Canonical Contract

## Decision

**DB-001-NONACC-018 = BLOCKED — DMS SCHEMA CONTRACT REQUIRED**

## Evidence

- `src/database/repositories/DocumentRepository.ts` references `dms_documents` but its canonical write callback is a no-op.
- The repository maps fields such as `id`, `tenant_id`, `file_name`, `file_size`, `uploaded_by`, `uploaded_date`, `status`, and `checksum`, but no approved `dms_documents` schema contract or migration mapping was found that authorizes these columns.
- The active Student Documents implementation is a separate canonical path using `student_documents` and related tables, as documented in `docs/student-platform/student-documents-platform-engineering-validation-report.md` and `docs/student-platform/doc-005-security-contract-report.md`.

## Why execution stops

Implementing a real `dms_documents` writer or redirecting legacy reads/writes would require a schema/ownership decision not supplied by the current source. No column names, tenant ownership, lifecycle, or read-after-write mapping may be invented.

## Required owner/architecture input

Provide one of:

1. An approved `dms_documents` canonical contract with columns, tenant ownership, write/read ownership, and empty/error semantics; or
2. Formal approval to redirect the legacy `DocumentRepository` to the existing Student Documents canonical contract.

No SQL, migration, schema, storage, or production change was made.
