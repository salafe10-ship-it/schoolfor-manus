# STATUS-OP-002 — Graduate Contract

## Approved scope

Graduate only. Dismiss, Archive, Re-enroll, Enrollment, Finance, Attendance, Examinations, RLS, schema, migrations, and production are out of scope.

## Evidence-backed legacy contract

| Item | Current behavior |
|---|---|
| Route | `POST /api/students/:id/graduate` |
| Authorization | Broad `Student.Write` permission |
| Service | `StudentGraduationService.graduateStudent` |
| Source state | Legacy `active` is required by `StudentLifecycleManager` for the normal path |
| Eligibility | `feesRemaining` must equal zero |
| Target | Legacy `students.status = graduated` |
| Audit | Legacy `AuditRepository.log` |
| History | No canonical `student_status_history` write |
| Transition | No canonical `student_status_transitions` write |
| Outbox | No status outbox event |
| Graduate record | In-memory `graduateRegistry` response object only |

## Canonical contract that is proven by the database package

The Academic Status migration permits the ordinary transition:

`withdrawn → graduated`

It does not permit the legacy transition:

`active → graduated`

The canonical `students` table also does not contain the legacy `feesRemaining` application field. The current fee-balance rule therefore has no proven canonical database source in this path.

## Contract decision

The current evidence does not safely choose between these alternatives:

1. Preserve the existing business meaning and allow `active → graduated` — would require a schema/migration change, which is forbidden.
2. Require `withdrawn → graduated` — changes the existing business meaning and requires an Enrollment closure contract, which is not present.
3. Add a separate graduation domain record — would be a new schema/business design, which is outside this mission.

No alternative is approved by current source evidence. The operation-specific contract is therefore not implementation-ready.

## Authorization note

The route currently uses `Student.Write`. No narrower Graduate permission was proven, and authorization infrastructure is out of scope. Record this as `AUTHORIZATION GAP — SEPARATE MISSION`; do not invent a new permission in this mission.

## Decision

`STATUS-OP-002 = BUSINESS DECISION REQUIRED`.
