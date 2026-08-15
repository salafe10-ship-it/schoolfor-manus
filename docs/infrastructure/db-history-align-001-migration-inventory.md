# DB-HISTORY-ALIGN-001 — Migration Inventory

## Scope

- Environment: Supabase Staging only
- Project ref: `vjcjscqgmijgzagshsca`
- Repository branch: `codex/sop-001-staging`
- Source: `supabase/migrations/`
- Mutation performed: none

## Ordered migration matrix

| # | Migration | Git | Primary SQL operations | Objects declared in Git | Live object evidence | Classification |
|---:|---|---|---|---|---|---|
| 1 | `202608051200_core_foundation.sql` | Yes | CREATE TABLE, CREATE INDEX | 9 core tables | All 9 names present in the 47-table public inventory | D — full equivalence unproven |
| 2 | `202608051300_identity_platform.sql` | Yes | CREATE TABLE, CREATE INDEX | 9 identity tables | All 9 names present in the public inventory | D — full equivalence unproven |
| 3 | `202608051400_governance_platform.sql` | Yes | CREATE TABLE, CREATE INDEX | 14 governance tables | All 14 names present in the public inventory | D — full equivalence unproven |
| 4 | `202608051500_student_platform_foundation.sql` | Yes | CREATE TABLE, CREATE INDEX | 3 student foundation tables | All 3 names present in the public inventory | D — full equivalence unproven |
| 5 | `202608051600_guardian_platform.sql` | Yes | CREATE TABLE, CREATE INDEX | 2 guardian support tables | Both names present in the public inventory | D — full equivalence unproven |
| 6 | `202608051700_enrollment_engine.sql` | Yes | CREATE TABLE, CREATE INDEX, ALTER TABLE | 3 enrollment tables | All 3 names present in the public inventory | D — full equivalence unproven |
| 7 | `202608061000_academic_status_engine.sql` | Yes | CREATE TABLE, CREATE INDEX | 3 academic status tables | All 3 names present in the public inventory | D — full equivalence unproven |
| 8 | `202608061100_student_documents_platform.sql` | Yes | CREATE TABLE, CREATE INDEX | 4 document tables | All 4 names present in the public inventory | D — full equivalence unproven |
| 9 | `202608081700_db_sec_003_rls.sql` | Yes | ALTER TABLE, CREATE POLICY | 46 policies | RLS and 4 policies verified on `student_status_transitions`; full policy equivalence unproven | D — partial evidence only |
| 10 | `202608111000_enroll_schema_align_001.sql` | Yes | ALTER TABLE, DROP CONSTRAINT, ADD CONSTRAINT | `ck_student_status_transitions_allowed` | Target table exists; live constraint expression unavailable through permitted UI | D — constraint state unproven |

## Official CLI pending set

The authenticated read-only preflight reported `upToDate=false` and proposed all ten migrations in the order above. This is consistent with the Supabase migration page showing no listed applied versions, but it does not prove that the SQL was never executed through another channel.

## Conclusion

The migration files are present and ordered correctly in Git. The live inventory proves object-name presence for the table migrations, but not schema equivalence or execution provenance. No migration can be classified A (schema equivalent / already applied) from the available evidence.
