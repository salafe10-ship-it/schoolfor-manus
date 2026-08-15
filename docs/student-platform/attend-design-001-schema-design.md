# ATTEND-DESIGN-001 — Logical Schema Design

## Status

Logical design only. No table or migration is created by this document.

## Logical entity: Attendance Session

| Field group | Logical fields | Rule |
|---|---|---|
| Identity | `id` | UUID logical identifier |
| Trusted scope | `tenant_id`, `school_id`, `branch_id` | Derived from trusted server context; branch is mandatory where the school uses branches |
| Academic context | `academic_year_id`, `term_id` | Must be valid and consistent with the enrollment context |
| Teaching context | `class_id`, `section_id` | Required when the school operates class/section attendance |
| Occurrence | `attendance_date`, `period_id` or approved period key | Defines the real session; date alone is insufficient |
| Lifecycle | `status` (`open`, `locked`) | Only approved lifecycle states |
| Concurrency | `version` | Optimistic conflict detection |
| Audit | `created_at`, `created_by`, `updated_at`, `updated_by`, `audit_id`, `request_id`, `correlation_id` | Server-generated and immutable/auditable according to platform rules |
| Soft deletion | `deleted_at`, `deleted_by` | No ordinary delete; only an approved cancellation policy may use it |

## Logical entity: Attendance Record

| Field group | Logical fields | Rule |
|---|---|---|
| Identity | `id` | UUID logical identifier |
| Trusted scope | `tenant_id`, `school_id`, `branch_id` | Must match the parent session and trusted request context |
| Parent | `attendance_session_id` | Required; child cannot outlive its session |
| Student context | `student_id`, `enrollment_id` | Student must have a valid enrollment for the session’s academic context |
| State | `attendance_status` (`present`, `absent`, `late`, `excused`) | Canonical values only |
| Recording | `recorded_at`, `recorded_by` | Trusted server time and actor |
| Correction | `corrected_at`, `corrected_by`, `correction_reason` | Populated only through the correction workflow; old/new values live in Audit |
| Concurrency | `version` | Required for update/correction conflict detection |
| Audit | `created_at`, `created_by`, `updated_at`, `updated_by`, `audit_id`, `request_id`, `correlation_id` | Server-generated metadata |
| Cancellation | `deleted_at`, `deleted_by` | Not used for ordinary correction or removal |

## Normalization and authority

- Do not persist `student_name` or `classroom` as authoritative fields on the record.
- Resolve student, enrollment, class, and section through relations/read models.
- The exact physical table names, composite foreign keys, and UUID implementation belong to a later schema mission and must be checked against live evidence then.
