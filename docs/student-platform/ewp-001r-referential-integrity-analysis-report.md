# EWP-001R — Referential Integrity Analysis Report

## Mission

Student Platform Foundation Referential Integrity Revision.

This report analyzes the failed application of `202608051500_student_platform_foundation.sql` to the isolated Staging project. No approved migration was modified during this analysis.

## Execution Evidence

- Core Foundation migration: applied successfully to Staging.
- Identity Platform migration: applied successfully to Staging.
- Governance Platform migration: applied successfully to Staging.
- Student Platform migration: stopped at the first PostgreSQL error.
- Guardian, Enrollment, Academic Status, and Student Documents migrations: not executed.
- Production project: not accessed or modified.
- Post-failure verification: `students`, `guardians`, and `student_guardians` do not exist in `public`; the failed migration left no partial Student tables.

## Root Cause

`fk_student_guardians_student_scope` declares this reference:

```text
(tenant_id, school_id, student_id)
  REFERENCES students (tenant_id, school_id, id)
```

PostgreSQL requires the referenced columns to be backed by a primary key or an exact unique constraint in the same order. The `students` table currently declares:

- `UNIQUE (tenant_id, id)`
- `UNIQUE (school_id, student_number)`

It does not declare `UNIQUE (tenant_id, school_id, id)`. PostgreSQL therefore returns `ERROR 42830: there is no unique constraint matching given keys for referenced table "students"`.

## Composite Foreign-Key Review

| Foreign key | Referenced key | Result |
|---|---|---|
| `students(tenant_id, school_id)` | `schools(tenant_id, id)` | Valid against Core Foundation |
| `students(tenant_id, school_id, branch_id)` | `branches(tenant_id, school_id, id)` | Valid against Core Foundation |
| `students(tenant_id, created_by/updated_by/deleted_by)` | `users(tenant_id, id)` | Valid against Identity Platform |
| `students(tenant_id, audit_id)` | `audit_events(tenant_id, id)` | Valid against Governance Platform |
| `guardians(tenant_id, school_id)` | `schools(tenant_id, id)` | Valid against Core Foundation |
| `guardians(tenant_id, school_id, branch_id)` | `branches(tenant_id, school_id, id)` | Valid against Core Foundation |
| `guardians(tenant_id, created_by/updated_by/deleted_by)` | `users(tenant_id, id)` | Valid against Identity Platform |
| `guardians(tenant_id, audit_id)` | `audit_events(tenant_id, id)` | Valid against Governance Platform |
| `student_guardians(tenant_id, school_id, student_id)` | `students(tenant_id, school_id, id)` | **Invalid — root cause** |
| `student_guardians(tenant_id, guardian_id)` | `guardians(tenant_id, id)` | Valid against Student Foundation |
| `student_guardians(tenant_id, school_id)` | `schools(tenant_id, id)` | Valid against Core Foundation |
| `student_guardians(tenant_id, school_id, branch_id)` | `branches(tenant_id, school_id, id)` | Valid against Core Foundation |
| `student_guardians` audit/actor references | Matching tenant-scoped keys | Valid |

## Referential-Integrity Decision

The composite FK is not unnecessary tightening. It enforces that a StudentGuardian link cannot combine a student from one school with a link row owned by another school while preserving the existing tenant and school ownership model. Replacing it with `(tenant_id, student_id)` would make PostgreSQL accept the migration but would weaken school-scope integrity.

## Proposed Minimal Patch

Add one exact unique constraint to the `students` table, adjacent to the existing tenant-scoped identity constraint:

```sql
CONSTRAINT uq_students_tenant_school_id UNIQUE (tenant_id, school_id, id),
```

This is the smallest compatible correction because it:

1. Leaves table names, columns, relationships, and business rules unchanged.
2. Makes the existing composite FK valid without weakening school isolation.
3. Does not alter the Guardian, Enrollment, Academic Status, or Documents packages.
4. Does not require a new table, trigger, function, RLS policy, or RPC.
5. Is compatible with the existing UUID primary key and tenant-scoped uniqueness.

The constraint is logically redundant with `(tenant_id, id)` for uniqueness of the row, but it is structurally required by PostgreSQL to support the intentional three-column foreign-key target.

## Regression Impact

Expected impact is limited to the Student Foundation migration:

- Positive: the migration compiles and preserves school-scoped referential integrity.
- Positive: later packages can safely reference Student rows using tenant and school scope.
- No expected impact on Core, Identity, or Governance tables.
- No expected impact on application APIs because no column or table name changes.
- Index/storage cost: one additional unique index over three UUID/UUID-like columns; this is justified by the existing composite FK and tenant-isolation requirement.

## PostgreSQL Compatibility Plan

After CTO approval of the patch:

1. Apply the revised Student Foundation migration to the empty Staging project only.
2. Verify all three Student Foundation tables, primary keys, foreign keys, unique constraints, checks, and indexes.
3. Confirm the composite FK is valid and no partial objects remain after a forced failure test.
4. Continue with later approved migrations only after Student Foundation passes.
5. Do not apply any migration to Production during this mission.

## Status

**BLOCKED — awaiting CTO approval of the minimal one-constraint patch.**

