# STATUS-OP-001 — Dismiss Contract

## Evidence from current code

- Route: `POST /api/students/:id/dismiss`.
- Permission: broad `Student.Write`.
- Service: `StudentEnrollmentService.dismissStudent`.
- Input includes `type` (`temporary` or `permanent`), `reason`, `decisionNumber`, `authority`, and `date`.
- Temporary path writes legacy `students.status = suspended`.
- Permanent path writes legacy `students.status = dismissed`.
- Behavior notes are composed from the request; a legacy audit entry is written.
- No canonical status transition/history/outbox chain is written.

## Canonical conflict

`suspended` is canonical, but `dismissed` is not. The code does not prove whether permanent dismissal means withdrawal, archive, expulsion, or a separate administrative result. Mapping it to `withdrawn` would be an unapproved business decision.

## Contract fields requiring approval

| Field | Current evidence | Decision required |
|---|---|---|
| Temporary target | `suspended` | Confirm `active → suspended` and permitted source states |
| Permanent target | `dismissed` | Choose a canonical outcome or define a separate domain contract |
| Reason | Required input | Canonical reason code catalog, notes, and retention |
| Authority | Required input | Trusted approver reference and authorization |
| Decision number | Required input | Uniqueness and audit correlation |
| Effective date | Required input | Date semantics and academic-year validation |
| Reversal | Not implemented | Reactivation/correction workflow |
| Side effects | Behavior notes and audit only | Enrollment, attendance, exams, finance, communication effects |
| Outbox | Not implemented | Event type and subscribers |

## Implementation gate

Implement temporary suspension only after its operation permission, reason catalog, and side effects are approved. Do not implement permanent dismissal until its canonical meaning is decided.

## Decision

`Dismiss = BUSINESS CONTRACT GAP`.
