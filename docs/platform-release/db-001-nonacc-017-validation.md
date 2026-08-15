# DB-001-NONACC-017 — Validation

## Required Matrix

| Case | Expected |
| --- | --- |
| Canonical success | Canonical data returned |
| Canonical empty | Existing `null`/`[]`/`false` semantics preserved |
| Canonical failure | Error propagated |
| Stale fallback plus canonical failure | No fallback success |
| Attendance status failure | Error, never false success |
| School scope | Existing scope and filters retained |

## Commands

- Focused: `db001Nonacc017StudentContactAttendanceEmployeeInventory.test.ts`
- Regression: DB-001-NONACC-001 and DB-001-NONACC-016 suites
- `tsc --noEmit`
- `git diff --check`
- Scoped secret scan

## Student Contact Gate

The current repository exposes an existing canonical `student_contacts` table path and no new PII or legal contract was introduced. Student Contact therefore completed the bounded code-level fix. If a future change alters ownership, retention, or privacy classification, it must be separately reviewed by Data Governance/Legal.
