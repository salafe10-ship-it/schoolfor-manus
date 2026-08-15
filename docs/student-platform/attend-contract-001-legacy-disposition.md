# ATTEND-CONTRACT-001 — Legacy Disposition

## Status

`ARCHITECTURE DECISION REQUIRED`

No legacy code was changed.

## Legacy components

| Component | Current role | Required decision |
|---|---|---|
| `AttendanceRepository.create/update/delete/saveBulk` | Student-shaped legacy persistence paths | Retire, isolate, or replace after canonical contract and schema |
| `AttendanceRepository.hasActiveAttendance` | Student deletion/integrity check | Define whether attendance blocks deletion and under which trusted scope |
| `AttendanceRepository.enlistCreateAttendance` | Admission side effect | Decide whether it is removed; current hardcoded `present` is not accepted as policy |
| `AttendanceRepository.enlistUpdateStudentName` | Denormalized-name propagation | Decide whether name snapshots are retained or replaced by relational reads |
| `StudentAdmissionService.createStudent` | Enlists initial attendance | Business must explicitly approve or reject admission auto-present |
| `HRAttendance` | Employee attendance | Keep separate; never use as student contract |
| `localStorage.erp_hr_attendance` | Employee browser persistence | Not a production student evidence source |
| `DatabaseSchemaAuditor.tsx` attendance definition | Static UI assertion | Must not be treated as live schema evidence |

## Disposition rules

1. No legacy path may be called canonical until it satisfies the approved contract.
2. No legacy data may be deleted or transformed without an approved migration and preservation plan.
3. No source repair is included in this documentation mission.
4. Any schema, RLS, TenantEngine, Authorization, or UnitOfWork change requires its own approved mission.
