# STU-ENROLL-001 — Integrity Report

Date: 2026-08-11  
Scope: Enrollment, Academic Year/Term integrity, tenant context, duplicate and re-enrollment analysis

## Relationship integrity

The Enrollment migration enforces composite tenant-scoped foreign keys for:

`tenant → school → branch → student → academic_year → term → enrollment`.

It also scopes actor, audit and transfer references by tenant. The `terms` foreign key includes `academic_year_id`, preventing a term from being attached to a different academic year within the same school. `StudentRegistrationService.assertAcademicContext` additionally restricts the academic year and term to planned/active records.

The database migration is structurally prepared for tenant-aware access, but RLS is outside this mission and is not treated as proof of runtime database isolation.

## Duplicate and overlap controls

Observed database controls:

- Unique `(school_id, enrollment_number)` on `enrollments`.
- Partial unique index `(tenant_id, student_id, academic_year_id)` for `enrollment_status = 'active'` and non-deleted rows.
- GiST exclusion constraint preventing overlapping date ranges for the same tenant and student, excluding cancelled/archived rows.
- Unique `(tenant_id, idempotency_key)` on transfers.

Observed limitations:

- The active-per-year rule is database-enforced only for rows whose status is exactly `active`; pending, draft, completed, withdrawn or transferred semantics require an explicit business decision.
- No canonical application writer currently transitions an enrollment through the status set or records the corresponding history.
- Initial SOP-001 creates an enrollment with `admission_status = pending` and `enrollment_status = pending`; it therefore does not satisfy the migration's admission gate for activation until a future writer exists.
- The enrollment-number unique constraint is school-scoped, while other rules are tenant-scoped; this is structurally valid but must be confirmed as the intended business ownership rule.

## Academic Year and Term integrity

The canonical registration path validates tenant, school, lifecycle status and the requested term. The migration composite foreign keys prevent cross-school or cross-year references at the database level.

No source writer was found for changing an enrollment's academic year or term after creation. Annual movement is currently represented in legacy promotion/re-enrollment behavior rather than a canonical Enrollment command.

## Enrollment ↔ Academic Status relation

Current relation is by shared `tenant_id`, `school_id`, `branch_id`, `student_id` context only. There is no foreign key from `enrollments` to `student_academic_status`, and no canonical service was found that defines cardinality or ordering between the two aggregates.

Therefore the current relation is **student-level association, not an enforced one-to-one or one-to-many domain contract**. Direction and synchronization are unresolved.

## Re-enrollment analysis

The legacy re-enrollment endpoint updates the legacy student record to `active`, changes class/section and writes a legacy audit log. It does not:

- create or reactivate a canonical `enrollments` row;
- write `enrollment_history`;
- verify academic year/term through the canonical Enrollment repository;
- enforce the canonical active-per-year rule;
- publish an Enrollment outbox event.

This is a material integrity gap, not a cosmetic duplication.

## Transfer analysis

The canonical `enrollment_transfers` table is present and constrained, but the live transfer route updates `students` directly and returns an in-memory movement object. It does not write a transfer row or source/target enrollment pair. Cross-school transfer semantics are therefore not represented in the canonical Enrollment model.

## Transaction and audit integrity

- SOP-001 uses a single request-scoped Unit of Work for its complete registration batch and queues audit/outbox rows in that transaction.
- Legacy transfer and re-enrollment use the legacy UnitOfWork wrapper and legacy repositories; they are not proven to use the canonical transaction session or canonical audit/outbox architecture.
- The existence of a legacy transaction wrapper does not make the operation a canonical Enrollment transaction.

## Integrity decision

The schema is structurally prepared for hardening, but runtime integrity is incomplete because the only canonical writer is initial registration. Transfer, re-enrollment and later Enrollment states remain outside the canonical aggregates.

**Result: BLOCKED + RCA.**
