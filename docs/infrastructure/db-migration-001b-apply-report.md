# DB-MIGRATION-001B — Apply Report

## Mission

- **Environment:** Supabase Staging only
- **Project:** `edupro-school-erp-staging`
- **Project ref:** `vjcjscqgmijgzagshsca`
- **Migration in scope:** `supabase/migrations/202608111000_enroll_schema_align_001.sql`
- **Production:** untouched

## Preflight result

The official Supabase CLI preflight was executed with `db push --linked --dry-run`.
The command authenticated successfully and reported `upToDate=false`.

It proposed all ten repository migrations, not only `202608111000_enroll_schema_align_001.sql`:

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

## Execution decision

`db push` was **not executed**. The preflight demonstrated a migration-history/schema mismatch: the remote history does not identify the baseline migrations as applied, while the baseline schema already exists. Continuing would attempt to replay migrations outside this mission's scope.

## Result

- Database mutation: **none**
- Constraint mutation: **none**
- Migration registration: **none**
- Production impact: **none**
- Temporary CLI token: revoked after preflight

**Mission outcome:** `DB-MIGRATION-001B = STOP + RCA`
