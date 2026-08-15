# STATUS-OP-001 — Re-enroll Contract

## Evidence from current code

- Route: `POST /api/students/:id/re-enroll`.
- Permission: broad `Student.Write`.
- Service: `StudentEnrollmentService.reEnrollStudent`.
- Intended legacy source: `suspended` or a previously inactive/withdrawn record; the code validates to legacy `re_enrolled`.
- Write: legacy `students.status = active`, plus classroom, section, and registration date.
- Audit is written; no canonical enrollment/status transition/history/outbox chain is written.

## Canonical conflict

`re_enrolled` is not a canonical academic status. The approved machine has no ordinary reverse transition from `withdrawn`, `graduated`, or `archived` to `active`. Re-enrollment is therefore an Enrollment operation first, not a string status update.

## Contract fields requiring approval

| Field | Current evidence | Decision required |
|---|---|---|
| Permitted source states | Legacy validation is incomplete and uses `re_enrolled` | Which source states are allowed? |
| Target | Legacy writes `active` | Confirm new Enrollment + `admitted → active`, or another flow |
| Academic year | Not supplied to the legacy method | Trusted academic year and term |
| Enrollment | Not created | New enrollment record, dates, and uniqueness |
| Class/section | Required | Ownership and academic validation |
| Previous history | Not represented | Preserve immutable history and link new enrollment |
| Approval | Not defined | Permission, approver, and reason |
| Finance | Not checked | Fees, balances, and accounting effects |
| Reversal | Not defined | Correction/withdrawal policy |
| Outbox | Not implemented | Re-enrollment event and subscribers |

## Implementation gate

Do not map `re_enrolled → active`. Require the Enrollment domain contract and a canonical multi-record transaction before implementation.

## Decision

`Re-enroll = BUSINESS CONTRACT GAP`.
