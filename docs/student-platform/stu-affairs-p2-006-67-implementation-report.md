# STU-AFFAIRS-P2-006-67 — Student Document List Identity Source-of-Truth

## Scope

Only the Student Documents list presentation and its directly related test were changed. No API, backend, service, repository, database, SQL, migration, RLS, authentication, authorization, tenant, Storage/Binary, Reporting, Print, Timeline, Lifecycle, Bulk, Graduation, ISO, staging, or production surface was changed.

## Source-of-truth decision

The current canonical Student Documents list response contains `student_id` but does not contain an approved student display name. The parent `students` prop is therefore not a canonical source for the list row identity.

The list now presents the canonical identifier explicitly as `معرّف الطالب: <student_id>`. No synthetic or cross-source student name is derived.

## Implementation

- Replaced the list's parent-prop name lookup with a deterministic canonical `student_id` label.
- Preserved the parent `students` prop for existing filter and registration controls only.
- Preserved selection, sorting, filtering, details, mutation semantics, error/empty states, and accessibility behavior.
- Added a regression test proving that a matching parent student name is not used as the list identity.

## Validation outcome

All required checks passed:

- Student Documents regression suite: 51/51 tests passed across 4 test files.
- TypeScript: passed.
- Vite production build: passed.
- Server bundle: passed; existing `import.meta`/CommonJS warnings are non-blocking.
- `git diff --check`: passed; Git reported only the existing LF/CRLF normalization warning.
- Scoped secret scan: passed.

## Decision

`STU-AFFAIRS-P2-006-67 = CODE-LEVEL CLOSED — STUDENT DOCUMENT LIST IDENTITY SOURCE-OF-TRUTH`.
