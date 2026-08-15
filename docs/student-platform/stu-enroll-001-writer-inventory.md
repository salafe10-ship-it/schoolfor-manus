# STU-ENROLL-001 — Enrollment Writer Inventory

Date: 2026-08-11  
Scope: discovery only; no source or database changes

## Canonical Enrollment tables

The migration `supabase/migrations/202608051700_enrollment_engine.sql` defines:

- `enrollments`
- `enrollment_history`
- `enrollment_transfers`

## Actual writer inventory

| Writer / endpoint | Operation | Tables written | Unit of Work | Trusted tenant context | Audit | Outbox | Canonical status |
|---|---|---|---|---|---|---|---|
| `POST /api/student-registration` → `StudentRegistrationService.register` → `enqueueEnrollment` | Initial registration / initial enrollment | `students`, `guardians`, `student_guardians`, `enrollments`, `student_academic_status`, `student_status_transitions`, `student_status_history`, `audit_events`, `outbox_events` | Yes. `UnitOfWork.runInTransaction`; repositories require an active PostgreSQL transaction | Yes. Route requires authentication and `STUDENT_REGISTRATION_CREATE`; handler reads `req.tenantContext`; school, branch and academic year come from trusted context | Yes. `audit_events` is queued before dependent rows | Yes. Registration outbox event is queued in same transaction | Canonical SOP-001 path |
| `POST /api/students` → `StudentService.createStudent` | Legacy student create / admission-shaped workflow | Legacy student and audit paths; no evidence of a write to `enrollments`, `enrollment_history`, or `enrollment_transfers` | Legacy UnitOfWork path; not the canonical Enrollment repository | Route is authenticated and permission-protected, but handler uses legacy `req.user.schoolId` and legacy metadata | Legacy `audit_logs` path | No Enrollment outbox event proven | Legacy / non-canonical |
| `POST /api/students/:id/transfer` → `StudentEnrollmentService.transferStudent` | Class, section, stage, branch or target-school transfer request | `students`; legacy movement object is returned; `audit_logs` is written | Legacy `UnitOfWork.runInTransaction` around legacy repository calls; not an Enrollment transaction session | Authenticated and permission-protected; target values are accepted from request body and legacy service performs only a role check for branch changes | Legacy `AuditRepository.log` | No `enrollment_transfers` or Enrollment outbox write proven | Legacy / non-canonical |
| `POST /api/students/:id/re-enroll` → `StudentEnrollmentService.reEnrollStudent` | Re-enrollment / reactivation | `students`; `audit_logs` | Legacy UnitOfWork path; not an Enrollment transaction session | Authenticated and permission-protected; uses legacy school id and request body class/section | Legacy `AuditRepository.log` | No `enrollment_history` or Enrollment outbox write proven | Legacy / non-canonical |
| `POST /api/students/bulk` → `StudentService.executeBulkOperation` | Bulk transfer, delete, promote and other legacy operations | Depends on selected operation; no canonical Enrollment write proven | Legacy service path | Authenticated and permission-protected; legacy context | Legacy audit path | No canonical Enrollment outbox write proven | Legacy / non-canonical |
| Student Affairs client services → `/api/students/:id/transfer` and `/re-enroll` | UI-triggered transfer and re-enrollment | Same legacy endpoints above | Inherits legacy endpoint path | Inherits endpoint authentication and authorization | Inherits legacy audit | No canonical Enrollment outbox write proven | Legacy / non-canonical |

## Writers not found

No production writer was found for:

- `enrollment_history`
- `enrollment_transfers`
- Enrollment status changes (`active`, `completed`, `withdrawn`, `transferred`, `cancelled`, `archived`) through a canonical application service

The only direct production write to `enrollments` found in source is `enqueueEnrollment` in `StudentRegistrationRepositories.ts`, called by SOP-001.

## Discovery conclusion

The project currently has one canonical initial-enrollment writer and multiple legacy student-lifecycle writers. The Enrollment tables are not yet the single source of truth for transfer or re-enrollment operations.
