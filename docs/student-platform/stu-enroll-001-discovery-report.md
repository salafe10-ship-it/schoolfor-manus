# STU-ENROLL-001 — Discovery Report

Date: 2026-08-11  
Decision scope: discovery and integrity baseline only

## Route and service flow

### Canonical registration

`POST /api/student-registration`

→ `authenticateRequest`

→ `requirePermission(PERMISSIONS.STUDENT_REGISTRATION_CREATE)`

→ trusted `req.tenantContext`

→ `StudentRegistrationService.register`

→ `UnitOfWork.runInTransaction`

→ transaction-bound repositories in `StudentRegistrationRepositories.ts`

→ `students`, `guardians`, `student_guardians`, `enrollments`, academic-status tables, `audit_events`, `outbox_events`.

The canonical repositories reject execution when no active PostgreSQL transaction is present. Academic year and term are validated for tenant and school scope before the write batch.

### Legacy enrollment-related flows

`POST /api/students/:id/transfer`

→ authentication and broad `STUDENT_WRITE`

→ `StudentService.transferStudent`

→ `StudentEnrollmentService.transferStudent`

→ legacy `StudentRepository.update` on `students`

→ legacy `AuditRepository.log`.

`POST /api/students/:id/re-enroll`

→ authentication and broad `STUDENT_WRITE`

→ `StudentService.reEnrollStudent`

→ `StudentEnrollmentService.reEnrollStudent`

→ legacy `StudentRepository.update` on `students`

→ legacy `AuditRepository.log`.

These flows do not reach the canonical Enrollment repositories.

## Aggregate and ownership observations

- The migration models enrollment records as tenant-scoped, school-scoped and optionally branch-scoped records tied to a student, academic year and term.
- `enrollment_transfers` is modeled as the transfer aggregate and references source and destination enrollment records.
- `enrollment_history` is modeled as an append-only enrollment timeline and references an enrollment and optionally a transfer.
- The source code does not yet expose application services that own these two aggregates.
- The legacy `StudentEnrollmentService` still treats class, section, branch and re-enrollment as direct student updates.

## State model extracted from the project

Enrollment migration values:

- `admission_status`: `pending`, `approved`, `rejected`
- `enrollment_status`: `draft`, `pending`, `active`, `completed`, `withdrawn`, `transferred`, `cancelled`, `archived`
- transfer status: `requested`, `approved`, `rejected`, `completed`, `cancelled`, `archived`

Academic Status migration values:

- `applicant`, `admitted`, `active`, `suspended`, `withdrawn`, `graduated`, `archived`

The legacy domain also contains `enrolled`, `transferred`, `withdrawn`, `graduated`, `archived`, plus `reactivate`/`re_enrolled` behavior. This is a separate vocabulary and is not a canonical Enrollment state machine.

## State model conflict

**STATE MODEL CONFLICT — confirmed.**

The canonical Enrollment lifecycle and canonical Academic Status lifecycle use different vocabularies and transition ownership. The legacy service permits direct student status/class/branch changes without a canonical Enrollment state transition. In addition, the canonical Academic Status migration allows ordinary `withdrawn → graduated`, while the legacy Graduate operation was previously found to use `active → graduated`.

No assumption is made that these models are interchangeable.

## Required discovery decisions before hardening

1. Select the canonical writer for transfer and re-enrollment.
2. Define whether a transfer creates a new enrollment, closes the old enrollment, or both, and when `enrollment_transfers` becomes completed.
3. Define the authoritative relationship between `enrollment_status` and `student_academic_status.status`.
4. Define whether an initial SOP-001 `pending` enrollment is considered an admission record, an application, or an inactive enrollment.
5. Define the canonical `enrollment_history` event emitted for creation and every later state change.

## Discovery decision

**STU-ENROLL-001 = BLOCKED + RCA**

Root cause: multiple live writer paths and an unresolved canonical state/ownership contract. Hardening cannot begin safely without choosing one Enrollment writer and resolving the state relationship.
