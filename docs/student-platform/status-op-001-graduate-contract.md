# STATUS-OP-001 — Graduate Contract

## Evidence from current code

- Route: `POST /api/students/:id/graduate`.
- Permission: broad `Student.Write`.
- Service: `StudentGraduationService.graduateStudent`.
- Preconditions: student must exist; `feesRemaining` must be zero; `StudentLifecycleManager` must allow the transition.
- Current legacy transition: `active → graduated`.
- Writes: legacy `StudentRepository.update({ status: 'graduated' })` and `AuditRepository.log`.
- Additional output: an in-memory `graduateRegistry` object; no dedicated graduate persistence is performed.
- No canonical `student_status_transitions`, `student_status_history`, or `outbox_events` record is created.

## Canonical conflict

The approved Academic Status migration allows ordinary `withdrawn → graduated`, not `active → graduated`. The application therefore cannot safely map the current operation by changing one string.

## Contract fields requiring approval

| Field | Current evidence | Decision required |
|---|---|---|
| Allowed source state | `active` in legacy service | Approve `active → graduated`, or require Enrollment closure and `withdrawn → graduated` |
| Eligibility | Zero outstanding fees only | Define academic completion, enrollment closure, attendance/exam requirements |
| Reason | Not required/persisted by legacy service | Required reason code and notes? |
| Approval | No separate approval workflow | Approver role, timestamp, and permission |
| Academic year | Hard-coded in mock registry (`2026/2027`) | Trusted academic-year source and effective date |
| Enrollment effect | Not persisted | Close current enrollment? Create graduate snapshot? |
| Finance effect | Fee balance check only | Accounting/finance closure contract |
| Attendance/exams | Not checked | Required completion gates |
| Reversal | No reverse operation | Correction-only policy and approval |
| Audit/outbox | Legacy audit only | Canonical history, audit event, and domain event contract |

## Implementation gate

Do not implement until the source-state and Enrollment/Finance/Examination effects are approved. A safe adapter must use the existing UnitOfWork and must write the canonical status, projection, transition, history, audit, and outbox atomically.

## Decision

`Graduate = BUSINESS CONTRACT GAP`.
