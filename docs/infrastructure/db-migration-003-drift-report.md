# DB-MIGRATION-003 — Drift Report

## Confirmed Drift

1. `tenants` already exists while the remote migration history is empty; this caused the first baseline apply to fail with `SQLSTATE 42P07`.
2. All 47 expected public table names are already present, indicating a pre-existing schema or a prior manual/alternate pipeline.
3. Three auxiliary `inf001a_*` schemas contain `records` tables and data but are not represented in the ten approved migrations.
4. The database contains 264 public indexes and 6 auxiliary indexes; operational evidence reports 176 public indexes as currently unused in this low-volume Staging environment.
5. Staging contains data/identity rows (estimated public rows: 14), so an unapproved reset cannot be treated as harmless.

## Not Proven

The current evidence does not prove that the observed objects match the migration definitions for:

- columns, types, nullability, and defaults;
- primary, foreign, unique, exclusion, and check constraints;
- triggers, functions, and views;
- RLS enabled state and policy definitions;
- grants and role attributes;
- the `active -> withdrawn` check constraint;
- the exact index set versus the repository migrations.

## Tooling Evidence Gap

`supabase db diff --linked` and its explicit `--from linked --to migrations` form attempted to provision a local Shadow Database and failed because Docker Desktop is unavailable. The read-only `inspect db` commands supplied table and index operational metadata but not a complete DDL/security-object dump. No database password was available through an approved secure channel for an alternative dump path.

## Safety Conclusion

No reconciliation, history repair, compatibility migration, reset, or schema mutation should be attempted until the complete object definitions are captured and reviewed.
