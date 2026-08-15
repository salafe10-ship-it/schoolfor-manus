# DB-MIGRATION-004 — Approved Schema Introspection

## Mission Scope

Read-only schema evidence for Supabase Staging project `vjcjscqgmijgzagshsca`. No database mutation, migration-history change, RLS change, or application change was authorized or performed.

## Approved Paths Attempted

### Supabase CLI schema diff

`supabase db diff --linked --schema public` and the explicit linked-to-migrations form both attempted to provision a local Shadow Database. They stopped because Docker Desktop is not available on this Windows environment.

### Supabase CLI schema dump

`supabase db dump --linked --schema public --file <temporary path>` was attempted through the official CLI. It stopped before creating the dump because the CLI requires Docker for the dump pipeline in this environment.

## Evidence Obtained

- `inspect db table-stats --linked`: 47 public tables, 3 auxiliary non-public tables, estimated public row count 14.
- `inspect db index-stats --linked`: 264 public indexes, 6 auxiliary indexes.
- `supabase migration list`: remote migration history is empty.
- All 47 expected public table names are present, but full definitions are not proven.

## Evidence Not Obtained

The current platform cannot provide an approved complete comparison for:

- columns, types, nullability, and defaults;
- primary, foreign, unique, check, exclusion, and partial constraints;
- exact index definitions;
- triggers, functions, and views;
- RLS enabled state, policy definitions, and grants;
- the live `active -> withdrawn` constraint.

## Credential Safety Event

The CLI `db dump --dry-run` printed its generated connection script, including a database password, to the command output. The value was not copied into any repository file, report, screenshot, or final response. The temporary Supabase access token was revoked immediately after the failed introspection attempt. The Staging database password should be rotated by the owner and any dependent Staging secret updated through the approved secret manager.

## Decision

`DB-MIGRATION-004 = BLOCKED — PLATFORM EVIDENCE LIMITATION`
