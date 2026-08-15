# DB-SCHEMA-EVIDENCE-001 — Read-Only Findings

## Supported evidence collected

1. Supabase Table Editor for `student_status_transitions`.
2. RLS policies link for that table showing four policies.
3. Visible column/type evidence for the first five columns.
4. Existing official CLI inventory evidence: 47 public tables and 270 total indexes.
5. Git static inventory of all ten migration files and their DDL operations.

## Evidence not available through the permitted channel

- Complete column definitions for all 47 tables.
- Exact primary and foreign key definitions for all tables.
- Exact unique, check, and exclusion constraint definitions.
- Full index definitions and predicates.
- Full RLS policy expressions and role mappings.
- Constraint expression for `ck_student_status_transitions_allowed`.
- Reliable per-migration execution provenance.

`supabase db diff --linked` and `supabase db dump --linked --schema public` were not usable because the local CLI path requires Docker Desktop. The dump dry-run path was not repeated because it previously emitted connection credentials, which is outside the allowed evidence channel.

## Security outcome

No secret was stored in the repository or in these reports. The short-lived read-only forensics token was revoked after use. Production was not accessed.
