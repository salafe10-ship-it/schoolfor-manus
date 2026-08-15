# Enrollment Timeline Screen Contract

Mission: EWP-003
Scope: Contract only; no UI implementation.

## Purpose

Present the complete, ordered enrollment lifecycle for an authorized student without allowing history mutation.

## Actors

- Admissions Officer
- School Administrator
- Authorized Registrar
- Auditor with enrollment-history permission

## Permissions

- `Enrollment.View`
- `Enrollment.History.View`
- `Enrollment.History.Export` where separately approved

## Workflow

1. Resolve trusted tenant and student scope.
2. Load current enrollment summary.
3. Load paginated enrollment history.
4. Order events by effective date and recorded timestamp.
5. Display source, destination, status, reason, and authorized audit reference.
6. Allow navigation to an enrollment or transfer only when permitted.

## Data Rules

- History is read-only.
- Historical events are never edited or deleted through this screen.
- Tenant and school scope is applied before returning results.
- Sensitive audit metadata is masked unless the actor has audit permission.
- Current state and historical events must be clearly distinguished.

## Filters

- Academic year
- Term
- School
- Branch
- Enrollment status
- Event type
- Effective date range

## Screen States

- Initial
- Loading current enrollment
- Loading timeline
- Results available
- No enrollment history
- Access denied
- Server failure

## Error States

- `401`: session expired.
- `403`: history permission or scope denied.
- `404`: student not found within trusted scope.
- `429`: rate limit reached.
- `5xx`: show correlation ID without internal details.

## Performance Budget

- Current enrollment summary p95: ≤ 300 ms.
- First history page p95: ≤ 500 ms.
- Subsequent pages p95: ≤ 500 ms.
- Default page size: 50.
- Maximum page size: 100.

## Accessibility and Security

- Timeline events have semantic headings and accessible chronology.
- Status is not conveyed by color alone.
- Keyboard users can expand and inspect events.
- Screen readers receive event type, effective date, and status.
- No cross-tenant existence disclosure is permitted.

