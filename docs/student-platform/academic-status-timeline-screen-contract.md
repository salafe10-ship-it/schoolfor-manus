# Academic Status Timeline Screen Contract

Mission: EWP-004
Scope: Contract only; no UI implementation.

## Purpose

Display the approved academic status lifecycle and immutable history for one authorized student.

## Actors

- School Administrator
- Authorized Registrar
- Admissions Officer
- Auditor with academic-history permission

## Permissions

- `Student.AcademicStatus.View`
- `Student.AcademicStatus.History.View`
- `Student.AcademicStatus.History.Export` where separately approved

## Workflow

1. Resolve the trusted tenant, school, branch, and student context.
2. Load the single current academic status.
3. Load paginated status history.
4. Order events by effective date and recorded timestamp.
5. Display reason and approval metadata according to permission.
6. Keep all history read-only.

## Data Rules

- Current status and historical events must be visually distinct.
- Transfer events are not academic status events.
- History cannot be edited, deleted, or restored from this screen.
- Sensitive reason notes are masked without the required permission.
- Tenant and scope predicates are mandatory before retrieval.

## Filters

- Academic status
- Event type
- Effective date range
- School
- Branch

## Screen States

- Initial
- Loading current status
- Loading history
- Results available
- No history
- Access denied
- Session expired
- Server failure

## Error States

- `401`: session expired; return to trusted login.
- `403`: permission or scope denied.
- `404`: student unavailable within trusted scope.
- `429`: controlled retry required.
- `5xx`: show correlation ID without internal details.

## Performance Budget

- Current status p95: ≤ 300 ms.
- First history page p95: ≤ 500 ms.
- Subsequent pages p95: ≤ 500 ms.
- Default page size: 50; maximum: 100.

## Accessibility and Security

- Timeline events have semantic headings and accessible chronology.
- Status is not conveyed by color alone.
- Keyboard users can inspect each event.
- Screen readers receive status, effective date, event type, and approval state.
- No cross-tenant existence disclosure is permitted.

