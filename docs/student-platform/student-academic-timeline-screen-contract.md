# Student Academic Timeline Screen Contract

Mission: EWP-004
Scope: Contract only; no UI implementation.

## Purpose

Provide a unified, read-only academic lifecycle view for a student by combining current academic status, status history, and authorized academic milestones.

## Actors

- School Administrator
- Authorized Registrar
- Academic Affairs Officer
- Auditor with academic timeline permission

## Permissions

- `Student.AcademicTimeline.View`
- `Student.AcademicStatus.History.View`
- `Student.AcademicTimeline.Export` where separately approved

## Workflow

1. Resolve trusted tenant and student context.
2. Load current academic status.
3. Load status history using bounded pagination.
4. Load permitted academic milestones from approved read sources.
5. Merge events by effective date and recorded timestamp.
6. Mask restricted reasons and approval data without permission.

## Timeline Rules

- Academic status is the authoritative lifecycle stream.
- Enrollment and transfer events may be displayed as related events but do not change academic status directly.
- Transfer is labeled as an Enrollment event, never as an Academic Status.
- Historical status events are immutable.
- Conflicting or missing events display a data-integrity warning, not a fabricated state.
- Tenant and school scope is enforced before data composition.

## Filters

- Date range
- Academic status
- Event category
- School
- Branch

## Screen States

- Initial
- Loading timeline
- Timeline available
- No academic history
- Data-integrity warning
- Access denied
- Session expired
- Server failure

## Empty and Error States

- No history: explain that no academic status events are recorded.
- Missing current status: display a blocking data-integrity warning.
- Access denied: do not reveal whether another scope contains records.
- `401`: return to trusted login.
- `403`: show scope or permission denial.
- `5xx`: show correlation ID without internal database details.

## Performance Budget

- Current status p95: ≤ 300 ms.
- First timeline page p95: ≤ 500 ms.
- Timeline composition p95: ≤ 700 ms.
- Maximum page size: 100 events.

## Accessibility and Security

- Timeline uses semantic landmarks and headings.
- Every event includes an accessible date, category, and status label.
- Keyboard users can navigate and expand event details.
- No color-only status communication.
- Restricted reason notes and approval metadata are masked by default.
- Client storage and URLs must not contain sensitive academic notes.

