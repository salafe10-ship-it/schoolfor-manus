# ATTEND-DESIGN-001 — Transaction and API Design

## Transaction boundaries

### Create session

Authenticate → validate permission → resolve trusted context → validate academic/class context → create session → audit → outbox where required → commit.

### Record attendance

Authenticate → validate permission → resolve trusted context → validate enrollment and student scope → validate session is open → enforce idempotency/uniqueness → create record(s) → audit → outbox where required → commit.

### Correct attendance

Authenticate → validate elevated correction permission → validate trusted context and session policy → capture old state → apply new state with version check → audit old/new/reason → outbox where required → commit.

### Lock session

Authenticate → validate lock permission → validate session context → transition `open` to `locked` with version check → audit → outbox → commit.

Rollback applies to every failed step. No partial attendance, audit, or outbox write is acceptable.

## Proposed API contracts (design only)

| Operation | Method/route | Permission | Idempotency |
|---|---|---|---|
| Create session | `POST /api/attendance/sessions` | `Attendance.Session.Create` | request key |
| List sessions | `GET /api/attendance/sessions` | `Attendance.Session.View` | n/a |
| Get session | `GET /api/attendance/sessions/:id` | `Attendance.Session.View` | n/a |
| Record one | `POST /api/attendance/sessions/:id/records` | `Attendance.Record.Create` | request key |
| Record bulk | `POST /api/attendance/sessions/:id/records/bulk` | `Attendance.Record.BulkCreate` | required batch key |
| Student history | `GET /api/students/:studentId/attendance` | `Attendance.Record.View` | n/a |
| Session records | `GET /api/attendance/sessions/:id/records` | `Attendance.Record.View` | n/a |
| Correct record | `POST /api/attendance/records/:id/corrections` | `Attendance.Record.Correct` | correction key |
| Lock session | `POST /api/attendance/sessions/:id/lock` | `Attendance.Session.Lock` | lock key |
| Reports | `GET /api/attendance/reports` | `Attendance.Report.View` | n/a |

Server-generated fields include trusted tenant/school/branch/actor, timestamps, audit metadata, and correlation identifiers. Client payloads cannot select those values.

## Error contract

Expected categories include missing/invalid context, enrollment not eligible, session not found, cross-scope reference, session locked, duplicate record, version conflict, invalid state, forbidden correction, and idempotency conflict. Exact codes belong to the implementation mission.
