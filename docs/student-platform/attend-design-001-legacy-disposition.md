# ATTEND-DESIGN-001 — Legacy Disposition

## Status

Design decision only; no source changes.

| Legacy path | Disposition | Reason / future action |
|---|---|---|
| `AttendanceRepository.create` | Deprecate then replace | Does not use canonical session/enrollment/context model |
| `AttendanceRepository.update` | Block from canonical use | Id-only update lacks scope and correction workflow |
| `AttendanceRepository.delete` | Block from canonical use | Physical delete conflicts with lock/audit/history rules |
| `AttendanceRepository.saveBulk` | Replace with idempotent session bulk operation | Existing path lacks session uniqueness and trusted metadata |
| `AttendanceRepository.hasActiveAttendance` | Re-specify | “Active attendance” is not a defined business invariant |
| `AttendanceRepository.enlistCreateAttendance` | Remove from admission flow in a later implementation mission | Admission auto-present is explicitly rejected |
| `AttendanceRepository.enlistUpdateStudentName` | Retire denormalized propagation | Student identity remains authoritative in Student; no attendance snapshot authority |
| `StudentAdmissionService.createStudent` auto-present | Remove in later implementation mission | Registration does not equal attendance |
| `HRAttendance` / `localStorage.erp_hr_attendance` | Keep separate | Employee domain; never promote as Student Attendance |

## Migration and cutover principle

No legacy data is deleted or transformed by this design. A later implementation mission must define discovery, preservation, migration, dual-read/dual-write avoidance, cutover, rollback, and deprecation telemetry.
