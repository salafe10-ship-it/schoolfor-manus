# STATUS-OP-001 — Archive Contract

## Evidence from current code

- Route: `POST /api/students/:id/archive`.
- Permission: broad `Student.Write`.
- Service: `StudentEnrollmentService.archiveStudent`.
- Archive path validates a legacy transition to `archived` and updates the student.
- Restore path validates a legacy transition to `inactive`, then writes `active`; `inactive` is not canonical.
- Legacy audit is written; no canonical status history/transition/outbox is written.

## Canonical conflict

The approved machine treats `archived` as terminal. `Archive` may be a valid terminal lifecycle operation, but the current code does not prove that every source state is eligible. Restore is not an ordinary canonical transition and cannot be implemented as `archived → active`.

## Contract fields requiring approval

| Field | Current evidence | Decision required |
|---|---|---|
| Source state | Legacy validator permits several sources | Restrict to `graduated → archived`, or define approved archival paths |
| Archive meaning | Not documented in service | Academic terminal state, administrative retention, or soft-delete projection |
| Reason | Not required | Required reason and retention basis |
| Retention | Not defined | Retention period, legal hold, purge policy |
| Historical visibility | Not defined | Reporting and timeline behavior |
| Restore | Legacy writes `active` | Correction workflow, or forbidden permanently |
| Side effects | Audit only | Enrollment, documents, reporting, notifications |
| Outbox | Not implemented | Archive event and subscribers |

## Implementation gate

Do not implement restore. Archive can be adapted only after source-state, retention, terminal-state, audit, and correction policies are approved.

## Decision

`Archive = BUSINESS CONTRACT GAP`.
