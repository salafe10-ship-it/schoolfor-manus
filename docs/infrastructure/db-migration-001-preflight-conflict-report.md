# DB-MIGRATION-001 — Preflight Conflict Report

## Scope

Supabase Staging project `vjcjscqgmijgzagshsca` only. No production action was performed.

## Channel Result

- Supabase CLI: `2.113.0`
- Project link: successful for `vjcjscqgmijgzagshsca`
- Preflight command: `supabase db push --dry-run`
- Database mutation: none
- Target project dashboard state before push: no migrations recorded

## Detected Conflict

The dry run reports ten pending migrations, not only `202608111000_enroll_schema_align_001.sql`:

1. `202608051200_core_foundation.sql`
2. `202608051300_identity_platform.sql`
3. `202608051400_governance_platform.sql`
4. `202608051500_student_platform_foundation.sql`
5. `202608051600_guardian_platform.sql`
6. `202608051700_enrollment_engine.sql`
7. `202608061000_academic_status_engine.sql`
8. `202608061100_student_documents_platform.sql`
9. `202608081700_db_sec_003_rls.sql`
10. `202608111000_enroll_schema_align_001.sql`

Applying `supabase db push` from the repository root would therefore apply the entire pending chain, including business-domain migrations and the RLS migration. That exceeds the operations-only scope of `DB-MIGRATION-001` and is not safe to execute without an explicit approved migration-chain order.

## Dependency Evidence

`202608111000_enroll_schema_align_001.sql` alters `student_status_transitions`.
That table is created by `202608061000_academic_status_engine.sql`, so the alignment migration cannot be applied to an empty database as an isolated migration.

## Decision

`DB-MIGRATION-001 = BLOCKED + MIGRATION-CHAIN SCOPE CONFLICT`

No migration was applied. No SQL Editor, service role, direct database connection, or bypass was used.

## Required CTO Decision

Approve one of the following before any database mutation:

1. Approve the complete ordered migration chain for this Staging project, including its business and RLS migrations; or
2. Provide an approved isolated staging baseline whose prerequisite migrations are already recorded/applied, then run only the alignment migration through the official channel.

No migration files were modified.
