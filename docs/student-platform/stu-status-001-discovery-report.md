# STU-STATUS-001 — Student Academic Status Discovery Report

## Mission Decision

**STU-STATUS-001 = BLOCKED + RCA**

The current project does not have one authoritative Student Academic Status/Lifecycle path. The code contains a canonical registration path, a legacy StudentService path, two incompatible state machines, and an existing RLS migration that uses session settings rather than the approved trusted-JWT policy contract.

No code, database, migration, RLS, authorization, or Production change was made during this discovery mission.

## 1. Current Path Map

### Path A — canonical SOP-001 registration

`POST /api/student-registration`

`authenticateRequest → StudentRegistration permission → trusted TenantContext → StudentRegistrationService → request-scoped UnitOfWork → enqueue students/academic status/transition/history/audit/outbox`

Evidence:

- `server.ts:690-710`
- `src/modules/student-registration/application/StudentRegistrationService.ts:270-480`
- `src/modules/student-registration/infrastructure/StudentRegistrationRepositories.ts:280-520`

This path creates the initial `applicant` status in:

- `students.status`
- `student_academic_status.status`
- `student_status_transitions.to_status`
- `student_status_history.to_status`

### Path B — legacy/general student lifecycle

The general route family uses `StudentService` and `StudentRepository`:

- `POST /api/students` — create/update (`server.ts:653-687`)
- `DELETE /api/students/:id?action=...` — soft delete/restore/permanent (`server.ts:836-864`)
- `POST /api/students/:id/transfer` (`server.ts:866-881`)
- `POST /api/students/:id/promote` (`server.ts:883-898`)
- `POST /api/students/:id/re-enroll` (`server.ts:900-915`)
- `POST /api/students/:id/graduate` (`server.ts:917-932`)
- `POST /api/students/:id/dismiss` (`server.ts:934-949`)
- `POST /api/students/:id/archive` (`server.ts:951-967`)

These operations mutate `students.status` through `StudentRepository.update` and legacy sub-services. They do not call the academic-status tables, create `student_status_history` rows, or create `student_status_transitions` rows.

## 2. State Vocabularies Found

### Approved database migration vocabulary

`applicant → admitted → active → suspended → withdrawn → graduated → archived`

Evidence: `supabase/migrations/202608061000_academic_status_engine.sql:52-54, 126-160`.

### Application StudentLifecycleManager vocabulary

`applicant, accepted, enrolled, active, suspended, dismissed, graduated, withdrawn, archived, re_enrolled, frozen, inactive, on_leave`

Evidence: `src/database/services/StudentLifecycleManager.ts:6-20` and `src/types.ts:114`.

### Unused/admission-domain vocabulary

`applicant, enrolled, transferred, withdrawn, graduated, archived`, with action names `admit, transfer, withdraw, graduate, reactivate, archive`.

Evidence: `src/modules/student-admission/domain/StudentLifecycle.ts:1-24`.

## 3. Canonicality Finding

`StudentLifecycleService` is not referenced by the current route graph. Its implementation updates `students.status` only through `StudentRepository.updateStatus`, uses a hard-coded `SchoolAdmin` role and `127.0.0.1` IP, and does not write the three academic-status tables.

The active general lifecycle services instead call `StudentLifecycleManager` and update the legacy student record. This makes the old lifecycle path active for customer-facing routes while the academic-status package is active only during SOP-001 registration.

## 4. Root Cause

The Student Academic Status migration was created as a schema and registration-write package, but no single application service was subsequently made authoritative for all status transitions. Earlier Student Affairs workflows remain active and use a broader, incompatible status vocabulary.

The RLS policy migration for these tables also contains `current_setting('app.*')` predicates (`supabase/migrations/202608081700_db_sec_003_rls.sql:281-310`), which conflicts with the project’s trusted-JWT isolation contract. Correcting that requires an RLS/security mission and is explicitly outside STU-STATUS-001.

## 5. Discovery Boundary

The following were intentionally not changed:

- `PermissionRegistry`, `AuthorizationEngine`, `RoleResolver`.
- `TenantEngine`, session/authentication, and trusted identity.
- `PostgresTransactionDriver` and general `UnitOfWork`.
- RLS policies, migrations, schema, database roles, and Production.
- Existing Student, Guardian, Enrollment, Finance, or Examination business logic.

## 6. Required Next Mission

The next mission must first select and enforce one authoritative academic-status service and reconcile the state vocabulary. It must also provide a separately approved security/RLS remediation path before live certification.

Until those decisions are implemented and tested, the domain cannot be marked `READY FOR HARDENING`.
