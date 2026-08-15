# DB-MIGRATION-004 — Schema Equivalence Matrix

## Result

Full equivalence cannot be certified because the official schema-diff and schema-dump paths require Docker on this execution environment.

| Migration | Table presence | Definition | Constraints | Security objects | Result |
|---|---|---|---|---|---|
| `202608051200_core_foundation.sql` | 9/9 present | Unknown | Unknown | N/A | Evidence blocked |
| `202608051300_identity_platform.sql` | 9/9 present | Unknown | Unknown | N/A | Evidence blocked |
| `202608051400_governance_platform.sql` | 14/14 present | Unknown | Unknown | N/A | Evidence blocked |
| `202608051500_student_platform_foundation.sql` | 3/3 present | Unknown | Unknown | N/A | Evidence blocked |
| `202608051600_guardian_platform.sql` | 2/2 present | Unknown | Unknown | N/A | Evidence blocked |
| `202608051700_enrollment_engine.sql` | 3/3 present | Unknown | Unknown | Unknown | Evidence blocked |
| `202608061000_academic_status_engine.sql` | 3/3 present | Unknown | Unknown | Unknown | Evidence blocked |
| `202608061100_student_documents_platform.sql` | 4/4 present | Unknown | Unknown | Unknown | Evidence blocked |
| `202608081700_db_sec_003_rls.sql` | N/A — policy migration | N/A | N/A | Unknown | Evidence blocked |
| `202608111000_enroll_schema_align_001.sql` | N/A — constraint migration | N/A | Unknown | N/A | Evidence blocked |

## Important Distinction

Table-name presence is not schema equivalence. The result must not be used to reconcile migration history, apply compatibility DDL, or reset Staging.
