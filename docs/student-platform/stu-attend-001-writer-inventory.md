# STU-ATTEND-001 — Writer Inventory

| Writer / path | Scope | Storage path | Observed behavior | Assessment |
|---|---|---|---|---|
| `src/database/repositories/AttendanceRepository.ts` — `create` | Student-shaped `Attendance` | Supabase `attendance` or `FallbackStorage` | Generates a timestamp/random text id, fills defaults, inserts without trusted tenant context | Legacy writer; unsafe as enterprise canonical path |
| `AttendanceRepository.update` | Student-shaped `Attendance` | Supabase `attendance` or `FallbackStorage` | Updates by `id`; `schoolId` is not part of the Supabase update predicate | P0 isolation/integrity concern |
| `AttendanceRepository.delete` | Student-shaped `Attendance` | Supabase `attendance` or `FallbackStorage` | Deletes by `id`; no tenant/school predicate; physical delete | P0 isolation/retention concern |
| `AttendanceRepository.saveBulk` | Student-shaped `Attendance[]` | Supabase `attendance` or `FallbackStorage` | Inserts prepared records with generated ids; no canonical request/actor/context | P1 bulk integrity concern |
| `AttendanceRepository.enlistCreateAttendance` | Student admission side effect | UnitOfWork SQL command | Inserts `id, school_id, student_id, student_name, date, status, notes`; hardcodes `status='present'` | P0 schema/semantic mismatch |
| `StudentAdmissionService.createStudent` | Admission workflow | UnitOfWork affected-table list + attendance enlistment | Creates an initial present attendance row for every new student | Unapproved business coupling |
| `StudentService.update` | Student rename propagation | UnitOfWork + `enlistUpdateStudentName` | Updates attendance `student_name` by attendance id only | Legacy propagation; no tenant predicate |
| `src/components/hr/AttendanceTab.tsx` | Employees only | React state owned by HR portal | Generates/randomizes biometric results and edits employee records in memory | Not a student writer; demo/synthetic HR path |
| `src/components/hr/HumanResourcesPortal.tsx` | Employees only | `localStorage.erp_hr_attendance` | Loads/seeds/saves employee attendance in browser storage | Not a production student path |

No canonical student attendance route or service writer was found in `server.ts` or the student presentation layer.
