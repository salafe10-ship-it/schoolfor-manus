# Enrollment Wizard Screen Contract

Mission: EWP-003
Scope: Contract only; no UI implementation.

## Purpose

Create and confirm a student enrollment for a trusted tenant, school, branch, academic year, and term.

## Actors

- Admissions Officer
- School Administrator
- Authorized Registrar

## Permissions

- `Enrollment.View`
- `Enrollment.Create`
- `Enrollment.Edit`
- `Enrollment.Activate`
- `Enrollment.Cancel`

## Workflow

1. Resolve trusted tenant and school context.
2. Select an authorized student.
3. Select academic year, term, branch, class, and section references.
4. Verify approved admission reference.
5. Enter enrollment period and review business rules.
6. Submit with an idempotency key.
7. Persist enrollment, history, audit, and Outbox records atomically.
8. Display the enrollment number and status.

## Validation Matrix

| Field/Action | Validation | Failure |
|---|---|---|
| Student | Exists within trusted tenant scope | `ENR-CTX-001` |
| Academic year | Belongs to selected school | `ENR-VAL-001` |
| Term | Belongs to selected academic year and school | `ENR-VAL-002` |
| Admission | Approved reference is required before activation | `ENR-ADM-001` |
| Period | Start precedes end; no overlap | `ENR-PER-001` |
| Active enrollment | One active enrollment per academic year | `ENR-DUP-001` |
| Number | Server-generated and unique within school | `ENR-NUM-001` |
| Submission | Idempotency key is required | `ENR-IDM-001` |
| Update | Expected version must match | `ENR-CON-001` |

## Business Rules

- Client values never determine tenant, actor, or authorization scope.
- Draft and pending records may exist without an approved admission.
- Activation requires approved admission and a non-empty admission reference.
- Completed, withdrawn, and transferred records require an end date.
- Enrollment periods may not overlap for the same student.
- Enrollment history is appended in the same transaction as the state change.
- Failed submissions roll back all enrollment and history changes.

## Screen States

- Initial
- Loading context
- Ready
- Validating admission
- Checking overlap
- Saving
- Success
- Validation failure
- Authorization failure
- Conflict
- Server failure

## Loading and Empty States

- Context loading disables submission.
- No eligible student displays an authorized student-selection action.
- No approved admission blocks activation.
- No available academic term blocks submission.
- Duplicate or overlapping enrollment displays a review state, not a silent retry.

## Error States

- `401`: session expired; return to trusted login.
- `403`: permission or tenant scope denied.
- `409`: active enrollment, overlap, idempotency, or version conflict.
- `422`: admission, academic year, term, or period rule failure.
- `5xx`: show correlation ID and preserve only current-session non-sensitive form state.

## Performance Budget

- Context and policy load p95: ≤ 300 ms.
- Enrollment lookup p95: ≤ 300 ms.
- Overlap validation p95: ≤ 300 ms.
- Enrollment creation p95: ≤ 800 ms.

## Accessibility and Security

- Full keyboard navigation and visible focus.
- Every field has an accessible label and error association.
- Loading and validation states are announced.
- Tenant, actor, audit, and permission fields are never editable.
- No sensitive admission data is exposed in URLs or client storage.

