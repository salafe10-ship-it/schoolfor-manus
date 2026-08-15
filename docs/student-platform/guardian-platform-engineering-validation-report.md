# Enterprise Student Platform - Guardian Platform

Mission: EWP-002
Scope: `guardian_verifications` and `guardian_contact_preferences` only.

## CTO Review Comment Handling

No approved EWP-001 CTO comments were present in the workspace or available mission context. Package 001 was not redesigned or modified.

## Guardian Aggregate Review

The existing `guardians` table remains the Guardian aggregate root and source of truth for identity and profile fields. This package adds only Guardian-owned extensions:

- `guardian_verifications`: verification attempts and review state.
- `guardian_contact_preferences`: communication consent and preference state.

Student ownership, enrollment, academic status, documents, and relationship lifecycle remain outside this migration.

## Static SQL Validation

- Exactly two `CREATE TABLE` statements are present.
- No RLS statements are present.
- No RPC, function, trigger, view, materialized view, or seed statements are present.
- UUID defaults and audit metadata match the certified foundation migrations.
- Request ID, correlation ID, version, and soft-delete fields are present on both tables.
- Package 001 migration files are unchanged.

## Dependency Validation

- Both tables reference `guardians` through `(tenant_id, guardian_id)`.
- Optional school and branch scope references use tenant-scoped composite foreign keys.
- Audit actors use tenant-scoped references to `users`.
- Audit references use tenant-scoped references to `audit_events`.
- All dependencies are provided by Core, Identity, Governance, and Package 001 migrations.
- All delete actions use `RESTRICT`.

## Constraint Validation

- Primary keys exist on both tables.
- Verification type, status, source, evidence hashes, review dates, and lifecycle rules are constrained.
- Contact channels, purposes, consent states, date ranges, quiet hours, and lifecycle rules are constrained.
- Soft-delete metadata must remain internally consistent.
- Verification and preference records cannot cross tenant boundaries.
- Active duplicate verification types are blocked.
- Active duplicate contact preferences are blocked.

## Naming Validation

- Primary keys use `pk_`.
- Foreign keys use `fk_`.
- Unique constraints and unique indexes use `uq_`.
- Check constraints use `ck_`.
- Non-unique indexes use `idx_`.

## Performance Review

- Tenant and guardian are leading index columns.
- Expiry lookup is isolated to active verification records.
- No duplicate index is created for a unique constraint.
- No broad JSON, full-text, or unnecessary indexes are introduced.
- Tables remain ready for future partitioning by tenant or time if volume requires it.

## PostgreSQL and Supabase Review

- Uses PostgreSQL UUID, `timestamptz`, `time`, composite foreign keys, partial unique indexes, and partial lookup indexes.
- Uses `gen_random_uuid()` consistently with existing migrations.
- Does not alter Supabase Auth, Storage, RLS, RPC, or platform configuration.
- Must execute after Core, Identity, Governance, and Package 001 migrations.

## Security Review

- Raw identity documents, tokens, provider secrets, and message content are not stored.
- Evidence and external references are represented by hashes only.
- Tenant, school, branch, guardian, actor, and audit references are scope-validated.
- RLS remains a separate required security phase.

## Known Execution Gate

This report is static validation only. The migration has not been executed against a database in this mission.

## Status

READY FOR CTO REVIEW

