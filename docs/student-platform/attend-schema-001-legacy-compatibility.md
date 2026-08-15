# ATTEND-SCHEMA-001 — Legacy Compatibility

## Status

The legacy attendance paths remain untouched and non-canonical.

## Compatibility matrix

| Legacy path | Prepared-schema relationship | Decision |
|---|---|---|
| `AttendanceRepository.create/update/delete/saveBulk` against `attendance` | No direct compatibility; new canonical objects are `attendance_sessions` and `attendance_records` | Remains legacy; cutover is separate |
| `AttendanceRepository.hasActiveAttendance` | No direct equivalent | Re-specification/cutover required |
| `AttendanceRepository.enlistCreateAttendance` | Conflicts with session/enrollment model and hardcoded present | Remains unchanged but non-canonical |
| `StudentAdmissionService.createStudent` auto-present | Explicitly rejected by ATTEND-CONTRACT-002 | Removal is separate implementation work |
| `student_name` / `classroom` snapshots | Not carried into canonical records | Student and session relations are authoritative |
| HR `HRAttendance` / localStorage | Different employee domain | No compatibility or migration implied |

## No data migration

This mission does not inspect, transform, delete, or backfill legacy rows. Any legacy data conversion requires a separately approved evidence, mapping, migration, and rollback mission.
