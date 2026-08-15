# DB-MIGRATION-003 — Migration Equivalence Matrix

## Scope

Comparison of the ten repository migrations with the read-only Staging table inventory.

## Matrix

| Migration | Expected table objects | Presence in Staging | Definition equivalence |
|---|---|---|---|
| `202608051200_core_foundation.sql` | 9 core tables | All 9 present | Not fully verified; column/constraint evidence gap |
| `202608051300_identity_platform.sql` | 9 identity tables | All 9 present | Not fully verified; column/constraint evidence gap |
| `202608051400_governance_platform.sql` | 14 governance tables | All 14 present | Not fully verified; column/constraint evidence gap |
| `202608051500_student_platform_foundation.sql` | `students`, `guardians`, `student_guardians` | All 3 present | Not fully verified; column/constraint evidence gap |
| `202608051600_guardian_platform.sql` | 2 guardian support tables | Both present | Not fully verified; column/constraint evidence gap |
| `202608051700_enrollment_engine.sql` | 3 enrollment tables | All 3 present | Not fully verified; column/constraint evidence gap |
| `202608061000_academic_status_engine.sql` | 3 academic status tables | All 3 present | Not fully verified; transition constraint not proven live |
| `202608061100_student_documents_platform.sql` | 4 document tables | All 4 present | Not fully verified; column/constraint evidence gap |
| `202608081700_db_sec_003_rls.sql` | RLS/policies/grants, no tables | Object semantics not available through current read-only CLI evidence | Not verified |
| `202608111000_enroll_schema_align_001.sql` | Constraint alteration, no tables | Target table present | Constraint alteration not proven live |

## Table-Level Result

The 47 public table names expected from the first eight table-creating migrations are all present in Staging. This is table-presence equivalence only, not schema certification.

## History Result

`supabase migration list` reported no remote migration versions. The repository migration history is therefore not reconciled with the observed schema.

## Final Matrix Status

`PARTIAL BASELINE — RECONCILIATION REQUIRED`, with a separate evidence gap for full definition and security-object comparison.
