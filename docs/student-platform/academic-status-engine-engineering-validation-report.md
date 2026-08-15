# Enterprise Student Platform - Academic Status Engine

Mission: EWP-004
Scope: `student_academic_status`, `student_status_history`, and `student_status_transitions` only.

## Domain Review

- `student_academic_status` is the current-status record and has exactly one active row per tenant and student.
- `student_status_transitions` is the approved transition workflow and idempotency ledger.
- `student_status_history` is the append-only lifecycle record.
- Transfer is intentionally excluded and remains owned by the Enrollment Engine.

## Approved Lifecycle

Ordinary transitions are limited to:

1. Applicant → Admitted
2. Admitted → Active
3. Active → Suspended
4. Suspended → Withdrawn
5. Withdrawn → Graduated
6. Graduated → Archived

`correction` transitions are permitted only with an approved correction reference. Transfer is not a status and has no transition in this package.

## Static SQL Validation

- Exactly three `CREATE TABLE` statements are present.
- No RLS statements are present.
- No RPC, user-defined function, trigger, view, materialized view, or data insertion statement is present.
- UUID defaults, composite ownership, audit metadata, request IDs, correlation IDs, versions, and soft-delete fields are present.
- Previous Student, Guardian, and Enrollment packages are unchanged.

## Dependency Validation

Execution order:

1. Core Foundation
2. Identity Platform
3. Governance Platform
4. Student Platform Foundation
5. Guardian Platform
6. Enrollment Engine
7. Academic Status Engine

Dependencies:

- `tenants`
- `schools`
- `branches`
- `students`
- `users`
- `audit_events`
- `student_status_transitions` for history linkage

All foreign keys are tenant-scoped. All delete actions use `RESTRICT`.

## Constraint Validation

- One current academic status per tenant and student is enforced by a unique constraint.
- Status values are constrained to the approved lifecycle.
- Ordinary transition pairs are explicitly constrained.
- Correction transitions require approval and a correction reference.
- Approval and completion metadata must be complete pairs.
- History records are tied one-to-one to a transition.
- History records cannot be updated, deleted, or soft-deleted through application roles.
- Version and audit metadata are present on every table.

## Index and Performance Review

- Current status lookup is tenant, school, branch, and status indexed.
- Student timeline queries are ordered by effective and recorded dates.
- Approval queues are indexed by tenant, school, and approval status.
- Historical reporting is indexed by school, branch, target status, and effective date.
- No duplicate index names or cross-migration index collisions exist.
- No unnecessary JSON or full-text indexes are introduced.

## PostgreSQL and Supabase Review

- Uses PostgreSQL UUID, `date`, `timestamptz`, composite foreign keys, partial operational indexes, and constrained status values.
- Uses no user-defined database functions.
- Uses no Supabase Auth, Storage, RLS, RPC, or platform configuration changes.
- `REVOKE` statements protect immutable history and physical deletion paths for application roles.

## Transaction Requirement

Status transition, current-status update, history append, audit event, and Outbox event must be committed in one request-scoped transaction by the future application service.

The migration intentionally does not use triggers. Therefore, current-status/history synchronization is an application Unit-of-Work responsibility until a separately approved database enforcement phase.

## Performance Targets

- Current status lookup p95: ≤ 300 ms.
- Student status history p95: ≤ 500 ms.
- Status change command p95: ≤ 800 ms.

## Known Execution Gate

This report is static validation only. The migration has not been executed against a database in this mission.

## Status

READY FOR CTO REVIEW

