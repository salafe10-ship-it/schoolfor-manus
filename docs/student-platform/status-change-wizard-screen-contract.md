# Status Change Wizard Screen Contract

Mission: EWP-004
Scope: Contract only; no UI implementation.

## Purpose

Request and complete an approved academic status transition for a student using the centralized transition policy.

## Actors

- Authorized Registrar
- School Administrator
- Designated Status Approver
- Compliance Officer for correction workflows

## Permissions

- `Student.AcademicStatus.Change`
- `Student.AcademicStatus.Approve`
- `Student.AcademicStatus.Correct`

Approval and correction permissions must be separated where policy requires separation of duties.

## Workflow

1. Resolve trusted scope and load the current status.
2. Present only transitions allowed from the current status.
3. Capture effective date, reason code, and reason notes.
4. Require approval metadata for controlled transitions.
5. Require correction reference for terminal-state corrections.
6. Submit with an idempotency key.
7. Commit transition, current status, history, audit, and Outbox records atomically.
8. Display the resulting status and correlation ID.

## Approved Transition Matrix

| Current | Next | Workflow |
|---|---|---|
| Applicant | Admitted | Ordinary approval |
| Admitted | Active | Admission completion approval |
| Active | Suspended | Authorized status approval |
| Suspended | Withdrawn | Authorized status approval |
| Withdrawn | Graduated | Graduation approval |
| Graduated | Archived | Retention/archive approval |
| Any valid state | Any valid state | Correction workflow only, with approved reference |

Transfer is never offered as a status transition.

## Validation Matrix

| Field/Action | Validation | Failure |
|---|---|---|
| Current status | Must match trusted current record | `AST-CON-001` |
| Target status | Must be an approved transition | `AST-TRN-001` |
| Effective date | Required and policy-valid | `AST-VAL-001` |
| Reason code | Required and non-empty | `AST-VAL-002` |
| Approval | Required for controlled transitions | `AST-AUTH-001` |
| Correction | Requires reference and elevated permission | `AST-COR-001` |
| Idempotency | Key cannot be reused with another payload | `AST-IDM-001` |
| Version | Expected version must match | `AST-CON-002` |

## Screen States

- Loading current status
- Ready
- Awaiting approval
- Saving
- Completed
- Invalid transition
- Terminal state
- Correction review
- Conflict
- Authorization failure
- Server failure

## Error States

- `401`: session expired.
- `403`: change or approval permission denied.
- `409`: stale version or duplicate command.
- `422`: illegal transition or missing reason/approval.
- `5xx`: show correlation ID and preserve non-sensitive current-session form state.

## Performance Budget

- Current status load p95: ≤ 300 ms.
- Transition validation p95: ≤ 300 ms.
- Status change command p95: ≤ 800 ms.

## Accessibility and Security

- Only permitted next states are keyboard selectable.
- Illegal transitions are not offered as controls.
- Approval and correction actions require explicit confirmation.
- Audit fields, actor, tenant, and school are never editable.
- Sensitive reason notes are permission-controlled.

