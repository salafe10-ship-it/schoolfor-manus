# ATTEND-DESIGN-001 — Permission Contract

## Status

Design contract only. Do not add these permissions to `PermissionRegistry` in this mission.

| Permission | Purpose | Expected roles | Scope | Elevated? |
|---|---|---|---|---|
| `Attendance.Session.View` | View sessions and lifecycle | teacher, student_affairs, auditor | trusted school/branch | No |
| `Attendance.Session.Create` | Open a session | student_affairs; designated academic operator | trusted school/branch | No |
| `Attendance.Record.View` | View records and history | teacher, student_affairs, auditor | trusted school/branch | No |
| `Attendance.Record.Create` | Record one student state | teacher, student_affairs | session scope | No |
| `Attendance.Record.BulkCreate` | Record a batch idempotently | teacher, student_affairs | session scope | No |
| `Attendance.Record.Correct` | Correct a record with reason/audit | student_affairs; designated supervisor | trusted scope | Yes |
| `Attendance.Session.Lock` | Lock a session | student_affairs; designated supervisor | trusted school/branch | Yes |
| `Attendance.Report.View` | View attendance reports | student_affairs, auditor | trusted school/branch | No |

Role assignments are proposed mappings, not changes to the existing role resolver. No wildcard permission is allowed. Authorization must be evaluated centrally on the server after authentication and before tenant validation/business logic.
