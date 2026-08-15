# ATTEND-MIGRATION-001 — Failure RCA

## Mission status

`ATTEND-MIGRATION-001 = BLOCKED — MIGRATION HISTORY / SCHEMA EVIDENCE GATE`

## Scope and environment

- Target environment: Staging only.
- Supabase project reference from the linked local project state: `vjcjscqgmijgzagshsca`.
- Target migration: `202608111200_attend_schema_001.sql`.
- Production was not accessed or modified.

## Phase A — Migration history preflight

### Local evidence

The repository contains the following ordered migration files relevant to the current foundation:

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
11. `202608111200_attend_schema_001.sql`

The target migration exists in the repository and is unchanged during this mission. Local files alone cannot prove which migrations are applied in the remote Staging migration history, whether earlier migrations are pending, or whether the target can apply alone.

### Existing blocker

`DB-HISTORY-ALIGN-001` remains open. Its approved RCA records that the remote migration history is empty or unmatched while the Staging database already contains schema objects. Registering migrations as applied or replaying the full set would be an unsupported and potentially destructive history decision.

### Phase A result

`BLOCKED — MIGRATION HISTORY GATE`

No `db push`, `--include-all`, migration repair, reset, or history marking was performed.

## Phase B — Schema evidence preflight

The mission requires approved read-only evidence for the definitions and integrity of the canonical dependencies before applying attendance tables, including:

- `students`
- `enrollments`
- academic year and term dependencies
- class/section dependencies
- `audit_events`
- `outbox_events`

The current environment has no approved Operations/Platform schema-metadata channel. The Dashboard/Table Editor is not sufficient to prove complete definitions, constraints, indexes, or migration provenance. The visible Table Editor session also uses the `postgres` role and is therefore not an approved evidence channel for this mission.

The following prohibited alternatives were not used: SQL Editor, direct Postgres, service-role access, `SET ROLE`, credential extraction, RLS bypass, schema dump containing credentials, or database mutation.

### Phase B result

`BLOCKED — SCHEMA EVIDENCE GATE`

## Execution result

- `202608111200_attend_schema_001.sql`: **NOT EXECUTED**.
- `attendance_sessions`: not certified as present in Staging.
- `attendance_records`: not certified as present in Staging.
- Foreign keys, unique constraints, check constraints, and indexes: not live-certified.
- Negative integrity tests: not run because the schema was not applied and no approved test fixture/evidence channel exists.
- Rollback test: not run; no mutation occurred.
- RLS or Production: not touched.

## Root cause

The mission cannot safely pass its mandatory gates because remote migration history and complete dependency schema definitions are not available through an approved read-only evidence channel. Proceeding would require an unsupported inference or a prohibited privileged/database path.

## Safe resume prerequisites

1. Provide an approved read-only migration-history report for project `vjcjscqgmijgzagshsca`.
2. Provide an approved schema-definition export/diff for the required dependencies, with secrets removed.
3. Resolve or explicitly govern `DB-HISTORY-ALIGN-001` without replaying or repairing history blindly.
4. Re-open `ATTEND-MIGRATION-001` with explicit Staging execution authority after the evidence gates pass.

## Safety conclusion

Stopping here preserves the existing Staging database, migration history, repository migration, and Production environment. No database or deployment state was changed by this mission.
