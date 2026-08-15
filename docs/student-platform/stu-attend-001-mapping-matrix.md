# STU-ATTEND-001 — Attendance Mapping Matrix

| Required domain concept | Current evidence | Result |
|---|---|---|
| Student identity | `student_id` in legacy SQL and `studentId` in the TypeScript model | Present but not tenant-scoped at the model boundary |
| Enrollment | No attendance reference to `enrollments` found | Missing; cannot prove whether unenrolled students may be marked |
| Academic year | No field in `Attendance` or legacy SQL | Missing |
| Term | No field in `Attendance` or legacy SQL | Missing |
| Class/section | Only legacy `classroom`/`classroom` text | Not a trusted class/section relation |
| Date | `date` exists | Present, but no timezone/session policy |
| Session/period | No field or writer contract | Missing |
| Status | `present`, `absent`, `excused` in `src/types.ts`; HR separately adds `late` | Unapproved divergence; student late policy absent |
| Late/arrival time | No student fields | Missing |
| Excuse workflow | No student excuse entity, approval, or transition found | Missing |
| Attendance correction | Repository update exists but no workflow/approval/version contract | Unsafe |
| Audit | Legacy admission lists `audit_logs`, but attendance row has no trusted audit metadata | Incomplete |
| Outbox/notifications | No student attendance event writer found | Missing |
| Tenant/school/branch | Repository accepts `schoolId`; model and most writes do not carry trusted tenant/branch | P0 isolation gap |
| Unit of Work | Admission enlists an attendance SQL command, but direct repository writes bypass a canonical boundary | Divergent transaction paths |

## State and business-rule mapping

No approved student attendance state machine was found. In particular, the repository does not define whether `absent → excused`, `late → present`, corrections after lock, or approvals are allowed. The HR state values cannot be reused for students because they belong to employee attendance and are browser-backed.
