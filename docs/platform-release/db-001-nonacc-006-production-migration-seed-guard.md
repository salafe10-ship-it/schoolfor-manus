# DB-001-NONACC-006 — Production Migration/Seed CLI Fail-Closed Guard

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-006`  
**Mode:** Bounded code hardening at CLI entry points  
**External mutation:** None  
**Decision:** `CODE-LEVEL CLOSED — PRODUCTION MIGRATION/SEED CLI FAIL-CLOSED`

## Change

Both explicit CLI entry points now exit with status `1` before invoking their engine when `NODE_ENV === 'production'`:

- `db:migrate` / `src/database/scripts/migrate.ts`
- `db:seed` / `src/database/scripts/seed.ts`

The seed CLI guard is unconditional for Production; `ALLOW_PRODUCTION_SEED=true` cannot bypass this entry-point safety gate.

## Scope preserved

- `DatabaseMigration` and `DatabaseSeeder` engines were not modified.
- No transaction redesign was attempted.
- No DB, SQL, schema, migration execution, seed execution, RLS, startup, accounting, tenant, authorization, staging, or production mutation.
- Development/test CLI behavior remains available because the guard is production-only.
