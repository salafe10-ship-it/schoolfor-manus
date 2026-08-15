# DB-SCHEMA-EVIDENCE-001 — Failure RCA

## Root cause

The permitted Supabase surfaces provide object names, statistics, and a limited Table Editor view, but not a complete schema-definition export. The local CLI definition-comparison paths require Docker Desktop, which is not available in the current environment.

## Why classification remains D

Matching table names cannot prove that Git SQL produced the live objects. Without columns, constraints, indexes, policy expressions, and object provenance, upgrading any migration to A would be an unsupported claim.

## Safest recommendation

Do not align migration history and do not apply migrations. Obtain a supported read-only schema-definition channel that can export the required metadata without exposing credentials, or have the CTO approve an independently verified baseline attestation. Any later action must remain Staging-only and must be separately authorized.

## No-impact statement

- No SQL was executed.
- No migration, constraint, policy, or history was changed.
- No application code was changed.
- Production was untouched.
