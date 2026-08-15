# DB-MIGRATION-002 — Failure RCA

## Mission

Apply the approved ten-migration baseline to Supabase Staging project `vjcjscqgmijgzagshsca` only.

## Execution Result

- Official Supabase CLI: `2.113.0`
- Project link: successful
- Final dry run: passed and listed exactly the ten approved migrations in order
- Actual `supabase db push`: stopped at migration `202608051200_core_foundation.sql`
- Production: untouched
- Later migrations: not executed

## Exact Error

`ERROR: relation "tenants" already exists (SQLSTATE 42P07)`

The failure occurred at the first `CREATE TABLE tenants` statement in the Core Foundation migration.

## Root Cause

The Staging database contains a pre-existing `tenants` relation that is not represented in the remote migration history. A read-only `supabase migration list` showed no remote migration versions, confirming schema drift between the database and the repository migration history.

This is not a migration syntax failure. It is a baseline/schema ownership conflict.

## Safety Actions

- Stopped immediately after the first migration failure.
- Did not run any later migration.
- Did not drop, rename, alter, or recreate `tenants`.
- Did not use SQL Editor, service role, direct PostgreSQL access, or bypass.
- The temporary one-hour Supabase access token used for the controlled attempt was revoked after the stop.
- No secret was written to Git, documentation, or project files.

## Current Decision

`DB-MIGRATION-002 = BLOCKED + RCA`

## Required CTO Decision

Choose one controlled recovery path before retrying:

1. Treat the existing Staging schema as an approved baseline and create a reviewed migration-history reconciliation plan; or
2. Recreate/reset the Staging database after explicit owner approval and then apply the ten migrations from an empty baseline; or
3. Produce a reviewed compatibility migration for the existing `tenants` relation, without editing immutable migrations.

No retry is safe until the existing relation ownership, definition, and data-retention decision are approved.
