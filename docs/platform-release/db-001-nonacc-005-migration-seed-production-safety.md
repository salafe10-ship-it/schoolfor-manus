# DB-001-NONACC-005 — Migration / Seed Production-Safety Audit

**Mission:** `PROGRAM-RELEASE-P0-002 / DB-001-NONACC-005`  
**Mode:** Static/read-only discovery  
**External mutation:** None  
**Decision:** `P1/P2 STARTUP MIGRATION/SEED SAFETY GAP — IMPLEMENTATION REQUIRES BOUNDED FOLLOW-UP`

## Call graph

### Startup

`server.ts` calls `void DatabaseService.initialize()` without awaiting it. `DatabaseService.initialize()` connects to Supabase and, when connected, checks `NODE_ENV !== 'production'` before evaluating `AUTO_MIGRATE` and `AUTO_SEED`.

Therefore, when `NODE_ENV` is exactly `production`, automatic startup migration and seed are not called. This is a real guard for that exact environment value.

### Explicit migration CLI

`package.json` exposes `db:migrate`, which runs `src/database/scripts/migrate.ts`, which directly calls `DatabaseMigration.migrateAll()`. The CLI and `DatabaseMigration` itself have no production-environment guard. An operator invoking this script can reach the migration path in production.

### Explicit seed CLI

`package.json` exposes `db:seed`, which runs `src/database/scripts/seed.ts`, which directly calls `DatabaseSeeder.seedAll()`. `DatabaseSeeder` blocks production unless `ALLOW_PRODUCTION_SEED === "true"`; an explicit override can therefore reach the seed path.

## Transaction boundary

`DatabaseMigration.migrateAll()` performs student insert, exam insert, and auxiliary migration sequentially and returns a failure result from its catch block. No single `UnitOfWork`/database transaction boundary is used. Earlier successful writes can therefore remain committed if a later operation fails when the explicit path is run.

`DatabaseSeeder.seedAll()` checks and inserts schools, branches, teachers, employees, inventory, and buses sequentially. It returns the list of tables already seeded when a later insert fails. No single transaction boundary is used.

## Decision

No evidence was found that the application automatically executes these paths in an exact `NODE_ENV=production` startup. However, the explicit migration CLI is production-reachable by operator action, and the seed CLI is reachable with an explicit override. The partial-commit capability is therefore a P1/P2 operational safety gap, not a proven P0 production incident.

## Prohibited actions respected

- No migration or seed was executed.
- No database, SQL, schema, RLS, staging, or production mutation.
- No startup, migration, seed, accounting, or FallbackStorage code was modified.
