# STU-AFFAIRS-P1-006-11 — Student Lifecycle Canonical Action Audit

## Scope and boundary

This audit covers lifecycle actions exposed by the current Student Affairs server/client paths: promote, re-enroll, graduate, dismiss/suspend, archive, restore, and transfer. It is discovery only. No route, service, repository, database, migration, authorization, tenant, or UnitOfWork code was modified.

## Canonical action matrix

| Operation | UI/adapter | Route | Service | Transaction | History | Audit | Outbox | Classification |
|---|---|---|---|---|---|---|---|---|
| Promote | `StudentRepository.promoteStudent`; active portal has lifecycle controls but the reviewed promotion action is not a dedicated active-portal command | `POST /api/students/:id/promote` | `StudentService.promoteStudent` → `StudentPromotionService` | `UnitOfWork.runInTransaction` | No dedicated promotion/history record observed | `AuditRepository.log` | No explicit domain outbox call observed; not proven by this audit | BLOCKED / CONTRACT GAP |
| Re-enroll | `StudentRepository.reEnrollStudent` | `POST /api/students/:id/re-enroll` | `StudentService.reEnrollStudent` → `StudentEnrollmentService` | `UnitOfWork.runInTransaction` | No dedicated enrollment history record observed | `AuditRepository.log` | No explicit domain outbox call observed | CANONICAL ROUTE / HISTORY GAP |
| Graduate | `StudentRepository.graduateStudent` | `POST /api/students/:id/graduate` | `StudentService.graduateStudent` → `StudentGraduationService` | `UnitOfWork.runInTransaction` | No dedicated graduation/status history record observed | `AuditRepository.log` | No explicit domain outbox call observed | CANONICAL ROUTE / PERSISTENCE GAP |
| Dismiss/suspend | `StudentRepository.dismissStudent` | `POST /api/students/:id/dismiss` | `StudentService.dismissStudent` → `StudentEnrollmentService` | `UnitOfWork.runInTransaction` | No dedicated transition history record observed | `AuditRepository.log` | No explicit domain outbox call observed | CANONICAL ROUTE / STATE MODEL GAP |
| Archive | `StudentRepository.archiveStudent` and portal archive/lifecycle paths | `POST /api/students/:id/archive` | `StudentService.archiveStudent` → `StudentEnrollmentService` | `UnitOfWork.runInTransaction` | No dedicated archive history record observed | `AuditRepository.log` | No explicit domain outbox call observed | CANONICAL ROUTE / HISTORY GAP |
| Restore (archive route) | `StudentRepository.archiveStudent(id, false)` | `POST /api/students/:id/archive` with `{archive:false}` | `StudentEnrollmentService.archiveStudent` | `UnitOfWork.runInTransaction` | No dedicated restore history record observed | `AuditRepository.log` | No explicit domain outbox call observed | DUPLICATE RESTORE PATH |
| Restore (delete route) | `StudentRepository.restoreStudent` | `DELETE /api/students/:id?action=restore` | `StudentWithdrawalService.deleteStudent(..., 'restore')` | `UnitOfWork.runInTransaction` | No dedicated restore history record observed | `AuditRepository.log` | No explicit domain outbox call observed | DUPLICATE RESTORE PATH |
| Transfer | `StudentRepository.transferStudent`; active portal has transfer UI | `POST /api/students/:id/transfer` | `StudentService.transferStudent` → `StudentEnrollmentService` | `UnitOfWork.runInTransaction` | `movementLog` is returned but not persisted as a domain history record | `AuditRepository.log` | No explicit domain outbox call observed | BLOCKED / TRANSFER DEPENDENCY |

## Lifecycle state model finding

`StudentLifecycleManager` currently allows a legacy status vocabulary including `accepted`, `enrolled`, `re_enrolled`, `dismissed`, `inactive`, `frozen`, and `on_leave`. The approved Student Academic Status lifecycle is `Applicant → Admitted → Active → Suspended → Withdrawn → Graduated → Archived`, with Transfer outside the status machine.

The current state machine does not contain the approved `admitted` state and uses legacy aliases. It therefore cannot be certified as the approved Academic Status Engine without a separate authorized correction. This mission records the mismatch only.

## Operation-specific findings

### Promote

- The service updates the `students` record and may enlist a carry-over invoice.
- It hardcodes `academicYear` to `2027/2028` rather than resolving a trusted academic-year/term context.
- It does not create a dedicated enrollment or promotion history record.
- The carry-over fee is accepted as an input contract value; the canonical financial authority and approval boundary are not demonstrated here.

### Re-enroll

- It validates through the current legacy lifecycle manager and updates the student to `active`.
- It records an audit entry but no dedicated enrollment/status history row was observed.
- It accepts classroom and section; academic-year/term context is not present in the operation contract.

### Graduate

- It checks `feesRemaining` before the transaction and validates the legacy transition.
- It returns a `graduateRegistry` object containing fixed/mock values (`2026/2027`, `3.92 / 4.00`, `Issued`) rather than persisting a graduation aggregate.
- The returned object must not be treated as a durable graduation certificate or source of truth.

### Dismiss/suspend

- The route accepts a body containing reason, decision number, authority, and date.
- The service maps `temporary` to `suspended` and `permanent` to `dismissed`; `dismissed` is not part of the approved status vocabulary.
- No dedicated approval or status-transition history persistence was observed.
- Client-provided decision details are included in behavior/audit descriptions; server-side approval provenance is not established by this audit.

### Archive and restore

- Two restore paths exist: the archive route and the delete route with `action=restore`.
- The server correctly rejects `action=permanent` at the canonical delete route with physical deletion disabled, but the browser repository still exposes a `permanentDeleteStudent` adapter method.
- The two restore paths delegate to different services and should not be considered one unified lifecycle contract.

### Transfer

- The route is authenticated, permission-gated, and passes through trusted tenant middleware.
- The service updates classroom, section, stage, and optionally branch; `targetSchoolId` is present in the service type but is not applied in the observed update path.
- The movement record is constructed and returned, not persisted as an immutable transfer history entity.
- Academic-year/term and enrollment transfer entities are not present in this action path.
- Cross-school transfer therefore remains a separate blocked operation, not a completed lifecycle action.

## Transaction and tenant observations

- The reviewed service operations generally enter `UnitOfWork.runInTransaction` after initial student lookup.
- The route creates trusted audit metadata server-side and applies authentication, permission, and tenant middleware.
- This audit does not certify that the legacy service contracts satisfy the approved Enrollment/Academic Status aggregates, because dedicated enrollment/status history and academic context were not demonstrated.
- No RLS, database, or production verification was performed in this mission.

## Decision

The HTTP routes and transaction wrappers exist, but lifecycle correctness is not fully canonical: the state vocabulary is legacy, history is incomplete, graduation returns mock registry data, transfer history is not durable, and restore has duplicate paths.

**Decision: LIFECYCLE AUDIT COMPLETE — ACTION CONTRACT / HISTORY / STATUS DEPENDENCIES REQUIRE SEPARATE AUTHORIZED WORK**

