# STU-ATTEND-001 — Attendance Discovery Report

## Decision

`STU-ATTEND-001 = STOP + RCA`.

This was a static discovery mission only. No code, schema, migration, RLS, or database was changed.

## Scope reviewed

- Student attendance repository and related services.
- HR attendance UI, explicitly separated from student attendance.
- Unit of Work registration for attendance.
- Student admission and student update side effects.
- Permission registry and role mappings.
- Migration inventory and schema-auditor claims.
- Student/Enrollment/Academic Status references.

## Executive findings

1. A legacy `AttendanceRepository` exists and exposes read, create, update, delete, bulk-save, and Unit of Work enlistment paths.
2. The repository expects an `attendance` table, but no migration in `supabase/migrations` creates that table.
3. The student admission workflow automatically enlists a `present` attendance row on admission. That is an unapproved business rule because no attendance contract establishes that admission equals attendance.
4. The student attendance model is only `id`, `studentId`, `studentName`, `classroom`, `date`, and `status`; it has no tenant, branch, academic year, term, enrollment, session, actor, version, audit, or correlation fields.
5. `AttendanceRepository` receives `schoolId` but several writes do not persist it and update/delete predicates use only `id`.
6. The visible HR Attendance screen is an employee attendance feature. It uses `HRAttendance.employeeId` and browser `localStorage`; it is not a student attendance implementation and cannot be treated as the canonical student writer.
7. No canonical student attendance API route, service, state machine, or approved event contract was found.
8. The codebase contains permissions for attendance, but permission presence does not prove a working protected student attendance endpoint.

## Required conclusion

The repository does not currently provide enough coherent student-attendance semantics to safely implement or certify the module. The next action must be a separately approved attendance contract/schema mission after the CTO reviews this stop report.
