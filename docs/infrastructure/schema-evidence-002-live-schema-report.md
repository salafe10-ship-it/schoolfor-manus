# SCHEMA-EVIDENCE-002 — Live Schema Report

## Evidence available

- Staging contains 47 public table names matching the union of migrations 1–8.
- Staging inspection previously reported 270 total indexes and 264 public indexes.
- `student_status_transitions` exists and is empty.
- Visible columns include `id uuid`, `tenant_id uuid`, `school_id uuid`, `branch_id uuid`, and `student_id uuid`.
- RLS is enabled on `student_status_transitions`; the UI shows four policies.

## Evidence unavailable

- Complete columns and types for all 47 tables.
- All PK, FK, unique, check, and exclusion definitions.
- All index definitions and predicates.
- Complete RLS policy expressions and roles.
- Full constraint expression for `ck_student_status_transitions_allowed`.
- Reliable migration-by-migration provenance.

## Safety statement

This report contains metadata only. No rows were read, no SQL was executed, no schema was changed, and Production was not accessed.
