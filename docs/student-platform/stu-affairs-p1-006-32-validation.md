# STU-AFFAIRS-P1-006-32 — Validation

## Evidence reviewed

- `supabase/migrations/202608051500_student_platform_foundation.sql` defines nullable `birth_country_code char(2)` and the uppercase two-letter check constraint.
- `src/modules/student-registration/application/StudentRegistrationService.ts` accepts, normalizes, and validates the registration value before persistence.
- `src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts` persists the canonical Student column.
- `server.ts` maps the trusted registration input to `birthCountryCode`.
- P1-006-29 and P1-006-30 establish the existing Read/Edit parity gap.

## Decision checks

| Check | Result |
|---|---|
| Canonical owner identified | PASS — Student / `students.birth_country_code` |
| Source-of-truth conflict | PASS — none found |
| Nullable policy decided | PASS — nullable / explicit null |
| Create policy decided | PASS — optional normalized validated value |
| Edit policy decided | PASS — controlled correction with expected version |
| Audit policy decided | PASS — trusted server metadata and reason |
| Tenant scope decided | PASS — existing trusted tenant/school/branch context |
| UI decision | PASS — detailed Profile inclusion approved for future bounded implementation |
| Export/report decision | PASS — detailed authorized surfaces only; bulk/default summary excluded |
| Privacy classification | PASS — CONFIDENTIAL |

## Scope verification

No source, code, API, repository, database, migration, SQL, RLS, authorization, tenant engine, enrollment, lifecycle, export, reporting, staging, or production files were modified for this architecture package.

## Final result

`P1-006-32 = BIRTH COUNTRY CONTRACT APPROVED FOR IMPLEMENTATION`

The next action, if authorized, must be a separate bounded implementation order. This document alone does not enable the implementation.
