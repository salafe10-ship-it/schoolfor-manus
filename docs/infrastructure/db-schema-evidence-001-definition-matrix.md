# DB-SCHEMA-EVIDENCE-001 — Definition Matrix

## Scope

- Supabase Staging only: `edupro-school-erp-staging`
- Project ref: `vjcjscqgmijgzagshsca`
- Read-only UI inspection only
- No SQL, no migration push, no history repair, no schema mutation

## Migration-by-migration matrix

| Migration | Expected objects from Git | Objects visible in Staging | Definitions | RLS / policies | Constraints | Classification |
|---|---|---|---|---|---|---|
| Core | 9 tables | 9 names present | Full columns and indexes not exposed in one supported read-only view | Not verified for all 9 | Not verified | D |
| Identity | 9 tables | 9 names present | Full definitions unavailable | Not verified for all 9 | Not verified | D |
| Governance | 14 tables | 14 names present | Full definitions unavailable | Not verified for all 14 | Not verified | D |
| Student foundation | 3 tables | 3 names present | Full definitions unavailable | Not verified for all 3 | Not verified | D |
| Guardian | 2 support tables | 2 names present | Full definitions unavailable | Not verified for both | Not verified | D |
| Enrollment | 3 tables | 3 names present | Full definitions unavailable | Not verified for all 3 | Not verified | D |
| Academic status | 3 tables | 3 names present | Target table columns partially visible | RLS enabled and 4 policies visible for `student_status_transitions` | Full check text unavailable | D |
| Student documents | 4 tables | 4 names present | Full definitions unavailable | Not verified for all 4 | Not verified | D |
| DB-SEC-003 | 46 policies | Partial policy evidence only | Policy definitions not fully extractable | 4 policies visible on target table only | N/A | D |
| Schema alignment | `ck_student_status_transitions_allowed` | Target table present | Constraint expression not exposed | RLS remains enabled | `active → withdrawn` unproven | D |

## Direct UI evidence

The Table Editor visibly exposed for `student_status_transitions`:

- `id uuid`
- `tenant_id uuid`
- `school_id uuid`
- `branch_id uuid`
- `student_id uuid`
- empty table state
- RLS policies link showing `4`

The UI did not expose the full table definition, complete column list, check expression, foreign-key set, or index definition needed to establish schema equivalence.

## Result

Object presence is confirmed for the expected 47 public tables. Definition equivalence and provenance remain unproven for all ten migrations. No migration is promoted above `D`.
