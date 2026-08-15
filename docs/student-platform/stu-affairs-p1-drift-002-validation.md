# STU-AFFAIRS-P1-DRIFT-002 — Validation

## Validation Type

Static contract audit with focused regression coverage. No source, API, database, SQL, RLS, migration, staging, or production change was made for the blocked fields.

## Checks

- UI payload evidence for `classroom`, `section`, and `status`: PASS.
- Canonical edit mapping boundary identified: PASS.
- Student schema boundary checked against the Student Platform migration: PASS.
- Enrollment ownership of class and section references checked: PASS.
- Lifecycle dependency for general status updates recorded: PASS.
- Client tenant/school/branch values are not introduced into the canonical patch: PASS.
- Existing Graduation containment remains unchanged: PASS.

## Test Commands

- Focused P1-DRIFT-002 contract test: PASS.
- TypeScript `--noEmit`: PASS.
- Existing Student Affairs regression tests: PASS after the preceding P0 containment.

## Final Decision

`P1-DRIFT-002 = PARTIAL / DOMAIN OR SCHEMA DEPENDENCY`

No implementation can safely close all three fields inside the Student Edit path without violating the approved domain boundaries. No unrelated files were modified for this order.
