# STU-AFFAIRS-P1-006-34 — Validation

## Evidence used

- Existing `CanonicalStudentReadRepository` tenant-scoped Student projection and error handling.
- Existing `CanonicalStudentWriteRepository.update` optimistic version check, transaction boundary, audit event creation, and `VALIDATION_ERROR`/`CONFLICT_ERROR` types.
- Existing registration normalization path for `birthCountryCode`.
- Approved P1-006-32 domain decision and P1-006-33 capability gap report.

## Contract checks

| Check | Result |
|---|---|
| Canonical source fixed | PASS — `students.birth_country_code` |
| Read serialization fixed | PASS — `string | null` |
| Patch absent/null/value semantics fixed | PASS |
| Shared normalization and validation fixed | PASS |
| ISO alpha-2 semantic validation required | PASS |
| Correction reason rules fixed | PASS |
| Existing error types reused | PASS |
| Expected-version conflict fixed | PASS |
| Trusted audit ownership fixed | PASS |
| Raw confidential values excluded from audit by default | PASS |
| Atomic success/rollback semantics fixed | PASS |
| Export/reporting excluded | PASS |
| Additional owner decision required | NO — based on approved P1-006-32 contract |

## Scope verification

No application code, API route, repository, UI, database, migration, SQL, RLS, authorization, tenant engine, export, reporting, staging, or production file was modified.

## Final result

`P1-006-34 = API CONTRACT READY FOR IMPLEMENTATION`

Implementation requires a separate bounded order that explicitly authorizes the Read/Patch changes described here.
