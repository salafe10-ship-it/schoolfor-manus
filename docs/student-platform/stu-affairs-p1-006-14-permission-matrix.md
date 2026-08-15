# STU-AFFAIRS-P1-006-14 — Permission Matrix

Status: `AUDIT ONLY — NO PERMISSION CHANGES`

| Operation | Permission currently enforced | Registered narrower candidate | Result |
|---|---|---|---|
| View students | `Student.View` | none | `PROVEN` |
| Export students | `Student.Export` | none | `PROVEN` |
| Create/update student | `Student.Write` | none | `OVER-PERMISSIVE CANDIDATE` |
| Register student | `Student.Registration.Create` | exact | `PROVEN` |
| Link/update guardian | `Student.Write` | `Student.Guardian.Link` exists | `MISMATCH — DECISION REQUIRED` |
| Delete/restore student | `Student.Delete` | none | `PROVEN, but action separation absent` |
| View documents | `StudentDocument.View` | exact | `PROVEN` |
| Create document metadata | `StudentDocument.Create` | exact | `PROVEN` |
| Add document version | `StudentDocument.Version.Create` | exact | `PROVEN` |
| Verify document | `StudentDocument.Verify` | exact | `PROVEN` |
| Archive/restore document | `StudentDocument.Archive` | exact | `PROVEN` |
| View document access log | `StudentDocument.AccessLog.View` | exact | `PROVEN` |
| View timeline | `Student.View` | no dedicated permission proven | `OWNER DECISION` |
| Transfer | `Student.Write` | none registered | `OVER-PERMISSIVE / BLOCKED DOMAIN` |
| Promote | `Student.Write` | none registered | `OVER-PERMISSIVE` |
| Re-enroll | `Student.Write` | none registered | `OVER-PERMISSIVE` |
| Graduate | `Student.Write` | none registered | `P0 BLOCKED / OVER-PERMISSIVE` |
| Dismiss/suspend | `Student.Write` | none registered | `OVER-PERMISSIVE` |
| Archive/restore | `Student.Write` | none registered | `OVER-PERMISSIVE` |
| Bulk operations | `Student.Write` | none registered | `P1 OVER-PERMISSIVE` |

## Role evidence

The `student_affairs` role includes broad legacy and canonical student permissions, including `student:write`, `student:delete`, `student:export`, and registration/guardian-related permissions. This confirms role capability configuration, not safe per-operation authorization.

## Required future decision

The owner must decide whether lifecycle permissions are separate operations, for example `Student.Transfer`, `Student.Promote`, `Student.ReEnroll`, `Student.Graduate`, `Student.Suspend`, `Student.Dismiss`, `Student.Archive`, `Student.Restore`, and `Student.BulkOperate`. No such permissions are added by this audit.
