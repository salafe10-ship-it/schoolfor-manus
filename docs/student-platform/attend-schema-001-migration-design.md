# ATTEND-SCHEMA-001 — Migration Design

## Prepared migration

`supabase/migrations/202608111200_attend_schema_001.sql`

The file is prepared only. It has not been executed, pushed to Supabase, marked as applied, or used to reconcile migration history.

## Objects

1. `attendance_sessions`
2. `attendance_records`
3. Seven logical indexes: three session indexes and three record indexes, plus the unique indexes represented by constraints.

## Dependency order

Core tenants/schools/branches/academic years/terms/users/audit events → Students → Enrollments → `attendance_sessions` → `attendance_records`.

The SQL creates the parent session before the child record and does not alter any previous migration.

## Safety properties

- No `DROP`, `ALTER` of previous tables, destructive rewrite, seed, role, grant, RLS, trigger, function, view, or `db push` operation.
- Explicit UUID primary keys and platform-style audit/correlation metadata.
- Tenant/school/branch scoped foreign keys wherever existing parent keys support them.
- Record uniqueness for one student in one attendance session.
- State checks for session lifecycle and attendance states.
- Correction metadata pairing check.
- Indexes limited to session navigation, class daily roll, academic reporting, student history, enrollment history, and session status.

## Dependencies that remain separate

- RLS is a separate `ATTEND-RLS-001` mission.
- Live execution and staging verification are separate missions.
- Migration history reconciliation is separate and remains forbidden here.
- Legacy cutover and admission auto-present removal are separate.
- Audit and Outbox use the existing canonical platform; no new infrastructure is created here.
