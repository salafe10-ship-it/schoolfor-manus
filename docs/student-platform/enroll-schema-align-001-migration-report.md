# ENROLL-SCHEMA-ALIGN-001 — Migration Report

Date: 2026-08-11  
Environment: Staging migration artifact only; no production execution

## Change made

Created immutable follow-up migration:

`supabase/migrations/202608111000_enroll_schema_align_001.sql`

The migration replaces only `ck_student_status_transitions_allowed` with the same approved initial, ordinary and correction rules plus one ordinary transition:

`active → withdrawn`

## Explicitly unchanged

- All other Academic Status transitions.
- Enrollment tables and constraints.
- Student lifecycle and `students.status`.
- Transfer and Re-enrollment semantics.
- UnitOfWork and Postgres transaction driver.
- RLS, Auth, Authorization and TenantEngine.
- Production database.

## Migration safety

- DDL is wrapped in `BEGIN`/`COMMIT`.
- The old migration is not edited.
- No tables, functions, triggers, policies, roles or seed data are created.
- The follow-up migration depends on the existing Academic Status migration and is ordered after it.
