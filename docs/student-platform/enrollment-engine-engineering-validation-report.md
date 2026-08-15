# Enterprise Student Platform - Enrollment Engine

Mission: EWP-003
Scope: `enrollments`, `enrollment_history`, and `enrollment_transfers` only.

## Domain Review

### Aggregate Boundaries

- `enrollments` is the Enrollment aggregate root.
- `enrollment_history` is an append-only history record owned by an Enrollment.
- `enrollment_transfers` is a controlled workflow aggregate referencing source and destination enrollments.
- Examinations, attendance, finance, scheduling, and academic status remain outside this migration.

### Ownership

- Enrollment records are tenant-scoped and school-owned.
- Branch, academic year, and term are validated through composite foreign keys.
- Student identity is tenant-scoped so controlled transfers may cross schools within the same tenant.
- Transfer source and destination scopes are explicit and independently validated.

### Business Invariants

- Only one active enrollment exists for a student in an academic year.
- PostgreSQL exclusion constraints prevent overlapping enrollment periods for the same tenant and student.
- Activation and all closed enrollment states require an approved admission reference.
- Completed, withdrawn, and transferred enrollments require an end date.
- Completed enrollments require a completion reason.
- Withdrawn enrollments require a withdrawal reason.
- Transfer source and destination cannot be identical.
- Transfer completion requires approval, completion metadata, and a destination enrollment.
- Historical records use soft-delete metadata and history deletion is revoked for application roles.

## Static SQL Validation

- Exactly three `CREATE TABLE` statements are present.
- The migration contains one PostgreSQL extension prerequisite: `btree_gist`.
- No RLS statements are present.
- No RPC, user-defined function, trigger, view, materialized view, or data insertion statement is present.
- UUID defaults, audit metadata, request IDs, correlation IDs, versions, and soft-delete fields are present.
- Package 001 and Guardian Platform migrations are unchanged.

## Dependency Validation

Execution order:

1. Core Foundation
2. Identity Platform
3. Governance Platform
4. Student Platform Foundation
5. Guardian Platform
6. Enrollment Engine

Enrollment dependencies:

- `tenants`
- `schools`
- `branches`
- `academic_years`
- `terms`
- `users`
- `audit_events`
- `students`

Transfer dependencies:

- `enrollments`
- source and destination schools and branches
- source and destination enrollment references

History dependencies:

- `enrollments`
- optional `enrollment_transfers`
- trusted users and audit events

All foreign keys use `RESTRICT`; no orphan-producing cascade is used.

## Constraint Validation

- Primary keys are present on all three tables.
- Tenant-scoped composite foreign keys are present.
- Academic year and term ownership are validated together.
- Active enrollment uniqueness is enforced by a partial unique index.
- Period overlap is enforced by a PostgreSQL GiST exclusion constraint.
- Admission gating is enforced for activation and closed states.
- Transfer approval and completion pairs are validated.
- History status and deletion fields prevent ordinary mutation semantics.
- Version and soft-delete pairs are validated.

## Index and Performance Review

- Current enrollment lookup is tenant-first and school/branch-aware.
- Student history is ordered by start and effective dates.
- Academic year lookup supports current and reporting workflows.
- Transfer reporting supports source, destination, status, and effective date.
- No duplicate index is created for a unique constraint.
- No unnecessary JSON, full-text, or low-selectivity indexes are introduced.

## PostgreSQL and Supabase Review

- Uses PostgreSQL UUID, `date`, `timestamptz`, range exclusion, composite foreign keys, and partial indexes.
- `btree_gist` is required for UUID equality in the enrollment exclusion constraint.
- Uses no user-defined database functions.
- Uses no Supabase Auth changes, Storage changes, RLS, RPC, or platform configuration changes.
- `REVOKE` statements protect history and physical deletion paths for application roles.

## Performance Targets

- Enrollment lookup p95: ≤ 300 ms.
- Student enrollment history p95: ≤ 500 ms.
- Enrollment creation p95: ≤ 800 ms.
- Transfer completion p95: ≤ 1 second.

## Known Execution Gate

This is static validation only. The migration has not been executed against a database in this mission.

## Status

READY FOR CTO REVIEW
