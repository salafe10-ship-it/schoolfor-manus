# STU-STATUS-003 — Academic Status & Lifecycle Release-Boundary Audit

## Decision

`STU-STATUS-003 = BLOCKED — DOMAIN/SECURITY/ARCHITECTURE DECISION REQUIRED`

The discovery is complete, but no lifecycle mutation path is ready for a new implementation mission without a domain decision and an explicit canonical writer contract. This document is evidence from the repository only; it does not infer approval or authorize a mutation.

## Executive summary

The repository contains two overlapping status models:

1. A canonical database/application registration model using `student_academic_status`, `student_status_transitions`, and `student_status_history`.
2. A legacy/general Student model using `students.status`, `StudentLifecycleManager`, `StudentEnrollmentService`, `StudentPromotionService`, and `StudentRepository`.

The canonical migration permits only `applicant`, `admitted`, `active`, `suspended`, `withdrawn`, `graduated`, and `archived`. The legacy TypeScript model also permits `accepted`, `enrolled`, `re_enrolled`, `dismissed`, `frozen`, `inactive`, and `on_leave`. The repository does not prove a single application-level writer or an approved mapping between these vocabularies.

One path is demonstrably canonical: the `suspended` branch of `POST /api/students` calls `CanonicalStudentWriteRepository.suspend`, which writes status transition/history/audit data and the canonical status row in a transaction. Other lifecycle routes continue through legacy services or are fail-closed.

## Current canonical contract

The approved migration `supabase/migrations/202608061000_academic_status_engine.sql` defines:

- `student_academic_status` as the current status record, unique by tenant and student.
- `student_status_transitions` as the transition and approval/idempotency record.
- `student_status_history` as the append-only history record linked to a transition.
- The canonical status vocabulary: `applicant`, `admitted`, `active`, `suspended`, `withdrawn`, `graduated`, `archived`.
- Composite tenant/school/branch/student foreign-key scope and audit/request/correlation fields.

The registration application writes the initial `applicant` state and its transition/history records inside the SOP-001 transaction. The repository does not show a complete general-purpose Academic Status application service for all later transitions.

## Legacy contract

`src/types.ts` and `src/database/services/StudentLifecycleManager.ts` define the broader Student status vocabulary:

`applicant`, `accepted`, `enrolled`, `active`, `suspended`, `dismissed`, `graduated`, `withdrawn`, `archived`, `re_enrolled`, `frozen`, `inactive`, `on_leave`.

`StudentLifecycleManager` validates an in-memory transition map, but it is not itself proof of production route reachability, canonical persistence, immutable history, outbox behavior, or idempotency. `StudentEnrollmentService`, `StudentPromotionService`, and `StudentRepository` persist several of these operations through the legacy Student path.

## Ownership boundaries

| Area | Evidence-based owner | Current finding |
|---|---|---|
| Student Profile | Student aggregate and `students` record | Identity/demographic fields are Student Profile concerns. `students.status` overlaps with Academic Status and is not a safe independent lifecycle owner. |
| Enrollment | Enrollment tables and enrollment services | `academic_year_id`, `term_id`, enrollment status/history, and transfer belong to Enrollment. Legacy transfer/promotion/re-enrollment routes still write Student fields, so runtime ownership is not fully proven. |
| Academic Status | `student_academic_status`, transitions, and history | Canonical schema ownership is clear. Application ownership is complete only for the proven suspension path and initial registration; other transitions are not proven. |
| Lifecycle | Domain policy over Academic Status transitions | No single approved application writer for every lifecycle operation is proven. Legacy manager and services remain reachable. |

## Route reachability and persistence findings

