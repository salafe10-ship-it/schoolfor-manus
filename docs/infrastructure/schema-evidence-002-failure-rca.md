# SCHEMA-EVIDENCE-002 — Failure RCA

## Root cause

The only supported complete schema-definition paths available to the Supabase CLI require Docker Desktop. Docker Desktop is absent, and both official WinGet download attempts were rejected with HTTP 403 before installation.

## Why no workaround was used

The remaining options would require SQL Editor, direct Postgres access, privileged roles, credential-bearing dump output, or unsupported inference from table names. Each is prohibited by the CTO order and would weaken evidence integrity.

## Safest next action

Install Docker Desktop manually from an approved network/environment, or provide another approved read-only schema metadata channel. Then rerun only `SCHEMA-EVIDENCE-002`. Do not run `db push`, `migration repair`, `--include-all`, SQL Editor, direct Postgres, or any history alignment before complete definitions are available.

## Impact

- No database change.
- No migration-history change.
- No production impact.
- No application-code change.
