# DB-EVIDENCE-005 — Migration State

## Target

- Supabase project: `edupro-school-erp-staging`
- Project ref: `vjcjscqgmijgzagshsca`
- Environment: Staging only

## Evidence

The official Supabase Database Migrations page displays `Run your first migration` and provides the initial `supabase link` and `supabase db push` instructions. No migration version is listed in the dashboard history.

The repository contains:

`supabase/migrations/202608111000_enroll_schema_align_001.sql`

The migration is present in Git but is not recorded as applied in Supabase Staging.

## Decision

`DB-EVIDENCE-005 = VERIFIED — MIGRATION PENDING`

This decision does not certify the live constraint expression. It establishes only that the migration has not been registered/applied through the Supabase migration history.
