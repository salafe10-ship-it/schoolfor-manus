# Enterprise Student Platform - Package 001

Mission: EWP-001
Scope: `students`, `guardians`, `student_guardians` and the Student Registration Screen Contract.

## Static SQL Validation

- Migration contains exactly three `CREATE TABLE` statements in dependency order.
- No RLS statements are present.
- No RPC, function, trigger, view, materialized view, or seed statements are present.
- UUID defaults are consistent with the certified foundation migrations.
- Audit, request, correlation, version, and soft-delete fields are present.

## Dependency Validation

- `students` depends on `tenants`, `schools`, `branches`, `users`, and `audit_events`.
- `guardians` depends on `tenants`, `schools`, `branches`, `users`, and `audit_events`.
- `student_guardians` depends on `students`, `guardians`, `schools`, `branches`, `users`, and `audit_events`.
- All referenced composite keys already exist in the certified Core, Identity, and Governance migrations.
- Delete behavior is `RESTRICT`; no orphan-producing cascade is used.

## Constraint Validation

- Primary keys: present on all three tables.
- Tenant-scoped foreign keys: present.
- School and branch ownership: validated through composite foreign keys.
- Audit actor references: tenant-scoped.
- Soft-delete pairs: validated.
- Status values: constrained.
- Version values: constrained to positive integers.
- Guardian relationship, consent, custody, and date rules: constrained.
- Student number and guardian number uniqueness: enforced.
- One active guardian relationship and one active primary guardian: enforced by partial unique indexes.

## Naming Validation

- Primary keys use `pk_`.
- Foreign keys use `fk_`.
- Constraints use `uq_` and `ck_`.
- Non-unique indexes use `idx_`.
- Partial unique indexes use `uq_`.

## Performance Review

- No duplicate index is created for a unique constraint.
- Tenant-first indexes support isolation and common school queries.
- History and guardian lookup indexes support operational workflows.
- No broad or unnecessary JSON/search indexes are created.
- No partitioning is introduced in Package 001; the schema remains partition-ready.

## PostgreSQL and Supabase Compatibility

- Uses PostgreSQL UUID, `timestamptz`, `jsonb`-free domain tables, composite foreign keys, and partial indexes.
- Uses `gen_random_uuid()` consistently with existing migrations.
- Does not alter Supabase Auth, RLS, Storage, RPC, or platform configuration.
- Must be executed after Core, Identity, and Governance migrations.

## Security Review

- Client-selected tenant, school, and branch values are not trusted by this schema design.
- Cross-tenant actor, school, branch, student, and guardian relationships are blocked by composite foreign keys.
- RLS is intentionally deferred to the approved security phase.
- No sensitive document content or authentication secret is stored by this package.

## Known Execution Gate

This report is static validation only. The migration has not been executed against a database in this mission.

## Status

READY FOR CTO REVIEW
