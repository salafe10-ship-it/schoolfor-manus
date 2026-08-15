# STU-AFFAIRS-P1-006-17 — Contract Drift Matrix

| Operation | UI field/action | API input | Service input | Repository/database effect | Drift |
|---|---|---|---|---|---|
| Create Student | `name`, `studentCode`, `nationalId`, `gender`, `birthDate`, `grade`, `classSection`, `status`, `address`, guardian fields | Compatibility route accepts body, then maps through `toCanonicalRegistrationCommand` | Canonical command contains identity, date, term, admission reference, guardian; no classroom/section/status/address fields | Student/guardian/enrollment/status rows are enqueued canonically; placement fields from UI are not represented in the command | HIGH — `P1-DRIFT-003` |
| Create Student | `email` | Body field | Used as guardian email fallback in `toCanonicalRegistrationCommand` | Contact may attach to guardian instead of student | MEDIUM — `P1-DRIFT-003` |
| Edit Student | `grade` → `classroom`, `classSection` → `section` | Body reaches `/api/students` | `toCanonicalStudentPatch` ignores classroom and section | No canonical placement update from edit flow | HIGH — `P1-DRIFT-002` |
| Edit Student | `status` | Body reaches `/api/students` | Only exact `suspended` is routed to `CanonicalStudentWriteRepository.suspend`; other status values are not mapped by `toCanonicalStudentPatch` | Active/withdrawn/graduated corrections may be ignored or require another workflow | HIGH — `P1-DRIFT-002` |
| Edit Student | Guardian name/phone/relation | Separate PATCH, then Student POST | Canonical Guardian service updates in its own UnitOfWork | Guardian may commit before Student update fails | HIGH — `P1-TX-004` |
| Guardian | `parentNationalId`, `parentJob` | UI blocks unsupported edits | Not sent to canonical Guardian service | No change, with truthful client error | PASS / fail-closed |
| Student Documents | Metadata, version, verify, reject, expire, archive, restore, access history | Dedicated document routes | Canonical Document service | Transactional metadata/audit/outbox path; binary artifact intentionally absent | LOW / bounded |
| Promotion | Target class/stage/carry-over fees | `/api/students/:id/promote` | Legacy `StudentPromotionService` | Legacy StudentRepository update plus invoice enlistment; hardcoded academic year | HIGH — `P1-LIFE-005` |
| Transfer | Target class/section/stage/branch | `/api/students/:id/transfer` | Legacy `StudentEnrollmentService` | Legacy StudentRepository update and movement audit; canonical enrollment history not proven | HIGH — `P1-LIFE-006` |
| Re-enrollment | Classroom/section | `/api/students/:id/re-enroll` | Legacy Enrollment service | Legacy StudentRepository update; canonical enrollment transition not proven | HIGH — `P1-LIFE-006` |
| Graduation | No academic result fields in request | `/api/students/:id/graduate` | Legacy Graduation service returns hardcoded graduate registry | Student status may persist; GPA/certificate result is not authoritative | CRITICAL — `P0-DATA-001` |
| Dismissal | Reason, decision number, authority, date | `/api/students/:id/dismiss` | Legacy Enrollment service | Legacy StudentRepository update and audit; academic status aggregate not proven | HIGH — `P1-LIFE-006` |
| Archive/Restore | `archive` boolean | `/api/students/:id/archive` | Legacy Enrollment service | Legacy StudentRepository update; canonical lifecycle path differs from DELETE route | HIGH — `P1-LIFE-006` |

## UI action truth table

| UI action | User claim | Backend reality | Classification |
|---|---|---|---|
| Save new student | “تم تسجيل الطالب” after a successful response | Canonical registration commits or throws; placement field drift remains | SUCCESS WITH CONTRACT DRIFT |
| Save edited student | “تم تعديل البيانات” after a successful response | Some displayed fields are not mapped into canonical patch | FALSE-SUCCESS RISK |
| Change guardian | “تم تعديل البيانات” after both calls complete | Two separate transactions; no composite rollback | PARTIAL COMMIT RISK |
| Suspend | “تم إيقاف القيد” after persisted response | Canonical suspend path is invoked for suspended status | CANONICAL / VERIFY LIVE |
| Re-enable suspended student | Disabled action / warning | UI refuses direct reactivation | TRUTHFUL FAIL-CLOSED |
| Delete | “تم نقل الطالب إلى سلة المحذوفات” after response | Canonical soft-delete route is used | CANONICAL / VERIFY LIVE |
| Batch transfer | Disabled warning says no student modified | No mutation is attempted | TRUTHFUL DISABLED |
| Excel import | Disabled warning says no file/no modification | No file is accepted | TRUTHFUL NOT_IMPLEMENTED |
| ID card print | Disabled | No official artifact | TRUTHFUL NOT_IMPLEMENTED |
| Certificate | “قريبًا” disabled tile | No artifact | TRUTHFUL NOT_IMPLEMENTED |
| Graduation | API message says record locked and response carries registry | Returned registry contains fabricated values | P0 FALSE SUCCESS |

