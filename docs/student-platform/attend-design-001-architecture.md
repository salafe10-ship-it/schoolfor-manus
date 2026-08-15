# ATTEND-DESIGN-001 — Attendance Architecture

## Status

`DESIGN COMPLETE — IMPLEMENTATION REQUIRES A SEPARATE APPROVED MISSION`

This is a logical design. It is not live-schema evidence and contains no SQL.

## Ownership and boundaries

```text
Student
  └── Enrollment (academic eligibility)
        └── Attendance Session (class/period occurrence)
              └── Attendance Record (one student result in that session)
```

- Student owns identity; Attendance never duplicates the authoritative student profile.
- Enrollment owns academic eligibility and the school/branch/year/term context required for attendance.
- Attendance Session owns the occurrence: class/section, date, period, lifecycle, and lock.
- Attendance Record owns one student’s state within one session.
- Audit and Outbox remain platform services; Attendance publishes to them through the approved transaction boundary.
- Academic Status is consulted for eligibility but does not own attendance records.
- Class/Section and Academic Year/Term are referenced context, not duplicated text snapshots.

## Aggregate boundaries

### Attendance Session aggregate

Root: `AttendanceSession`.

Children: `AttendanceRecord` rows for the same session. Session lifecycle and lock govern child mutation. A session cannot be moved across tenant, school, branch, academic year, term, class, or date context.

### Attendance Record

The record is a child of a session, not a free-standing aggregate. It cannot exist without a valid session, student, and eligible enrollment in the same trusted scope.

## Canonical writer

The future canonical writer is an Attendance application service operating through trusted request context and one transaction boundary. `AttendanceRepository` remains legacy/non-canonical until a separate implementation mission replaces or wraps it.

## Read models

Read models may project session history, student history, class daily roll, and reporting summaries. They must not become alternate write paths or authoritative sources.