- `POST /api/students`: production-registered; authenticated and permissioned. Updates with `status === 'suspended'` use the canonical writer. Other updates use `CanonicalStudentWriteRepository.update`, which does not establish a complete Academic Status transition for every status value.
- `POST /api/students/:id/transfer`: production-registered; authenticated, permissioned, and tenant middleware-protected. It delegates to the legacy `StudentEnrollmentService.transferStudent`, writes Student fields, and logs an audit entry. Canonical Enrollment history/outbox/idempotency is not proven.
- `POST /api/students/:id/promote`: production-registered; authenticated, permissioned, and tenant middleware-protected. It delegates to the legacy promotion service and writes classroom/stage/academic-year fields plus a possible invoice. Canonical Enrollment ownership and idempotency are not proven.
- `POST /api/students/:id/re-enroll`: production-registered; authenticated, permissioned, and tenant middleware-protected. It validates the legacy transition map and writes `students.status = 'active'`; canonical status transition/history/outbox linkage is not proven.
- `POST /api/students/:id/dismiss`: production-registered; authenticated, permissioned, and tenant middleware-protected. It writes legacy `students.status` as `suspended` or `dismissed`; only the general suspension branch is proven canonical, so this route is not proven canonical for both operations.
- `POST /api/students/:id/archive`: production-registered; authenticated, permissioned, and tenant middleware-protected. It delegates to the legacy service and changes `students.status`; canonical Academic Status history/outbox/idempotency is not proven.
- `POST /api/students/:id/graduate`: production-registered and protected, but intentionally returns `GRADUATION_NOT_READY` without mutation. Graduation remains fail-closed.
- `POST /api/students/bulk`: production-registered and authenticated/permissioned, but the route reads `req.user.schoolId` and does not show the same explicit tenant middleware in the route declaration. Its service opens a UnitOfWork and calls methods that open nested UnitOfWorks. Bulk runtime execution is therefore discovery-only and not approved.

## Transaction and persistence findings

- SOP-001 registration proves a request-scoped transaction that includes the Student, Enrollment, Academic Status, transition, history, audit, and outbox inserts.
- `CanonicalStudentWriteRepository.suspend` proves one canonical transaction for the suspension path, including audit, transition, history, status update, and outbox handling in the inspected implementation.
- Legacy lifecycle services use `UnitOfWork` and `AuditRepository`, but their writes target the legacy Student repository and can fall back to local storage after Supabase failure. They do not prove the canonical Academic Status/Enrollment history and outbox contract.
- `StudentService.executeBulkOperation` wraps a UnitOfWork and delegates to methods that also call `UnitOfWork.runInTransaction`; the current unit test explicitly rejects nested UnitOfWork execution. Bulk is not safe to promote from discovery to implementation.
- Idempotency is proven for SOP-001 and the canonical suspension writer input; it is not proven for all legacy lifecycle routes.

## Security and scope findings

The protected single-student routes show authentication, permission, and tenant middleware in their route declarations. Their services still use legacy school-scoped arguments in several paths, so academic-year and branch scope must be treated as `NOT PROVEN` unless the route/service evidence establishes it. The bulk route requires a separate tenant-scope review. No security or tenant code was changed in this mission.

## Graduation containment

Graduation remains `GRADUATION_NOT_READY`. The route and service fail closed; no graduation mutation, schema change, or status mapping was introduced.

## Bulk containment

Bulk Promote, Bulk Archive, Bulk Transfer, and related operations were inspected statically only. No bulk mutation was executed or enabled. Their writer, per-item scope, idempotency, and complete transaction semantics are not proven.

## Required decision before implementation

The next mission requires a domain/architecture decision that chooses one canonical lifecycle writer and defines the mapping, if any, between the legacy Student vocabulary and the canonical Academic Status vocabulary. It must also decide whether legacy routes are migrated, isolated, or retired. Security/tenant and transaction evidence must be accepted for the selected operation.

## Recommended next bounded action

Issue a separate implementation mission only after approving one specific operation with a canonical writer, source of truth, ownership, route scope, authorization, transaction, audit/history, outbox, and idempotency contract. Do not convert this discovery into an implementation.
